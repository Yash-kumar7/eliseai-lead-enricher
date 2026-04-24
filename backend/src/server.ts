import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import staticFiles from "@fastify/static";
import Fastify from "fastify";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { config, warnMissingKeys } from "./config.js";
import { enrichedLeadsToCsv, parseLeadsCsv } from "./csv.js";
import { getProviderInfo } from "./llm/index.js";
import { enrichLead, enrichLeads } from "./pipeline.js";
import {
  ensureCronDirs,
  INBOX,
  OUTBOX,
  PROCESSED,
  runCron,
} from "./scheduled-run.js";

const isProd = process.env.NODE_ENV === "production";
const FRONTEND_DIST = fileURLToPath(new URL("../../frontend/dist", import.meta.url));

const LeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().min(1),
  propertyAddress: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().optional(),
});

async function main() {
  warnMissingKeys();

  const app = Fastify({ logger: { level: "info" }, connectionTimeout: 120000, requestTimeout: 120000 });

  const allowedOrigins = config.allowedOrigins
    ? config.allowedOrigins.split(",").map((o) => o.trim())
    : ["http://localhost:5173", "http://127.0.0.1:5173"];

  await app.register(cors, { origin: isProd ? true : allowedOrigins });
  await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  if (isProd && existsSync(FRONTEND_DIST)) {
    await app.register(staticFiles, { root: FRONTEND_DIST, prefix: "/" });
    app.setNotFoundHandler((_req, reply) => {
      reply.sendFile("index.html");
    });
  }

  app.get("/api/health", async () => ({
    status: "ok",
    hasNews: !!config.newsapiKey,
    hasWeather: !!config.openweatherKey,
    llm: getProviderInfo(),
  }));

  app.post("/api/enrich", async (req, reply) => {
    const parsed = LeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid lead",
        details: parsed.error.flatten(),
      });
    }
    const enriched = await enrichLead(parsed.data);
    return enriched;
  });

  app.post("/api/enrich/batch", async (req, reply) => {
    const file = await req.file();
    if (!file) {
      return reply.code(400).send({ error: "No file uploaded" });
    }
    const buf = await file.toBuffer();
    const text = buf.toString("utf-8");
    let leads;
    try {
      leads = parseLeadsCsv(text);
    } catch (err) {
      return reply.code(400).send({ error: (err as Error).message });
    }
    if (leads.length > 50) {
      return reply.code(400).send({
        error: "Batch limit is 50 leads (free tier API limits). Split the CSV.",
      });
    }
    const enriched = await enrichLeads(leads);
    return { count: enriched.length, leads: enriched };
  });

  app.post("/api/enrich/batch/csv", async (req, reply) => {
    const body = req.body as { csv?: string };
    if (!body?.csv) {
      return reply.code(400).send({ error: "Missing csv field" });
    }
    let leads;
    try {
      leads = parseLeadsCsv(body.csv);
    } catch (err) {
      return reply.code(400).send({ error: (err as Error).message });
    }
    if (leads.length > 50) {
      return reply.code(400).send({
        error: "Batch limit is 50 leads (free tier API limits). Split the CSV.",
      });
    }
    const enriched = await enrichLeads(leads);
    return { count: enriched.length, leads: enriched };
  });

  // ──────────────────────────────────────────────────────────
  // Scheduled (cron inbox/outbox), UI surface for the nightly run
  // ──────────────────────────────────────────────────────────

  function listDir(dir: string) {
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith(".csv"))
      .map((name) => {
        const s = statSync(join(dir, name));
        return { name, size: s.size, mtime: s.mtime.toISOString() };
      })
      .sort((a, b) => (a.mtime < b.mtime ? 1 : -1));
  }

  app.get("/api/scheduled/list", async () => {
    ensureCronDirs();
    return {
      inbox: listDir(INBOX),
      outbox: listDir(OUTBOX),
      processed: listDir(PROCESSED),
    };
  });

  app.post("/api/scheduled/upload", async (req, reply) => {
    ensureCronDirs();
    const file = await req.file();
    if (!file) {
      return reply.code(400).send({ error: "No file uploaded" });
    }
    if (!file.filename.toLowerCase().endsWith(".csv")) {
      return reply.code(400).send({ error: "CSV files only" });
    }
    const buf = await file.toBuffer();
    const text = buf.toString("utf-8");
    // Quick validation so bad CSVs don't land in inbox/ and break the cron.
    try {
      parseLeadsCsv(text);
    } catch (err) {
      return reply.code(400).send({ error: (err as Error).message });
    }
    const safe = basename(file.filename).replace(/[^a-zA-Z0-9._-]/g, "_");
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const name = `${ts}_${safe}`;
    writeFileSync(join(INBOX, name), text, "utf-8");
    return { filename: name, size: buf.length };
  });

  app.delete<{ Params: { filename: string } }>(
    "/api/scheduled/processed/:filename",
    async (req, reply) => {
      const raw = req.params.filename;
      const safe = basename(raw);
      if (safe !== raw || extname(safe).toLowerCase() !== ".csv") {
        return reply.code(400).send({ error: "Invalid filename" });
      }
      const path = join(PROCESSED, safe);
      if (!existsSync(path)) {
        return reply.code(404).send({ error: "Not found" });
      }
      const { unlinkSync } = await import("node:fs");
      unlinkSync(path);
      return { deleted: safe };
    },
  );

  app.delete<{ Params: { filename: string } }>(
    "/api/scheduled/outbox/:filename",
    async (req, reply) => {
      const raw = req.params.filename;
      const safe = basename(raw);
      if (safe !== raw || extname(safe).toLowerCase() !== ".csv") {
        return reply.code(400).send({ error: "Invalid filename" });
      }
      const path = join(OUTBOX, safe);
      if (!existsSync(path)) {
        return reply.code(404).send({ error: "Not found" });
      }
      const { unlinkSync } = await import("node:fs");
      unlinkSync(path);
      return { deleted: safe };
    },
  );

  app.delete<{ Params: { filename: string } }>(
    "/api/scheduled/inbox/:filename",
    async (req, reply) => {
      const raw = req.params.filename;
      const safe = basename(raw);
      if (safe !== raw || extname(safe).toLowerCase() !== ".csv") {
        return reply.code(400).send({ error: "Invalid filename" });
      }
      const path = join(INBOX, safe);
      if (!existsSync(path)) {
        return reply.code(404).send({ error: "Not found" });
      }
      const { unlinkSync } = await import("node:fs");
      unlinkSync(path);
      return { deleted: safe };
    },
  );

  app.post("/api/scheduled/run", async () => {
    return runCron();
  });

  app.get<{ Params: { filename: string } }>(
    "/api/scheduled/download/:filename",
    async (req, reply) => {
      const raw = req.params.filename;
      // Strip any path separators and parent-dir hops.
      const safe = basename(raw);
      if (safe !== raw || extname(safe).toLowerCase() !== ".csv") {
        return reply.code(400).send({ error: "Invalid filename" });
      }
      const path = join(OUTBOX, safe);
      if (!existsSync(path)) {
        return reply.code(404).send({ error: "Not found" });
      }
      const data = readFileSync(path);
      reply
        .header("content-type", "text/csv")
        .header("content-disposition", `attachment; filename="${safe}"`)
        .send(data);
    },
  );

  app.post("/api/export", async (req, reply) => {
    const body = req.body as { leads?: unknown };
    if (!Array.isArray(body?.leads)) {
      return reply.code(400).send({ error: "leads[] required" });
    }
    const csv = enrichedLeadsToCsv(body.leads as Parameters<typeof enrichedLeadsToCsv>[0]);
    reply
      .header("content-type", "text/csv")
      .header(
        "content-disposition",
        `attachment; filename="enriched_${Date.now()}.csv"`,
      )
      .send(csv);
  });

  // ──────────────────────────────────────────────────────────
  // Webhook trigger — called by Google Sheets / CRM / Zapier
  // ──────────────────────────────────────────────────────────

  app.post("/api/webhooks/enrich", async (req, reply) => {
    if (config.webhookSecret) {
      const token = (req.headers["x-webhook-secret"] as string) ?? "";
      if (token !== config.webhookSecret) {
        return reply.code(401).send({ error: "Unauthorized" });
      }
    }
    const parsed = LeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid lead",
        details: parsed.error.flatten(),
      });
    }
    const enriched = await enrichLead(parsed.data);
    return {
      score: enriched.score.total,
      tier: enriched.score.tier,
      reasons: enriched.score.reasons,
      emailSubject: enriched.email.subject,
      emailBody: enriched.email.body,
      rentalVacancy: enriched.enrichment.fred?.rentalVacancyRate ?? null,
      enrichedAt: enriched.enrichedAt,
    };
  });

  try {
    await app.listen({ port: config.port, host: "0.0.0.0" });
    app.log.info(`EliseAI lead enricher listening on :${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();

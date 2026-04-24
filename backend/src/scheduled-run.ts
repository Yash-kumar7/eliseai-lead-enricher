/**
 * Cron entry point. Reads every CSV in packages/backend/inbox/,
 * enriches each, writes one enriched CSV per input to outbox/ with timestamp.
 *
 * Usage (manual): npm run cron --workspace=@eliseai/backend
 * Cron: see crontab.example
 *
 * Also exposed as `runCron()` for the API endpoint at POST /api/scheduled/run.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import type { EnrichedLead } from "@eliseai/shared";
import { warnMissingKeys } from "./config.js";
import { enrichedLeadsToCsv, parseLeadsCsv } from "./csv.js";
import { enrichLeads } from "./pipeline.js";

export const INBOX = "inbox";
export const OUTBOX = "outbox";
export const PROCESSED = "inbox/processed";

export interface CronFileResult {
  input: string;
  output?: string;
  leadsProcessed?: number;
  error?: string;
}

export interface CronSummary {
  processed: CronFileResult[];
  totalLeads: number;
  durationMs: number;
  leads: EnrichedLead[];
}

export function ensureCronDirs(): void {
  for (const dir of [INBOX, OUTBOX, PROCESSED]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
}

export async function runCron(): Promise<CronSummary> {
  const start = Date.now();
  ensureCronDirs();

  const files = readdirSync(INBOX).filter((f) => f.toLowerCase().endsWith(".csv"));
  if (files.length === 0) {
    return { processed: [], totalLeads: 0, durationMs: Date.now() - start, leads: [] };
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const results: CronFileResult[] = [];
  const allLeads: EnrichedLead[] = [];
  let totalLeads = 0;

  for (const file of files) {
    const inputPath = join(INBOX, file);
    try {
      const text = readFileSync(inputPath, "utf-8");
      const leads = parseLeadsCsv(text);
      const enriched = await enrichLeads(leads);
      const outputName = `enriched_${basename(file, ".csv")}_${ts}.csv`;
      const outPath = join(OUTBOX, outputName);
      writeFileSync(outPath, enrichedLeadsToCsv(enriched), "utf-8");
      renameSync(inputPath, join(PROCESSED, `${ts}_${file}`));
      results.push({ input: file, output: outputName, leadsProcessed: leads.length });
      allLeads.push(...enriched);
      totalLeads += leads.length;
    } catch (err) {
      results.push({ input: file, error: (err as Error).message });
    }
  }

  return { processed: results, totalLeads, durationMs: Date.now() - start, leads: allLeads };
}

// CLI entry, only runs when invoked directly, not when imported.
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  warnMissingKeys();
  if (!existsSync(INBOX)) {
    console.log(`[cron] no inbox directory at ${INBOX}, nothing to do`);
  } else {
    runCron()
      .then((summary) => {
        if (summary.processed.length === 0) {
          console.log(`[cron] inbox empty, done`);
          return;
        }
        for (const r of summary.processed) {
          if (r.error) console.error(`[cron] failed on ${r.input}: ${r.error}`);
          else console.log(`[cron] ${r.input} → ${r.output} (${r.leadsProcessed} leads)`);
        }
        console.log(`[cron] complete. ${summary.totalLeads} leads in ${summary.durationMs}ms`);
      })
      .catch((err) => {
        console.error("[cron] fatal:", err);
        process.exit(1);
      });
  }
}

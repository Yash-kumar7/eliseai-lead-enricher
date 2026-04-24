import type { EnrichedLead } from "@eliseai/shared";
import { ArrowRight, CheckCircle2, Download, FileSpreadsheet, PlayCircle, Trash2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteInboxFile,
  deleteOutboxFile,
  deleteProcessedFile,
  downloadScheduledUrl,
  exportCsv,
  listScheduled,
  runScheduled,
  type CronSummary,
  type ScheduledFile,
  type ScheduledList,
  uploadScheduled,
} from "../api.ts";
import { SAMPLE_ENRICHED } from "../sample-results.ts";
import { COLOR, tint } from "../theme.ts";
import { LeadDrawer } from "./LeadDrawer.tsx";
import { PipelineProgress } from "./PipelineProgress.tsx";
import { ResultsTable } from "./ResultsTable.tsx";

interface Props {
  keysMissing?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ScheduledPanel({ keysMissing }: Props) {
  const [list, setList] = useState<ScheduledList | null>(null);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [mockPending, setMockPending] = useState(false);
  const [lastRun, setLastRun] = useState<(CronSummary & { source: "run" | "sample" }) | null>(null);
  const [runLeads, setRunLeads] = useState<EnrichedLead[]>([]);
  const [selected, setSelected] = useState<EnrichedLead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await listScheduled();
      setList(next);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleUpload(file: File) {
    setBusy(true);
    setError(null);
    try {
      await uploadScheduled(file);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function mockSummary(): CronSummary {
    return {
      processed: [
        {
          input: "sample_leads.csv",
          output: "enriched_sample_leads_demo.csv",
          leadsProcessed: SAMPLE_ENRICHED.length,
        },
      ],
      totalLeads: SAMPLE_ENRICHED.length,
      durationMs: 800,
      leads: SAMPLE_ENRICHED,
    };
  }

  async function loadSample() {
    setBusy(true);
    setError(null);
    try {
      // Keys missing → skip the real upload entirely and inject mock
      // straight into results. No point staging a file we can't score.
      if (keysMissing) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        setMockPending(true);
        setBusy(false);
        return;
      }
      const res = await fetch("/sample_leads.csv");
      if (!res.ok) throw new Error(`fetch sample → ${res.status}`);
      const text = await res.text();
      const file = new File([text], "sample_leads.csv", { type: "text/csv" });
      await uploadScheduled(file);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRun() {
    setRunning(true);
    setError(null);
    try {
      if (keysMissing) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const summary = mockSummary();
        setMockPending(false);
        setLastRun({ ...summary, source: "run" });
        setRunLeads(summary.leads);
      } else {
        const summary = await runScheduled();
        setLastRun({ ...summary, source: "run" });
        setRunLeads(summary.leads);
        await refresh();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  }

  const pendingCount = keysMissing ? (mockPending ? 1 : 0) : (list?.inbox.length ?? 0);

  return (
    <div className="space-y-6">
      <div className="card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
              Scheduled batches
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Drop CSVs into the inbox. Cron fires daily at <span className="mono font-medium text-slate-700 dark:text-zinc-300">9:00 AM</span>, or trigger a run on demand. Enriched output lands in the outbox.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadSample}
              disabled={busy || running}
              className="btn-secondary"
            >
              Load sample leads
            </button>
            <button
              type="button"
              onClick={handleRun}
              disabled={running || busy || pendingCount === 0}
              className="btn-primary"
            >
              <PlayCircle size={16} aria-hidden="true" />
              {running ? "Running…" : `Run now${pendingCount ? ` (${pendingCount})` : ""}`}
            </button>
          </div>
        </div>

        <div
          role="button"
          tabIndex={busy ? -1 : 0}
          aria-label="Upload CSV to inbox"
          aria-disabled={busy || undefined}
          onClick={() => !busy && fileRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !busy) {
              e.preventDefault();
              fileRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (busy) return;
            const f = e.dataTransfer.files?.[0];
            if (f) handleUpload(f);
          }}
          className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors duration-200 ${
            busy ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
          } ${
            dragging
              ? "border-[#7638fa] bg-[#7638fa]/5"
              : "border-slate-300 bg-gradient-to-br from-slate-50 via-white to-brand-50/40 hover:border-[#7638fa]/60 dark:border-zinc-700 dark:from-zinc-950 dark:via-zinc-900 dark:to-brand-950/20"
          }`}
        >
          <div
            className="mx-auto mb-3 w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: tint(COLOR.brand) }}
          >
            <Upload size={24} style={{ color: COLOR.brand }} aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">
            {busy ? "Uploading…" : dragging ? "Drop to queue" : "Drop a CSV into the inbox"}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
            Files wait here until the next cron run, or click Run now.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-sm text-red-800 dark:text-red-300 p-3"
          >
            {error}
          </div>
        )}

        {lastRun && (
          <div
            className="rounded border p-4 flex items-start gap-3"
            style={{
              borderColor: tint(COLOR.emerald),
              backgroundColor: `${COLOR.emerald}0d`,
            }}
          >
            <CheckCircle2
              size={18}
              style={{ color: COLOR.emerald }}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div className="text-sm text-slate-700 dark:text-zinc-300 flex-1">
              <p className="font-medium flex items-center gap-2 flex-wrap">
                {lastRun.source === "sample" ? (
                  <>
                    Demo preview.{" "}
                    <span className="mono font-semibold">{lastRun.totalLeads}</span> sample lead
                    {lastRun.totalLeads === 1 ? "" : "s"} loaded.
                  </>
                ) : (
                  <>
                    Run complete. Processed{" "}
                    <span className="mono font-semibold">{lastRun.processed.length}</span> file
                    {lastRun.processed.length === 1 ? "" : "s"},{" "}
                    <span className="mono font-semibold">{lastRun.totalLeads}</span> lead
                    {lastRun.totalLeads === 1 ? "" : "s"} in{" "}
                    <span className="mono">{(lastRun.durationMs / 1000).toFixed(1)}s</span>.
                  </>
                )}
                {lastRun.source === "sample" && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide"
                    style={{
                      backgroundColor: tint(COLOR.amber),
                      color: COLOR.amber,
                    }}
                  >
                    demo mode
                  </span>
                )}
              </p>
              {lastRun.source === "sample" && (
                <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
                  API keys missing. Set <code className="mono">CENSUS_KEY</code>,{" "}
                  <code className="mono">NEWSAPI_KEY</code>,{" "}
                  <code className="mono">OPENWEATHER_KEY</code> in{" "}
                  <code className="mono">backend/.env</code>, then click Run now to enrich against
                  the real pipeline.
                </p>
              )}
              {lastRun.processed.some((p) => p.error) && (
                <ul className="mt-2 space-y-0.5 text-xs text-red-700 dark:text-red-400">
                  {lastRun.processed
                    .filter((p) => p.error)
                    .map((p) => (
                      <li key={p.input}>
                        {p.input}: {p.error}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {running && <PipelineProgress />}

      {runLeads.length > 0 && (
        <div>
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
              Run results <span className="mono text-slate-500 dark:text-zinc-500 font-normal">({runLeads.length})</span>
            </h2>
            <button
              type="button"
              className="btn-secondary text-xs px-3 py-1.5"
              onClick={() => exportCsv(runLeads)}
            >
              <Download size={13} aria-hidden="true" />
              Export CSV
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total" value={runLeads.length} color={COLOR.slate} />
            <StatCard label="Avg score" value={Math.round(runLeads.reduce((s, r) => s + r.score.total, 0) / runLeads.length)} color={COLOR.brand} />
            <StatCard label="Hot" value={runLeads.filter((r) => r.score.tier === "Hot").length} color={COLOR.rose} />
            <StatCard label="Warm" value={runLeads.filter((r) => r.score.tier === "Warm").length} color={COLOR.amber} />
          </div>
          <ResultsTable leads={runLeads} onSelect={setSelected} />
        </div>
      )}

      {!keysMissing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <FileList
            title="Inbox"
            subtitle="Waiting for next run"
            empty="No CSVs queued."
            files={list?.inbox ?? []}
            emptyIconColor={COLOR.slate}
            onDelete={async (name) => {
              await deleteInboxFile(name);
              await refresh();
            }}
          />
          <FileList
            title="Outbox"
            subtitle="Enriched results"
            empty="No enriched outputs yet."
            files={list?.outbox ?? []}
            emptyIconColor={COLOR.emerald}
            downloadable
            onDelete={async (name) => {
              await deleteOutboxFile(name);
              await refresh();
            }}
          />
        </div>
      )}

      {!keysMissing && list && list.processed.length > 0 && (
        <FileList
          title="Processed inputs"
          subtitle="Archived from inbox after each run"
          empty=""
          files={list.processed}
          emptyIconColor={COLOR.slate}
          compact
          onDelete={async (name) => {
            await deleteProcessedFile(name);
            await refresh();
          }}
        />
      )}

      <LeadDrawer lead={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function FileList({
  title,
  subtitle,
  empty,
  files,
  emptyIconColor,
  downloadable = false,
  compact = false,
  onDelete,
}: {
  title: string;
  subtitle: string;
  empty: string;
  files: ScheduledFile[];
  emptyIconColor: string;
  downloadable?: boolean;
  compact?: boolean;
  onDelete?: (name: string) => Promise<void>;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-zinc-100">{title}</h3>
        <span className="text-xs text-slate-500 dark:text-zinc-500">{subtitle}</span>
      </div>
      {files.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-500 py-4">
          <X size={14} style={{ color: emptyIconColor }} aria-hidden="true" />
          {empty}
        </div>
      ) : (
        <ul className={`divide-y divide-slate-100 dark:divide-zinc-800 ${compact ? "text-xs" : "text-sm"}`}>
          {files.map((f) => (
            <li key={f.name} className="flex items-center gap-3 py-2.5">
              <FileSpreadsheet
                size={compact ? 13 : 15}
                className="text-slate-400 dark:text-zinc-600 shrink-0"
                aria-hidden="true"
              />
              <span className="mono truncate flex-1 text-slate-700 dark:text-zinc-300">
                {f.name}
              </span>
              <span className="mono text-[11px] text-slate-500 dark:text-zinc-500 shrink-0">
                {formatSize(f.size)}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-500 shrink-0 w-28 text-right">
                {formatTime(f.mtime)}
              </span>
              {downloadable && (
                <a
                  href={downloadScheduledUrl(f.name)}
                  download={f.name}
                  className="w-7 h-7 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 shrink-0"
                  aria-label={`Download ${f.name}`}
                >
                  <Download size={13} aria-hidden="true" />
                </a>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(f.name)}
                  className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:text-zinc-600 dark:hover:text-red-400 dark:hover:bg-red-950/30 shrink-0 transition-colors duration-150"
                  aria-label={`Delete ${f.name}`}
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color }}>
        {label}
      </div>
      <div className="mono text-3xl font-semibold mt-1.5 leading-none" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

// re-export so App.tsx can render a nice "Scheduled" tab button icon
export { ArrowRight };

import type { EnrichedLead, Lead } from "@eliseai/shared";
import {
  AlertTriangle,
  Building2,
  Calendar,
  Download,
  FileText,
  Link2,
  Moon,
  Sparkles,
  Sun,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  enrichBatchCsv,
  enrichOne,
  exportCsv,
  getHealth,
  type HealthResponse,
} from "./api.ts";
import { CsvUpload } from "./components/CsvUpload.tsx";
import { IntegrationsPanel } from "./components/IntegrationsPanel.tsx";
import { PipelineProgress } from "./components/PipelineProgress.tsx";
import { Landing } from "./components/Landing.tsx";
import { LeadDrawer } from "./components/LeadDrawer.tsx";
import { LeadForm } from "./components/LeadForm.tsx";
import { ResultsTable } from "./components/ResultsTable.tsx";
import { ScheduledPanel } from "./components/ScheduledPanel.tsx";
import { useTheme } from "./hooks/useTheme.ts";
import { SAMPLE_ENRICHED } from "./sample-results.ts";
import { COLOR, tint } from "./theme.ts";

type Tab = "single" | "batch" | "scheduled" | "integrations";
type View = "landing" | "app";

const DEMO_PATH = "/demo";

function viewFromPath(path: string): View {
  return path.startsWith(DEMO_PATH) ? "app" : "landing";
}

function initialView(): View {
  if (typeof window === "undefined") return "landing";
  return viewFromPath(window.location.pathname);
}

export default function App() {
  const { mode, toggle } = useTheme();
  const [view, setView] = useState<View>(initialView);
  const [tab, setTab] = useState<Tab>("batch");
  const [results, setResults] = useState<EnrichedLead[]>([]);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<EnrichedLead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    const onPop = () => setView(viewFromPath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function enterApp() {
    if (window.location.pathname !== DEMO_PATH) {
      window.history.pushState({}, "", DEMO_PATH);
    }
    setView("app");
    window.scrollTo({ top: 0 });
  }

  function backToLanding() {
    if (window.location.pathname !== "/") {
      window.history.pushState({}, "", "/");
    }
    setView("landing");
    window.scrollTo({ top: 0 });
  }

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth(null));
  }, []);

  async function handleSingle(lead: Lead) {
    setBusy(true);
    setError(null);
    try {
      const enriched = await enrichOne(lead);
      setResults((prev) => [enriched, ...prev]);
      setSelected(enriched);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const keysMissing =
    !health || !health.hasNews || !health.hasWeather;

  async function handleEnrich(csv: string, isSample: boolean) {
    setBusy(true);
    setError(null);

    // Sample demo path when API keys are missing: inject pre-baked enriched
    // results so the UI shows realistic tiers. Real keys → always hit backend.
    if (isSample && keysMissing) {
      await new Promise((resolve) =>
        setTimeout(resolve, 8 * 700 + 200),
      );
      setResults(SAMPLE_ENRICHED);
      setBusy(false);
      return;
    }

    try {
      const enriched = await enrichBatchCsv(csv);
      setResults(enriched);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleExport() {
    if (results.length === 0) return;
    await exportCsv(results);
  }

  const hot  = results.filter((r) => r.score.tier === "Hot").length;
  const warm = results.filter((r) => r.score.tier === "Warm").length;
  const cold = results.filter((r) => r.score.tier === "Cold").length;
  const avg =
    results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.score.total, 0) / results.length)
      : null;

  if (view === "landing") {
    return <Landing onStart={enterApp} />;
  }

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={backToLanding}
            aria-label="Back to home"
            className="flex items-center gap-3 min-w-0 rounded p-1 -m-1 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors duration-150 cursor-pointer"
          >
            <img src="/eliseai-logo.svg" alt="EliseAI" className="h-6 w-auto block dark:hidden" />
            <img src="/eliseai-logo-white.svg" alt="EliseAI" className="h-6 w-auto hidden dark:block" />
            <span className="text-sm text-slate-500 dark:text-zinc-500 border-l border-slate-300 dark:border-zinc-700 pl-3">
              Lead Enricher
            </span>
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggle}
              aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
              className="w-9 h-9 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer"
            >
              {mode === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 md:py-8 space-y-8">
        <div className="space-y-4">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: tint(COLOR.brand), color: COLOR.brand }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: COLOR.brand }}
              aria-hidden="true"
            />
            Live enrichment demo
          </span>
          <h1 className="h-elise text-3xl md:text-[2.75rem] text-slate-900 dark:text-zinc-50 leading-[1.1]">
            Every inbound takes 30 minutes.<br />
            <span style={{ color: COLOR.brand }}>Not anymore.</span>
          </h1>
          <p className="text-slate-600 dark:text-zinc-400 max-w-2xl text-lg leading-relaxed">
            Five public APIs enrich it, 7 signals score it, and an email draft lands in the row.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-zinc-900 rounded w-fit">
          <TabBtn active={tab === "batch"}        onClick={() => setTab("batch")}        icon={FileText}>  Batch upload  </TabBtn>
          <TabBtn active={tab === "single"}       onClick={() => setTab("single")}       icon={Building2}> Single lead   </TabBtn>
          <TabBtn active={tab === "scheduled"}    onClick={() => setTab("scheduled")}    icon={Calendar}>  Scheduled     </TabBtn>
          <TabBtn active={tab === "integrations"} onClick={() => setTab("integrations")} icon={Link2}>     Integrations  </TabBtn>
        </div>

        <div className={tab === "batch" ? "" : "hidden"}><CsvUpload disabled={busy} onEnrich={handleEnrich} /></div>
        <div className={tab === "single" ? "" : "hidden"}><LeadForm disabled={busy} onSubmit={handleSingle} /></div>
        <div className={tab === "scheduled" ? "" : "hidden"}><ScheduledPanel keysMissing={keysMissing} /></div>
        {tab === "integrations" && <IntegrationsPanel />}

        {tab === "batch" && busy && <PipelineProgress />}

        {error && (
          <div
            role="alert"
            className="card p-4 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-sm text-red-800 dark:text-red-300 flex items-start gap-3"
          >
            <AlertTriangle size={18} className="text-red-500 dark:text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">Something went wrong</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {tab === "batch" && results.length > 0 && (
          <div>
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <h2 className="h-elise text-xl text-slate-900 dark:text-zinc-100">Results</h2>
              <button
                className="btn-secondary text-xs px-3 py-1.5"
                onClick={handleExport}
                type="button"
              >
                <Download size={13} aria-hidden="true" />
                Export CSV
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Total" value={results.length} color={COLOR.slate} />
              <StatCard label="Avg score" value={avg ?? "-"} color={COLOR.brand} />
              <StatCard label="Hot" value={hot} color={COLOR.rose} />
              <StatCard label="Warm" value={warm} color={COLOR.amber} />
            </div>
            <div className="mt-6">
              <ResultsTable leads={results} onSelect={setSelected} />
            </div>
          </div>
        )}
      </main>

      <LeadDrawer lead={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded transition-colors duration-150 cursor-pointer ${
        active
          ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
          : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
      }`}
    >
      <Icon size={14} aria-hidden="true" />
      {children}
    </button>
  );
}

function HealthBadge({ health }: { health: HealthResponse }) {
  const apis = [
    { label: "News",    ok: health.hasNews },
    { label: "Weather", ok: health.hasWeather },
  ];
  const llmReady = health.llm.ready && health.llm.name !== "none";
  const llmLabel =
    health.llm.name === "none"
      ? "template"
      : `${health.llm.name}${health.llm.model ? ` · ${health.llm.model.split("/").pop()}` : ""}`;

  return (
    <div className="hidden md:flex items-center gap-1.5 text-xs">
      {apis.map((a) => (
        <span
          key={a.label}
          title={a.ok ? `${a.label} API key configured` : `${a.label} API key missing`}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded font-medium ${
            a.ok
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
          {a.label}
        </span>
      ))}
      <span
        title={llmReady ? `LLM ready: ${health.llm.name}` : "No LLM, using template fallback"}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded font-medium ${
          llmReady
            ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
            : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
        }`}
      >
        <Sparkles size={10} aria-hidden="true" />
        <span className="mono">{llmLabel}</span>
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4">
      <div
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color }}
      >
        {label}
      </div>
      <div
        className="mono text-3xl font-semibold mt-1.5 leading-none"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}

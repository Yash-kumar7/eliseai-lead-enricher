import {
  ArrowRight,
  Clock,
  Database,
  FileSpreadsheet,
  Gauge,
  Mail,
  Moon,
  Sheet,
  Sun,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTheme } from "../hooks/useTheme.ts";
import { COLOR } from "../theme.ts";
import { SampleLeads } from "./SampleLeads.tsx";

interface LandingProps {
  onStart: () => void;
}

export function Landing({ onStart }: LandingProps) {
  const { mode, toggle } = useTheme();

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-full">
      <Nav mode={mode} onToggleTheme={toggle} onStart={onStart} />
      <Hero onStart={onStart} onLearnMore={() => scrollTo("how")} />
      <HowItWorks />
      <FeatureGrid />
      <FinalCta onStart={onStart} />
      <Footer />
    </div>
  );
}

/* ─────────────────────────  Nav  ───────────────────────── */

function Nav({
  mode,
  onToggleTheme,
  onStart,
}: {
  mode: "light" | "dark";
  onToggleTheme: () => void;
  onStart: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-20 transition-colors duration-200 ${
        scrolled
          ? "bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-slate-200 dark:border-zinc-800"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/eliseai-logo.svg"
            alt="EliseAI"
            className="h-6 w-auto block dark:hidden"
          />
          <img
            src="/eliseai-logo-white.svg"
            alt="EliseAI"
            className="h-6 w-auto hidden dark:block"
          />
          <span className="text-sm text-slate-500 dark:text-zinc-500 border-l border-slate-300 dark:border-zinc-700 pl-3">
            Lead Enricher
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          <NavLink onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>How it works</NavLink>
          <NavLink onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Features</NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer"
          >
            {mode === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
          <button type="button" onClick={onStart} className="btn-primary">
            Try it now
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}

function NavLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer"
    >
      {children}
    </button>
  );
}

/* ─────────────────────────  Hero  ───────────────────────── */

function Hero({ onStart, onLearnMore }: { onStart: () => void; onLearnMore: () => void }) {
  return (
    <section>
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-20 md:pt-12 md:pb-24 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-7 space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 px-3 py-1 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-700 dark:bg-brand-400" aria-hidden="true" />
            Built for EliseAI SDRs
          </span>
          <h1 className="h-elise text-[2.25rem] md:text-[2.75rem] lg:text-[3.25rem] text-slate-900 dark:text-zinc-50">
            Turn an inbound email into a scored, drafted outreach in{" "}
            <span className="text-brand-700 dark:text-brand-400">30 seconds</span>.
          </h1>
          <p className="text-lg text-slate-600 dark:text-zinc-400 leading-relaxed max-w-xl">
            An automated top-of-funnel tool for EliseAI SDRs. Enriches a lead with five public APIs,
            scores it against the multifamily ICP across 7 signals, and drafts a personalized email.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <button type="button" onClick={onStart} className="btn-primary">
              Try the demo
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button type="button" onClick={onLearnMore} className="btn-secondary">
              See how it works
            </button>
          </div>
          <dl className="flex items-center gap-6 pt-6 border-t border-slate-200 dark:border-zinc-800">
            <Metric value="5" label="public APIs" />
            <Divider />
            <Metric value="7" label="score signals" />
            <Divider />
            <Metric value="30s" label="per lead" />
            <Divider />
            <Metric value="0" label="paid deps" />
          </dl>
        </div>
        <div className="md:col-span-5">
          <SampleLeads />
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <dt className="sr-only">{label}</dt>
      <dd>
        <div className="mono text-2xl md:text-3xl font-semibold text-slate-900 dark:text-zinc-100 leading-none">
          {value}
        </div>
        <div className="text-xs text-slate-500 dark:text-zinc-500 mt-1">{label}</div>
      </dd>
    </div>
  );
}

function Divider() {
  return (
    <span className="h-10 w-px bg-slate-200 dark:bg-zinc-800 shrink-0" aria-hidden="true" />
  );
}

/* ───────────────────────  How it works  ─────────────────────── */

const STEPS: { icon: LucideIcon; title: string; body: string; color: string }[] = [
  { icon: FileSpreadsheet, title: "Upload",  body: "Single lead form, CSV batch up to 50 rows, scheduled inbox, or Google Sheets trigger.", color: COLOR.slate },
  { icon: Database,        title: "Enrich",  body: "Five APIs fire in parallel: Census, NewsAPI, Wikipedia, FRED, OpenWeather.", color: COLOR.blue },
  { icon: Gauge,           title: "Score",   body: "0–100 across 7 signals weighted for multifamily ICP. Hot / Warm / Cold with full breakdown.", color: COLOR.amber },
  { icon: Mail,            title: "Draft",   body: "Template by default, upgrade to any OpenAI-compatible LLM via three env vars.", color: COLOR.brand },
];

function HowItWorks() {
  return (
    <section id="how" className="py-20 md:py-28 bg-[#fafafb] dark:bg-zinc-900/40 border-t border-slate-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl">
          <h2 className="h-elise text-3xl md:text-[2.75rem] text-slate-900 dark:text-zinc-100 leading-[1.1]">
            Four steps. One click.<br />
            One enriched lead.
          </h2>
          <p className="mt-3 text-slate-600 dark:text-zinc-400 text-lg leading-relaxed">
            The same pipeline powers the button trigger and the scheduled cron run, so what you
            demo is what your team ships to production.
          </p>
        </div>
        <ol className="mt-14 grid grid-cols-1 md:grid-cols-4 gap-5">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 transition-all duration-200 hover:border-[#7638fa]/40 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${s.color}1a` }}
                >
                  <s.icon size={22} style={{ color: s.color }} aria-hidden="true" />
                </div>
                <span
                  className="mono text-3xl font-bold leading-none"
                  style={{ color: `${s.color}40` }}
                >
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-5 font-semibold text-slate-900 dark:text-zinc-100 text-lg">
                {s.title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─────────────────────────  Feature grid  ───────────────────────── */

const FEATURES: { icon: LucideIcon; title: string; body: string; color: string }[] = [
  {
    icon: Database,
    title: "Five public APIs",
    body: "Census, NewsAPI, Wikipedia, FRED, OpenWeather. Demographics, headlines, market vacancy, and weather. No paid sources.",
    color: COLOR.blue,
  },
  {
    icon: Gauge,
    title: "7-signal scoring",
    body: "Renter share, population, median rent, Wikipedia, recent news, income, rental vacancy. 0–100, Hot / Warm / Cold with full breakdown.",
    color: COLOR.amber,
  },
  {
    icon: TrendingUp,
    title: "FRED vacancy data",
    body: "National rental vacancy rate from the Federal Reserve Economic Data API. Measures market tightness as a scoring signal.",
    color: COLOR.brand,
  },
  {
    icon: FileSpreadsheet,
    title: "CSV batch",
    body: "Drop up to 50 leads per upload. Pipeline progress, score distribution, and one-click CSV export.",
    color: COLOR.emerald,
  },
  {
    icon: Clock,
    title: "Scheduled runs",
    body: "Daily cron at 9am or trigger on demand. Drop CSVs in the inbox before you leave, enriched output lands in the outbox.",
    color: COLOR.slate,
  },
  {
    icon: Sheet,
    title: "Google Sheets trigger",
    body: "SDR adds a row to their sheet, enrichment fires automatically. Scores and email drafts write back to the same row.",
    color: COLOR.emerald,
  },
];

function FeatureGrid() {
  return (
    <section id="features" className="py-20 md:py-28 border-t border-slate-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl">
          <h2 className="h-elise text-3xl md:text-[2.75rem] text-slate-900 dark:text-zinc-100 leading-[1.1]">
            Everything an SDR needs.<br />
            Nothing they don't.
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 transition-all duration-200 hover:border-[#7638fa]/40 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: `${f.color}1a` }}
              >
                <f.icon size={20} style={{ color: f.color }} aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-zinc-100">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  Final CTA  ───────────────────────── */

function FinalCta({ onStart }: { onStart: () => void }) {
  return (
    <section className="py-20 md:py-28 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="max-w-xl">
          <h2 className="h-elise text-3xl md:text-[2.75rem] text-slate-900 dark:text-zinc-100">
            Run the demo with five sample leads.
          </h2>
          <p className="mt-4 text-slate-600 dark:text-zinc-400 leading-relaxed">
            Enriched, scored, and drafted live. No signup, no paid keys.
          </p>
        </div>
        <button type="button" onClick={onStart} className="btn-primary shrink-0">
          Try it now
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

/* ─────────────────────────  Footer  ───────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-zinc-800 py-8">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-xs text-slate-500 dark:text-zinc-500">
          EliseAI Lead Enricher · GTM Engineer practical assignment
        </p>
      </div>
    </footer>
  );
}

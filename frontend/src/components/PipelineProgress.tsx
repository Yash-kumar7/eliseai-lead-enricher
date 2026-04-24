import { BookOpen, Building2, CloudSun, Gauge, Mail, Newspaper, TrendingUp, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

export const PIPELINE_STEPS: { label: string; icon: LucideIcon }[] = [
  { label: "Census",    icon: Building2 },
  { label: "News",      icon: Newspaper },
  { label: "Wikipedia", icon: BookOpen },
  { label: "FRED",      icon: TrendingUp },
  { label: "Weather",   icon: CloudSun },
  { label: "Scoring",   icon: Gauge },
  { label: "Email",     icon: Mail },
];

export function PipelineProgress() {
  const [busyStep, setBusyStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setBusyStep((s) => (s + 1) % PIPELINE_STEPS.length);
    }, 700);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={16} className="text-brand-700 dark:text-brand-400 animate-pulse" aria-hidden="true" />
        <span className="text-sm font-medium text-slate-700 dark:text-zinc-200">Running enrichment pipeline…</span>
      </div>
      <div className="flex gap-2">
        {PIPELINE_STEPS.map((step, i) => {
          const StepIcon = step.icon;
          const state: "active" | "done" | "pending" =
            i === busyStep ? "active" : i < busyStep ? "done" : "pending";
          const tileClass =
            state === "active"
              ? "bg-brand-50 border-brand-300 dark:bg-brand-950/40 dark:border-brand-700"
              : "bg-slate-50 border-slate-100 opacity-60 dark:bg-zinc-950/60 dark:border-zinc-800";
          const iconClass =
            state === "active"
              ? "text-brand-700 dark:text-brand-300"
              : "text-slate-400 dark:text-zinc-600";
          return (
            <div
              key={step.label}
              className={`flex-1 flex flex-col items-center gap-1 rounded border p-2.5 transition-colors duration-300 ${tileClass}`}
            >
              <StepIcon size={16} className={iconClass} aria-hidden="true" />
              <div className={`text-[10px] font-medium mono ${iconClass}`}>{step.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

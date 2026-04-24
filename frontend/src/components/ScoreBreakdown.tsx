import type { ScoreBreakdown as Breakdown } from "@eliseai/shared";

function barClass(pct: number): string {
  if (pct >= 80) return "bg-gradient-to-r from-emerald-400 to-emerald-600";
  if (pct >= 50) return "bg-gradient-to-r from-brand-500 to-brand-700";
  if (pct > 0)   return "bg-gradient-to-r from-slate-300 to-slate-400 dark:from-zinc-600 dark:to-zinc-500";
  return "bg-slate-200 dark:bg-zinc-800";
}

function badgeClass(pct: number): string {
  if (pct >= 80) return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900";
  if (pct >= 50) return "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:ring-brand-900";
  return "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700";
}

export function ScoreBreakdown({ breakdown }: { breakdown: Breakdown[] }) {
  return (
    <ul className="space-y-3.5">
      {breakdown.map((b) => {
        const pct = b.maxPoints > 0 ? (b.points / b.maxPoints) * 100 : 0;
        return (
          <li key={b.signal}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-zinc-200">{b.signal}</span>
              <span
                className={`tabular-mono text-[11px] font-semibold px-2 py-0.5 rounded-md ring-1 ring-inset ${badgeClass(pct)}`}
              >
                {b.points} / {b.maxPoints}
              </span>
            </div>
            <div
              className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={b.points}
              aria-valuemin={0}
              aria-valuemax={b.maxPoints}
              aria-label={b.signal}
            >
              <div
                className={`h-full rounded-full transition-all duration-700 ${barClass(pct)}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1.5 leading-relaxed">{b.reason}</p>
          </li>
        );
      })}
    </ul>
  );
}

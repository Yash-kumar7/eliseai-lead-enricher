import { Building2, CircleDot, Mail, TrendingUp } from "lucide-react";
import { ScoreRing } from "./ScoreRing.tsx";
import { TierChip } from "./TierChip.tsx";

/**
 * Static, non interactive preview of what a single enriched lead looks like
 * inside the tool. Used only on the landing hero.
 */
export function TerminalMockup() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Glow behind the card */}
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-brand-400/30 via-brand-500/10 to-accent-500/20 blur-2xl dark:from-brand-500/25 dark:via-brand-700/10 dark:to-accent-500/15"
      />
      <div
        className="relative card p-5 space-y-4 rotate-[-1.5deg] hover:rotate-0 transition-transform duration-300 shadow-card-lg"
        role="img"
        aria-label="Preview of an enriched lead card"
      >
        {/* Tiny window chrome */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400" aria-hidden="true" />
          <span className="w-2 h-2 rounded-full bg-amber-400" aria-hidden="true" />
          <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
          <span className="ml-2 text-[10px] mono uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            lead.enriched
          </span>
        </div>

        {/* Header row */}
        <div className="flex items-center gap-3">
          <ScoreRing score={82} tier="Hot" size={56} strokeWidth={5} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-zinc-100 truncate">Greystar</h3>
              <TierChip tier="Hot" />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5 truncate">
              sarah.chen@greystar.com · Austin, TX
            </p>
          </div>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-3 gap-1.5">
          <MiniStat icon={Building2}  label="pop"    value="961k" />
          <MiniStat icon={TrendingUp} label="renter" value="58%"  />
          <MiniStat icon={CircleDot}  label="news"   value="3"    />
        </div>

        {/* Email preview */}
        <div className="rounded-lg border border-slate-100 dark:border-zinc-800 p-3 bg-slate-50/60 dark:bg-zinc-950/60">
          <div className="flex items-center gap-1.5 mb-1">
            <Mail size={11} className="text-brand-600 dark:text-brand-400" aria-hidden="true" />
            <span className="text-[10px] mono uppercase tracking-widest text-slate-500 dark:text-zinc-500">
              draft
            </span>
          </div>
          <p className="text-[13px] font-medium text-slate-900 dark:text-zinc-100 leading-snug">
            Quick idea for Greystar leasing in Austin
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
            Hi Sarah, with 58% renter occupied housing in Austin, your properties sit in one of the hottest…
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 px-2 py-1.5 min-w-0">
      <Icon size={11} className="text-slate-500 dark:text-zinc-500 shrink-0" aria-hidden="true" />
      <div className="min-w-0 leading-tight">
        <div className="text-[9px] mono uppercase tracking-widest text-slate-400 dark:text-zinc-500">{label}</div>
        <div className="mono text-[11px] font-semibold text-slate-900 dark:text-zinc-100 truncate">{value}</div>
      </div>
    </div>
  );
}

import type { Tier } from "@eliseai/shared";
import { Building2, CircleDot, Mail, TrendingUp } from "lucide-react";
import { ScoreRing } from "./ScoreRing.tsx";
import { TierChip } from "./TierChip.tsx";

interface SampleLead {
  company: string;
  email: string;
  location: string;
  score: number;
  tier: Tier;
  stats: { pop: string; renter: string; news: string };
  draftSubject: string;
  draftBody: string;
}

const LEADS: SampleLead[] = [
  {
    company: "Greystar",
    email: "sarah.chen@greystar.com · Austin, TX",
    location: "Austin, TX",
    score: 92,
    tier: "Hot",
    stats: { pop: "961k", renter: "58%", news: "3" },
    draftSubject: "Quick idea for Greystar leasing in Austin",
    draftBody: "Hi Sarah, with 58% renter occupied housing in Austin, your properties sit in one of the hottest…",
  },
  {
    company: "Equity Residential",
    email: "marcus.j@equityapartments.com · Washington, DC",
    location: "Washington, DC",
    score: 78,
    tier: "Hot",
    stats: { pop: "712k", renter: "61%", news: "5" },
    draftSubject: "Equity Residential · DC leasing funnel",
    draftBody: "Hi Marcus, noticed 12 new leasing agent openings at your DC properties. Happy to share how teams…",
  },
  {
    company: "AvalonBay",
    email: "priya@avaloncommunities.com · San Diego, CA",
    location: "San Diego, CA",
    score: 64,
    tier: "Warm",
    stats: { pop: "1.4M", renter: "53%", news: "2" },
    draftSubject: "AvalonBay · Q1 AI tooling mention",
    draftBody: "Hi Priya, caught your Q1 call reference to operator-side AI. Here's a quick angle for San Diego…",
  },
];

export function SampleLeads() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-brand-400/25 via-brand-500/10 to-brand-700/15 blur-2xl dark:from-brand-500/20 dark:via-brand-700/10 dark:to-brand-900/15"
      />
      <div className="relative space-y-4">
        {LEADS.map((lead, i) => (
          <LeadCard key={lead.company} lead={lead} index={i} />
        ))}
      </div>
    </div>
  );
}

function LeadCard({ lead, index }: { lead: SampleLead; index: number }) {
  const rotations = ["-rotate-[2deg]", "rotate-[1.5deg]", "-rotate-[1deg]"];
  const rotate = rotations[index] ?? "";
  return (
    <div
      className={`card p-4 space-y-3 shadow-card-lg ${rotate} hover:rotate-0 transition-transform duration-300`}
      role="img"
      aria-label={`Preview of enriched lead for ${lead.company}`}
    >
      <div className="flex items-center gap-3">
        <ScoreRing score={lead.score} tier={lead.tier} size={48} strokeWidth={4} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-zinc-100 truncate">{lead.company}</h3>
            <TierChip tier={lead.tier} />
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5 truncate">{lead.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <MiniStat icon={Building2} label="pop" value={lead.stats.pop} />
        <MiniStat icon={TrendingUp} label="renter" value={lead.stats.renter} />
        <MiniStat icon={CircleDot} label="news" value={lead.stats.news} />
      </div>

      <div className="rounded-lg border border-slate-100 dark:border-zinc-800 p-2.5 bg-slate-50/60 dark:bg-zinc-950/60">
        <div className="flex items-center gap-1.5 mb-1">
          <Mail size={10} className="text-brand-700 dark:text-brand-400" aria-hidden="true" />
          <span className="text-[10px] mono uppercase tracking-widest text-slate-500 dark:text-zinc-500">
            draft
          </span>
        </div>
        <p className="text-[12px] font-medium text-slate-900 dark:text-zinc-100 leading-snug">
          {lead.draftSubject}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2">
          {lead.draftBody}
        </p>
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
      <Icon size={10} className="text-slate-500 dark:text-zinc-500 shrink-0" aria-hidden="true" />
      <div className="min-w-0 leading-tight">
        <div className="text-[9px] mono uppercase tracking-widest text-slate-400 dark:text-zinc-500">{label}</div>
        <div className="mono text-[11px] font-semibold text-slate-900 dark:text-zinc-100 truncate">{value}</div>
      </div>
    </div>
  );
}

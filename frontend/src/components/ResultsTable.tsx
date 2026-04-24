import type { EnrichedLead } from "@eliseai/shared";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { TierChip } from "./TierChip.tsx";

interface Props {
  leads: EnrichedLead[];
  onSelect: (lead: EnrichedLead) => void;
}

type SortKey = "score" | "company" | "city";

export function ResultsTable({ leads, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [asc, setAsc] = useState(false);

  const sorted = [...leads].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "score") cmp = a.score.total - b.score.total;
    if (sortKey === "company") cmp = a.lead.company.localeCompare(b.lead.company);
    if (sortKey === "city") cmp = a.lead.city.localeCompare(b.lead.city);
    return asc ? cmp : -cmp;
  });

  function toggleSort(k: SortKey) {
    if (k === sortKey) setAsc(!asc);
    else {
      setSortKey(k);
      setAsc(k !== "score");
    }
  }

  if (leads.length === 0) {
    return (
      <div className="card p-16 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
          <Inbox className="text-slate-400 dark:text-zinc-500" size={22} aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">No enriched leads yet</p>
        <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
          Upload a CSV or enter a single lead above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-zinc-950/60 border-b border-slate-200 dark:border-zinc-800">
            <tr>
              <Th sortKey="company" current={sortKey} asc={asc} onSort={toggleSort}>Company</Th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-500">Contact</th>
              <Th sortKey="city" current={sortKey} asc={asc} onSort={toggleSort}>Market</Th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-500">Tier</th>
              <Th sortKey="score" current={sortKey} asc={asc} onSort={toggleSort}>Score</Th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-500">Top signal</th>
              <th scope="col" className="px-4 py-3 w-8" aria-hidden="true" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {sorted.map((l, i) => (
              <Row key={`${l.lead.email}-${i}`} lead={l} index={i} onSelect={onSelect} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  lead: l,
  index,
  onSelect,
}: {
  lead: EnrichedLead;
  index: number;
  onSelect: (l: EnrichedLead) => void;
}) {
  const borderByTier =
    l.score.tier === "Hot"
      ? "border-l-red-500 dark:border-l-red-400"
      : l.score.tier === "Warm"
        ? "border-l-amber-500 dark:border-l-amber-400"
        : "border-l-transparent";

  const scoreColor =
    l.score.total >= 75
      ? "text-red-700 dark:text-red-400"
      : l.score.total >= 50
        ? "text-amber-700 dark:text-amber-400"
        : "text-slate-600 dark:text-zinc-400";

  const barColor =
    l.score.total >= 75
      ? "bg-red-500 dark:bg-red-400"
      : l.score.total >= 50
        ? "bg-amber-500 dark:bg-amber-400"
        : "bg-slate-400 dark:bg-zinc-600";

  return (
    <tr
      tabIndex={0}
      className={`cursor-pointer border-l-[3px] ${borderByTier}
                  hover:bg-slate-50 dark:hover:bg-zinc-900/60
                  focus-visible:outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-zinc-900/60
                  transition-colors duration-150 animate-fade-up`}
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={() => onSelect(l)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(l);
        }
      }}
    >
      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-zinc-100">{l.lead.company}</td>
      <td className="px-4 py-3.5">
        <div className="text-slate-800 dark:text-zinc-200">{l.lead.name}</div>
        <div className="text-xs text-slate-500 dark:text-zinc-500">{l.lead.email}</div>
      </td>
      <td className="px-4 py-3.5 text-slate-600 dark:text-zinc-400">
        {l.lead.city}, {l.lead.state}
      </td>
      <td className="px-4 py-3.5">
        <TierChip tier={l.score.tier} />
      </td>
      <td className="px-4 py-3.5 w-36">
        <div className="flex items-center gap-2.5">
          <div
            className="flex-1 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={l.score.total}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full ${barColor} rounded-full transition-all duration-700`}
              style={{ width: `${l.score.total}%` }}
            />
          </div>
          <span className={`tabular-mono text-[13px] font-bold w-7 text-right ${scoreColor}`}>
            {l.score.total}
          </span>
        </div>
      </td>
      <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-zinc-500 max-w-xs truncate">
        {l.score.reasons[0] ?? "N/A"}
      </td>
      <td className="px-4 py-3.5 text-slate-300 dark:text-zinc-600">
        <ChevronRight size={16} aria-hidden="true" />
      </td>
    </tr>
  );
}

function Th({
  sortKey,
  current,
  asc,
  onSort,
  children,
}: {
  sortKey: SortKey;
  current: SortKey;
  asc: boolean;
  onSort: (k: SortKey) => void;
  children: ReactNode;
}) {
  const active = sortKey === current;
  const ariaSort: React.AriaAttributes["aria-sort"] = active ? (asc ? "ascending" : "descending") : "none";
  const Icon = active ? (asc ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th scope="col" aria-sort={ariaSort} className="px-4 py-3 text-left">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest transition-colors duration-150 cursor-pointer ${
          active
            ? "text-brand-700 dark:text-brand-400"
            : "text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200"
        }`}
      >
        {children}
        <Icon size={12} className={active ? "opacity-100" : "opacity-40"} aria-hidden="true" />
      </button>
    </th>
  );
}

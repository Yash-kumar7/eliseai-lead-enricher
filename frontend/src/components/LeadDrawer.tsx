import type { EnrichedLead } from "@eliseai/shared";
import type { LucideIcon } from "lucide-react";
import {
  BarChart2,
  BookOpen,
  Check,
  CloudSun,
  Copy,
  DollarSign,
  ExternalLink,
  Home,
  Newspaper,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";
import { ScoreBreakdown } from "./ScoreBreakdown.tsx";
import { ScoreRing } from "./ScoreRing.tsx";
import { TierChip } from "./TierChip.tsx";

interface Props {
  lead: EnrichedLead | null;
  onClose: () => void;
}

export function LeadDrawer({ lead, onClose }: Props) {
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [copied, setCopied] = useState(false);
  const subjectId = useId();
  const bodyId = useId();

  useEffect(() => {
    if (lead) {
      setEditedSubject(lead.email.subject);
      setEditedBody(lead.email.body);
      setCopied(false);
    }
  }, [lead]);

  useEffect(() => {
    if (!lead) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lead, onClose]);

  if (!lead) return null;

  async function copyEmail() {
    const text = `Subject: ${editedSubject}\n\n${editedBody}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const { lead: l, enrichment, score, email, errors } = lead;
  const c = enrichment.census;
  const news = enrichment.news;
  const wiki = enrichment.wikipedia;
  const weather = enrichment.weather;
  const fred = enrichment.fred;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in" role="dialog" aria-modal="true" aria-label="Lead details">
      <div
        className="absolute inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="relative w-full max-w-2xl h-full overflow-y-auto shadow-2xl bg-white dark:bg-zinc-900 animate-slide-in-right">
        <header className="sticky top-0 z-10 px-6 py-5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <ScoreRing score={score.total} tier={score.tier} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 truncate">{l.company}</h2>
                  <TierChip tier={score.tier} />
                </div>
                <p className="text-sm text-slate-600 dark:text-zinc-400 mt-0.5 truncate">
                  {l.name} ·{" "}
                  <a href={`mailto:${l.email}`} className="hover:text-brand-700 dark:hover:text-brand-400 transition-colors">
                    {l.email}
                  </a>
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5 truncate">
                  {l.city}, {l.state}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors duration-150 cursor-pointer"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="p-6 space-y-7">
          <Section title="Score breakdown">
            <ScoreBreakdown breakdown={score.breakdown} />
          </Section>

          <Section title="Market intelligence">
            <div className="grid grid-cols-2 gap-2.5">
              <Stat icon={Users}      label="Population"     value={c?.population?.toLocaleString()} mono />
              <Stat icon={Home}       label="Renter share"   value={c?.renterOccupiedPct != null ? `${c.renterOccupiedPct.toFixed(1)}%` : null} mono />
              <Stat icon={DollarSign} label="Median rent"    value={c?.medianRent ? `$${c.medianRent.toLocaleString()}/mo` : null} mono />
              <Stat icon={TrendingUp} label="Median income"  value={c?.medianHouseholdIncome ? `$${c.medianHouseholdIncome.toLocaleString()}` : null} mono />
              <Stat icon={CloudSun}   label="Weather"        value={weather?.description ? `${weather.description}${weather.tempF != null ? ` · ${Math.round(weather.tempF)}°F` : ""}` : null} />
              <Stat icon={BookOpen}   label="Wikipedia"      value={wiki?.companyPage.exists ? "Has page" : "No page"} />
            </div>
          </Section>

          {fred != null && (
            <Section title="Market signals">
              <div className="grid grid-cols-2 gap-2.5">
                <Stat
                  icon={BarChart2}
                  label="Rental vacancy"
                  value={fred.rentalVacancyRate != null ? `${fred.rentalVacancyRate}%${fred.period ? ` (${fred.period})` : ""}` : null}
                  mono
                />
              </div>
            </Section>
          )}

          {news && news.headlines.length > 0 && (
            <Section title="Recent news" icon={Newspaper}>
              <ul className="space-y-2">
                {news.headlines.map((h, i) => (
                  <li key={i}>
                    <a
                      href={h.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex gap-3 p-3 rounded-lg border border-slate-100 hover:border-brand-300 hover:bg-brand-50/40 dark:border-zinc-800 dark:hover:border-brand-800 dark:hover:bg-brand-950/30 transition-colors duration-150 group"
                    >
                      <ExternalLink
                        size={13}
                        className="text-slate-400 group-hover:text-brand-600 dark:text-zinc-600 dark:group-hover:text-brand-400 mt-1 shrink-0 transition-colors"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm text-slate-800 dark:text-zinc-200 group-hover:text-brand-800 dark:group-hover:text-brand-300 leading-snug transition-colors">
                          {h.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
                          {h.source} · {new Date(h.publishedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {wiki?.companyPage.exists && wiki.companyPage.summary && (
            <Section title="Company background" icon={BookOpen}>
              <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
                {wiki.companyPage.summary.slice(0, 450)}
                {wiki.companyPage.summary.length > 450 && "…"}
              </p>
              {wiki.companyPage.url && (
                <a
                  href={wiki.companyPage.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-brand-700 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                >
                  View on Wikipedia <ExternalLink size={10} aria-hidden="true" />
                </a>
              )}
            </Section>
          )}

          <Section
            title={
              email.source === "template"
                ? "Email draft · template"
                : `Email draft · ${email.source}${email.model ? ` / ${email.model.split("/").pop()}` : ""}`
            }
          >
            <div className="space-y-3">
              <div>
                <label htmlFor={subjectId} className="label">Subject</label>
                <input
                  id={subjectId}
                  className="input font-medium"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor={bodyId} className="label">Body</label>
                <textarea
                  id={bodyId}
                  className="input mono text-[13px] leading-relaxed resize-y"
                  rows={12}
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button className="btn-primary" onClick={copyEmail} type="button">
                  {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                  {copied ? "Copied!" : "Copy email"}
                </button>
              </div>
            </div>
          </Section>

          {errors.length > 0 && (
            <Section title="Enrichment warnings">
              <ul
                role="status"
                className="text-xs text-slate-500 dark:text-zinc-400 space-y-1 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3"
              >
                {errors.map((e, i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden="true">·</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </aside>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: LucideIcon; children: ReactNode }) {
  return (
    <section>
      <h3 className="section-title flex items-center gap-2">
        {Icon && <Icon size={12} className="text-slate-400 dark:text-zinc-500" aria-hidden={true} />}
        {title}
      </h3>
      {children}
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: LucideIcon;
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="stat-card">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shrink-0">
        <Icon size={16} className="text-brand-700 dark:text-brand-400" aria-hidden={true} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-500">{label}</div>
        <div className={`text-sm font-semibold mt-0.5 truncate text-slate-900 dark:text-zinc-100 ${mono ? "mono" : ""}`}>
          {value ?? <span className="text-slate-300 dark:text-zinc-600">N/A</span>}
        </div>
      </div>
    </div>
  );
}

import type { EnrichedLead, Lead } from "@eliseai/shared";

export interface HealthResponse {
  status: string;
  hasNews: boolean;
  hasWeather: boolean;
  llm: {
    name: string;
    model: string | null;
    ready: boolean;
  };
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch("/api/health");
  if (!res.ok) throw new Error(`health check failed: ${res.status}`);
  return res.json();
}

export async function enrichOne(lead: Lead): Promise<EnrichedLead> {
  const res = await fetch("/api/enrich", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(lead),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `status ${res.status}`);
  }
  return res.json();
}

export async function enrichBatchCsv(csv: string): Promise<EnrichedLead[]> {
  const res = await fetch("/api/enrich/batch/csv", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ csv }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `status ${res.status}`);
  }
  const data = (await res.json()) as { leads: EnrichedLead[] };
  return data.leads;
}

// ───── Scheduled (cron inbox/outbox) ─────

export interface ScheduledFile {
  name: string;
  size: number;
  mtime: string;
}

export interface ScheduledList {
  inbox: ScheduledFile[];
  outbox: ScheduledFile[];
  processed: ScheduledFile[];
}

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

export async function listScheduled(): Promise<ScheduledList> {
  const res = await fetch("/api/scheduled/list");
  if (!res.ok) throw new Error(`list failed: ${res.status}`);
  return res.json();
}

export async function uploadScheduled(
  file: File,
): Promise<{ filename: string; size: number }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/scheduled/upload", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `status ${res.status}`);
  }
  return res.json();
}

export async function deleteProcessedFile(filename: string): Promise<void> {
  const res = await fetch(`/api/scheduled/processed/${encodeURIComponent(filename)}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `status ${res.status}`);
  }
}

export async function deleteOutboxFile(filename: string): Promise<void> {
  const res = await fetch(`/api/scheduled/outbox/${encodeURIComponent(filename)}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `status ${res.status}`);
  }
}

export async function deleteInboxFile(filename: string): Promise<void> {
  const res = await fetch(`/api/scheduled/inbox/${encodeURIComponent(filename)}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `status ${res.status}`);
  }
}

export async function runScheduled(): Promise<CronSummary> {
  const res = await fetch("/api/scheduled/run", { method: "POST" });
  if (!res.ok) throw new Error(`run failed: ${res.status}`);
  return res.json();
}

export function downloadScheduledUrl(filename: string): string {
  return `/api/scheduled/download/${encodeURIComponent(filename)}`;
}

export async function exportCsv(leads: EnrichedLead[]): Promise<void> {
  const res = await fetch("/api/export", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ leads }),
  });
  if (!res.ok) throw new Error(`export failed: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `enriched_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

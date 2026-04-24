import type { EnrichedLead, Lead } from "@eliseai/shared";
import Papa from "papaparse";

const REQUIRED_COLUMNS = [
  "name",
  "email",
  "company",
  "propertyAddress",
  "city",
  "state",
];

export function parseLeadsCsv(text: string): Lead[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  if (result.errors.length > 0) {
    throw new Error(
      `CSV parse error: ${result.errors.map((e) => e.message).join("; ")}`,
    );
  }
  const rows = result.data;
  if (rows.length === 0) throw new Error("CSV contains no rows");

  const firstRow = rows[0];
  const missing = REQUIRED_COLUMNS.filter((c) => !(c in firstRow));
  if (missing.length > 0) {
    throw new Error(
      `CSV missing required columns: ${missing.join(", ")}. Expected: ${REQUIRED_COLUMNS.join(", ")}`,
    );
  }

  return rows.map((row) => ({
    name: (row.name ?? "").trim(),
    email: (row.email ?? "").trim(),
    company: (row.company ?? "").trim(),
    propertyAddress: (row.propertyAddress ?? "").trim(),
    city: (row.city ?? "").trim(),
    state: (row.state ?? "").trim(),
  }));
}

export function enrichedLeadsToCsv(leads: EnrichedLead[]): string {
  const rows = leads.map((l) => ({
    name: l.lead.name,
    email: l.lead.email,
    company: l.lead.company,
    propertyAddress: l.lead.propertyAddress,
    city: l.lead.city,
    state: l.lead.state,
    score: l.score.total,
    tier: l.score.tier,
    topReason: l.score.reasons[0] ?? "",
    population: l.enrichment.census?.population ?? "",
    renterPct:
      l.enrichment.census?.renterOccupiedPct !== null &&
      l.enrichment.census?.renterOccupiedPct !== undefined
        ? l.enrichment.census.renterOccupiedPct.toFixed(1)
        : "",
    medianRent: l.enrichment.census?.medianRent ?? "",
    medianIncome: l.enrichment.census?.medianHouseholdIncome ?? "",
    wikipediaExists: l.enrichment.wikipedia?.companyPage.exists ? "yes" : "no",
    newsDaysAgo: l.enrichment.news?.mostRecentDaysAgo ?? "",
    topHeadline: l.enrichment.news?.headlines[0]?.title ?? "",
    emailSubject: l.email.subject,
    emailBody: l.email.body,
    emailSource: l.email.source,
    enrichedAt: l.enrichedAt,
    errors: l.errors.join(" | "),
  }));
  return Papa.unparse(rows);
}

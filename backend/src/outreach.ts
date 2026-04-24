import type {
  CensusData,
  EnrichedLead,
  Lead,
  NewsData,
  OutreachEmail,
  Score,
  WikipediaData,
} from "@eliseai/shared";
import { getProvider } from "./llm/index.js";

const ELISEAI_POSITIONING = `EliseAI builds AI leasing and resident communication assistants for multifamily property managers. The AI handles tours, follow ups, and renewals 24/7, lifting tour booking rates and freeing leasing teams from repetitive tasks. Customers include large NMHC Top 50 operators.`;

const SYSTEM_PROMPT = `You are an elite SDR at EliseAI writing cold outreach to multifamily property managers.

Company positioning:
${ELISEAI_POSITIONING}

Rules:
- Subject ≤60 chars.
- Body ≤120 words, 2 to 3 short paragraphs.
- Always open with "Hi [first name]," on the first line.
- Use at most ONE enrichment fact that shows you did homework; don't list them.
- Soft CTA: ask for 15 min.
- No emojis, no marketing fluff, no "I hope this finds you well".
- If data is thin, keep it short and credible; do not fabricate.
- Output strict JSON only: {"subject": "...", "body": "..."}`;

function firstName(full: string): string {
  const trimmed = full.trim().split(/\s+/)[0] ?? "there";
  return trimmed || "there";
}

function pickCensusHook(census: CensusData | null, city: string): string | null {
  if (!census) return null;
  if (census.renterOccupiedPct !== null && census.renterOccupiedPct >= 40) {
    return `With ${census.renterOccupiedPct.toFixed(0)}% renter occupied housing in ${city}, your properties sit in one of the more active rental markets in the country.`;
  }
  if (census.medianRent !== null && census.medianRent >= 1500) {
    return `${city}'s median rent of $${census.medianRent}/mo puts your assets squarely in the class A/B range we see strongest results with.`;
  }
  if (census.population !== null && census.population >= 500_000) {
    return `${city} is a sizable market (${Math.round(census.population / 1000)}k residents), the scale where our leasing AI typically pays for itself in the first quarter.`;
  }
  return null;
}

function pickNewsHook(news: NewsData | null, company: string): string | null {
  if (!news || news.headlines.length === 0) return null;
  const top = news.headlines[0];
  if (news.mostRecentDaysAgo !== null && news.mostRecentDaysAgo <= 90) {
    return `Saw the recent coverage of ${company}: "${top.title.slice(0, 90)}", congrats on the momentum.`;
  }
  return null;
}

function pickWikiHook(
  wiki: WikipediaData | null,
  company: string,
): string | null {
  if (!wiki?.companyPage.exists || !wiki.companyPage.summary) return null;
  const firstSentence = wiki.companyPage.summary.split(/(?<=[.!?])\s/)[0];
  if (!firstSentence || firstSentence.length > 220) return null;
  return `I read that ${company} ${firstSentence.replace(new RegExp(`^${company}\\s+`, "i"), "").toLowerCase()}. Impressive footprint.`;
}

export function buildTemplateEmail(
  lead: Lead,
  census: CensusData | null,
  news: NewsData | null,
  wiki: WikipediaData | null,
  score: Score,
): OutreachEmail {
  const first = firstName(lead.name);
  const hook =
    pickNewsHook(news, lead.company) ||
    pickWikiHook(wiki, lead.company) ||
    pickCensusHook(census, lead.city) ||
    `Saw your properties in ${lead.city}, focused on multifamily operators in your market right now.`;
  const marketLine = pickCensusHook(census, lead.city);

  const subject =
    score.tier === "Hot"
      ? `Quick idea for ${lead.company} leasing in ${lead.city}`
      : `${lead.company} × AI leasing, 2 min?`;

  const body = [
    `Hi ${first},`,
    ``,
    hook,
    ``,
    marketLine && marketLine !== hook
      ? `${marketLine}`
      : `EliseAI's leasing AI handles tours, follow ups, and renewals 24/7. Our customers typically see a 40%+ lift in tour bookings without adding headcount.`,
    ``,
    `Worth a 15 min call to see if it'd move the needle for ${lead.company}?`,
    ``,
    `Best,`,
    `[Your name]`,
  ]
    .filter((line) => line !== "")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  return { subject, body, source: "template" };
}

export async function buildLLMEmail(
  enriched: Omit<EnrichedLead, "email">,
): Promise<OutreachEmail | null> {
  const provider = getProvider();
  if (!provider) return null;

  const userContent = `Lead data:\n${JSON.stringify(enriched, null, 2)}`;
  const result = await provider.generateOutreach(SYSTEM_PROMPT, userContent);
  if (!result || !result.subject || !result.body) return null;

  return {
    subject: result.subject,
    body: result.body,
    source: provider.name === "none" ? "template" : provider.name,
    model: provider.model,
  };
}

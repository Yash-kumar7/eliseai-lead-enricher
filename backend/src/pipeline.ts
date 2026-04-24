import type { EnrichedLead, Lead } from "@eliseai/shared";
import { fetchCensus } from "./enrich/census.js";
import { fetchFred } from "./enrich/fred.js";
import { fetchNews } from "./enrich/news.js";
import { fetchWeather } from "./enrich/weather.js";
import { fetchWikipedia } from "./enrich/wikipedia.js";
import { buildLLMEmail, buildTemplateEmail } from "./outreach.js";
import { scoreLead } from "./score.js";

async function settle<T>(
  label: string,
  p: Promise<T>,
  errors: string[],
): Promise<T | null> {
  try {
    return await p;
  } catch (err) {
    errors.push(`${label}: ${(err as Error).message}`);
    return null;
  }
}

export async function enrichLead(lead: Lead): Promise<EnrichedLead> {
  const errors: string[] = [];
  const [census, news, wiki, weather, fred] = await Promise.all([
    settle("census", fetchCensus(lead.propertyAddress, lead.city, lead.state), errors),
    settle("news", fetchNews(lead.company), errors),
    settle("wikipedia", fetchWikipedia(lead.company, lead.city, lead.state), errors),
    settle("weather", fetchWeather(lead.city, lead.state), errors),
    settle("fred", fetchFred(), errors),
  ]);

  const score = scoreLead(census, news, wiki, fred);

  const partial: Omit<EnrichedLead, "email"> = {
    lead,
    enrichment: { census, news, wikipedia: wiki, weather, fred },
    score,
    errors,
    enrichedAt: new Date().toISOString(),
  };

  const llmEmail = await buildLLMEmail(partial);
  const email =
    llmEmail ?? buildTemplateEmail(lead, census, news, wiki, score);

  return { ...partial, email };
}

export async function enrichLeads(leads: Lead[]): Promise<EnrichedLead[]> {
  const CONCURRENCY = 5;
  const results: (EnrichedLead | null)[] = new Array(leads.length).fill(null);
  const queue = leads.map((lead, i) => ({ lead, i }));
  const workers = Array.from({ length: Math.min(CONCURRENCY, leads.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      results[item.i] = await enrichLead(item.lead);
    }
  });
  await Promise.all(workers);
  return results as EnrichedLead[];
}

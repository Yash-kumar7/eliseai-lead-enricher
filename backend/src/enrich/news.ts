import type { NewsData, NewsHeadline } from "@eliseai/shared";
import { cached } from "../cache.js";
import { config } from "../config.js";
import { fetchJson } from "../http.js";

interface NewsApiResponse {
  status: string;
  articles: Array<{
    title: string;
    url: string;
    source: { name: string };
    publishedAt: string;
  }>;
}

function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export async function fetchNews(company: string): Promise<NewsData> {
  if (!config.newsapiKey || !company.trim()) {
    return { headlines: [], mostRecentDaysAgo: null };
  }
  // Exact phrase first; if company name is short/ambiguous this reduces noise
  const q = `"${company}"`;
  const url =
    "https://newsapi.org/v2/everything" +
    `?q=${encodeURIComponent(q)}` +
    "&sortBy=publishedAt&language=en&pageSize=5";

  const key = `news:${company}`;
  try {
    const data = await cached(key, () =>
      fetchJson<NewsApiResponse>(url, {
        headers: { "X-Api-Key": config.newsapiKey },
      }),
    );
    const companyLower = company.toLowerCase();
    const headlines: NewsHeadline[] = (data.articles ?? [])
      .filter((a) => a.title && a.url && a.title.toLowerCase().includes(companyLower))
      .slice(0, 3)
      .map((a) => ({
        title: a.title,
        url: a.url,
        source: a.source?.name ?? "unknown",
        publishedAt: a.publishedAt,
      }));
    const mostRecent = headlines[0];
    return {
      headlines,
      mostRecentDaysAgo: mostRecent ? daysSince(mostRecent.publishedAt) : null,
    };
  } catch (err) {
    console.warn(`[news] fetch failed for ${company}:`, (err as Error).message);
    return { headlines: [], mostRecentDaysAgo: null };
  }
}

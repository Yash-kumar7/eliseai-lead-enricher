import type { WikipediaData } from "@eliseai/shared";
import { cached } from "../cache.js";
import { fetchJson } from "../http.js";

interface WikiSummary {
  type?: string;
  title?: string;
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
}

async function fetchPage(title: string): Promise<{
  exists: boolean;
  summary: string | null;
  url: string | null;
}> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title,
  )}`;
  try {
    const data = await cached(`wiki:${title}`, () =>
      fetchJson<WikiSummary>(url),
    );
    if (data.type === "disambiguation" || !data.extract) {
      return { exists: false, summary: null, url: null };
    }
    return {
      exists: true,
      summary: data.extract,
      url: data.content_urls?.desktop?.page ?? null,
    };
  } catch {
    return { exists: false, summary: null, url: null };
  }
}

export async function fetchWikipedia(
  company: string,
  city: string,
  state: string,
): Promise<WikipediaData> {
  const [companyPage, cityPage] = await Promise.all([
    company.trim() ? fetchPage(company) : Promise.resolve({ exists: false, summary: null, url: null }),
    city.trim() ? fetchPage(`${city}, ${state}`) : Promise.resolve({ exists: false, summary: null, url: null }),
  ]);
  return { companyPage, cityPage };
}

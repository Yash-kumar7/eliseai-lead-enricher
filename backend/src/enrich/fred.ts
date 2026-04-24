import type { FredData } from "@eliseai/shared";
import { cached } from "../cache.js";
import { config } from "../config.js";
import { fetchJson } from "../http.js";

interface FredObservation {
  date: string;
  value: string;
}

interface FredResponse {
  observations?: FredObservation[];
}

function emptyFred(): FredData {
  return {
    rentalVacancyRate: null,
    period: null,
  };
}

export async function fetchFred(): Promise<FredData> {
  const baseUrl =
    "https://api.stlouisfed.org/fred/series/observations" +
    "?series_id=RRVRUSQ156N" +
    "&file_type=json" +
    "&sort_order=desc" +
    "&limit=4";

  const url = config.fredKey
    ? `${baseUrl}&api_key=${config.fredKey}`
    : baseUrl;

  const key = "fred:rental-vacancy";
  try {
    const data = await cached(key, () =>
      fetchJson<FredResponse>(url),
    );
    const observations = data.observations ?? [];
    // Find the most recent observation with a real numeric value (FRED uses "." for missing)
    const recent = observations.find(
      (obs) => obs.value !== "." && obs.value.trim() !== "",
    );
    if (!recent) {
      return emptyFred();
    }
    const rate = parseFloat(recent.value);
    return {
      rentalVacancyRate: Number.isFinite(rate) ? rate : null,
      period: recent.date,
    };
  } catch (err) {
    console.warn(`[fred] fetch failed:`, (err as Error).message);
    return emptyFred();
  }
}

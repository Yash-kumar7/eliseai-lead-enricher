import type { CensusData } from "@eliseai/shared";
import { cached } from "../cache.js";
import { config } from "../config.js";
import { geocodeAddress } from "../geocode.js";
import { fetchJson } from "../http.js";

/**
 * ACS 5 year variables used:
 *  B01003_001E: total population
 *  B25003_001E: occupied housing units (denominator)
 *  B25003_003E: renter occupied housing units (numerator)
 *  B25064_001E: median gross rent
 *  B19013_001E: median household income
 *
 * Queried at county level (not tract) so small area suppression doesn't hide
 * signals. County demographics are a good proxy for the addressable market
 * a property manager operates in.
 */
const ACS_VARS = [
  "B01003_001E",
  "B25003_001E",
  "B25003_003E",
  "B25064_001E",
  "B19013_001E",
];

type AcsRow = [string, string, string, string, string, string, string];

function emptyCensus(): CensusData {
  return {
    population: null,
    renterOccupiedPct: null,
    medianRent: null,
    medianHouseholdIncome: null,
    geography: { state: null, county: null, tract: null },
  };
}

function parseAcs(row: AcsRow | undefined): Omit<CensusData, "geography"> {
  if (!row) {
    return {
      population: null,
      renterOccupiedPct: null,
      medianRent: null,
      medianHouseholdIncome: null,
    };
  }
  const [pop, occ, renter, rent, income] = row;
  const popN = Number(pop);
  const occN = Number(occ);
  const renterN = Number(renter);
  const rentN = Number(rent);
  const incomeN = Number(income);
  return {
    population: Number.isFinite(popN) && popN > 0 ? popN : null,
    renterOccupiedPct:
      Number.isFinite(occN) && occN > 0 && Number.isFinite(renterN)
        ? (renterN / occN) * 100
        : null,
    medianRent: Number.isFinite(rentN) && rentN > 0 ? rentN : null,
    medianHouseholdIncome:
      Number.isFinite(incomeN) && incomeN > 0 ? incomeN : null,
  };
}

export async function fetchCensus(
  address: string,
  city: string,
  state: string,
): Promise<CensusData> {
  const geo = await geocodeAddress(address, city, state);
  if (!geo) {
    return { ...emptyCensus() };
  }

  const keyParam = config.censusKey ? `&key=${config.censusKey}` : "";
  const url =
    "https://api.census.gov/data/2022/acs/acs5" +
    `?get=${ACS_VARS.join(",")}` +
    `&for=county:${geo.county}` +
    `&in=state:${geo.state}` +
    keyParam;

  const key = `census:${geo.state}:${geo.county}`;
  try {
    const data = await cached(key, () => fetchJson<AcsRow[]>(url));
    const values = parseAcs(data[1]);
    return {
      ...values,
      geography: {
        state: geo.state,
        county: geo.county,
        tract: geo.tract,
      },
    };
  } catch (err) {
    console.warn(`[census] fetch failed:`, (err as Error).message);
    return {
      ...emptyCensus(),
      geography: {
        state: geo.state,
        county: geo.county,
        tract: geo.tract,
      },
    };
  }
}

import { cached } from "./cache.js";
import { fetchJson } from "./http.js";

interface CensusGeocoderResponse {
  result: {
    addressMatches: Array<{
      coordinates?: {
        x: number; // longitude
        y: number; // latitude
      };
      geographies?: {
        "Census Tracts"?: Array<{
          STATE: string;
          COUNTY: string;
          TRACT: string;
        }>;
      };
    }>;
  };
}

export interface GeographyFips {
  state: string;
  county: string;
  tract: string;
  lat: number;
  lon: number;
}

export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
): Promise<GeographyFips | null> {
  const fullAddress = `${address}, ${city}, ${state}`;
  const url =
    "https://geocoding.geo.census.gov/geocoder/geographies/address" +
    "?benchmark=Public_AR_Current&vintage=Current_Current&format=json&layers=Census+Tracts" +
    `&street=${encodeURIComponent(address)}` +
    `&city=${encodeURIComponent(city)}` +
    `&state=${encodeURIComponent(state)}`;

  const key = `geocode:${fullAddress}`;
  try {
    const data = await cached(key, () =>
      fetchJson<CensusGeocoderResponse>(url, { timeoutMs: 8000 }),
    );
    const match = data.result?.addressMatches?.[0];
    const tract = match?.geographies?.["Census Tracts"]?.[0];
    if (!tract) return null;
    const lat = match?.coordinates?.y ?? 0;
    const lon = match?.coordinates?.x ?? 0;
    return {
      state: tract.STATE,
      county: tract.COUNTY,
      tract: tract.TRACT,
      lat,
      lon,
    };
  } catch (err) {
    console.warn(`[geocode] failed for "${fullAddress}":`, (err as Error).message);
    return null;
  }
}

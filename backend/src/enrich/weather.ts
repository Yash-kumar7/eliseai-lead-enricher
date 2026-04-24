import type { WeatherData } from "@eliseai/shared";
import { cached } from "../cache.js";
import { config } from "../config.js";
import { fetchJson } from "../http.js";

interface OpenWeatherResponse {
  weather?: Array<{ description: string }>;
  main?: { temp: number };
}

export async function fetchWeather(
  city: string,
  state: string,
): Promise<WeatherData> {
  if (!config.openweatherKey || !city.trim()) {
    return { description: null, tempF: null };
  }
  const url =
    "https://api.openweathermap.org/data/2.5/weather" +
    `?q=${encodeURIComponent(`${city},${state},US`)}` +
    "&units=imperial" +
    `&appid=${config.openweatherKey}`;

  try {
    const data = await cached(`weather:${city}:${state}`, () =>
      fetchJson<OpenWeatherResponse>(url),
    );
    return {
      description: data.weather?.[0]?.description ?? null,
      tempF: typeof data.main?.temp === "number" ? data.main.temp : null,
    };
  } catch (err) {
    console.warn(`[weather] fetch failed:`, (err as Error).message);
    return { description: null, tempF: null };
  }
}

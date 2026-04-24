import { request } from "undici";
import { config } from "./config.js";

export interface FetchJsonOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
}

export async function fetchJson<T>(
  url: string,
  opts: FetchJsonOptions = {},
): Promise<T> {
  const { headers = {}, timeoutMs = config.requestTimeoutMs, retries = 1 } =
    opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await request(url, {
        method: "GET",
        headers: {
          "user-agent": "EliseAI-Lead-Enricher/0.1 (demo)",
          accept: "application/json",
          ...headers,
        },
        bodyTimeout: timeoutMs,
        headersTimeout: timeoutMs,
      });
      if (res.statusCode >= 500 && attempt < retries) {
        continue;
      }
      if (res.statusCode >= 300) {
        const body = await res.body.text();
        throw new Error(
          `HTTP ${res.statusCode} for ${url}: ${body.slice(0, 200)}`,
        );
      }
      return (await res.body.json()) as T;
    } catch (err) {
      lastErr = err;
      if (attempt >= retries) break;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

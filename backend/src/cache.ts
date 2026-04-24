import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "./config.js";

const TTL_MS = 1000 * 60 * 60 * 24; // 24h

function keyPath(key: string): string {
  const hash = createHash("sha1").update(key).digest("hex");
  return join(config.cacheDir, `${hash}.json`);
}

export function getCached<T>(key: string): T | null {
  const path = keyPath(key);
  if (!existsSync(path)) return null;
  try {
    const raw = JSON.parse(readFileSync(path, "utf-8")) as {
      at: number;
      data: T;
    };
    if (Date.now() - raw.at > TTL_MS) return null;
    return raw.data;
  } catch {
    return null;
  }
}

export function setCached<T>(key: string, data: T): void {
  if (!existsSync(config.cacheDir)) {
    mkdirSync(config.cacheDir, { recursive: true });
  }
  writeFileSync(
    keyPath(key),
    JSON.stringify({ at: Date.now(), data }),
    "utf-8",
  );
}

export async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = getCached<T>(key);
  if (hit !== null) return hit;
  const fresh = await fn();
  setCached(key, fresh);
  return fresh;
}

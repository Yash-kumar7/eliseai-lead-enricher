import { config } from "../config.js";
import { OpenAICompatibleProvider } from "./openai-compatible.js";
import type { LLMProvider, ProviderInfo } from "./types.js";

export type { GeneratedEmail, LLMProvider, ProviderInfo, ProviderName } from "./types.js";

function labelFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname;
    if (host === "localhost" || host === "127.0.0.1") return "local";
    const skip = new Set(["api", "www"]);
    const meaningful = host.split(".").filter((p) => !skip.has(p));
    return meaningful[0] ?? host;
  } catch {
    return "llm";
  }
}

export function getProvider(): LLMProvider | null {
  const { llmBaseUrl, llmApiKey, llmModel } = config;
  if (!llmBaseUrl || !llmModel) return null;
  return new OpenAICompatibleProvider({
    name: labelFromUrl(llmBaseUrl),
    apiKey: llmApiKey || "dummy",
    baseURL: llmBaseUrl,
    model: llmModel,
  });
}

export function getProviderInfo(): ProviderInfo {
  const { llmBaseUrl, llmModel } = config;
  if (!llmBaseUrl || !llmModel) {
    return { name: "none", model: null, ready: false };
  }
  return {
    name: labelFromUrl(llmBaseUrl),
    model: llmModel,
    ready: true,
  };
}

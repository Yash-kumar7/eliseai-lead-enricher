import "dotenv/config";

export const config = {
  censusKey: process.env.CENSUS_KEY ?? "",
  newsapiKey: process.env.NEWSAPI_KEY ?? "",
  openweatherKey: process.env.OPENWEATHER_KEY ?? "",
  fredKey: process.env.FRED_KEY ?? "",

  // LLM: just point at any OpenAI compatible endpoint.
  // All three vars are set → LLM mode on. Any unset → template email.
  // Works with OpenAI, Groq, Fireworks, Together, Ollama, Mistral, DeepSeek,
  // Anthropic (OpenAI compat endpoint), vLLM, LM Studio, etc.
  llmBaseUrl: process.env.LLM_BASE_URL ?? "",
  llmApiKey: process.env.LLM_API_KEY ?? "",
  llmModel: process.env.LLM_MODEL ?? "",

  webhookSecret: process.env.WEBHOOK_SECRET ?? "",
  allowedOrigins: process.env.ALLOWED_ORIGINS ?? "",

  port: Number(process.env.PORT ?? 8000),
  cacheDir: process.env.CACHE_DIR ?? ".cache",
  requestTimeoutMs: 5000,
};

export function warnMissingKeys(): void {
  const missing: string[] = [];
  if (!config.newsapiKey) missing.push("NEWSAPI_KEY");
  if (!config.openweatherKey) missing.push("OPENWEATHER_KEY");
  if (missing.length > 0) {
    console.warn(
      `[config] missing keys: ${missing.join(", ")} (related enrichments will be skipped)`,
    );
  }
  if (!config.llmBaseUrl || !config.llmModel) {
    console.warn(
      "[config] LLM not configured, using template email. Set LLM_BASE_URL + LLM_MODEL (+ LLM_API_KEY if needed).",
    );
  }
}

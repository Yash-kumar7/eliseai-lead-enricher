/** Display label derived from LLM_BASE_URL hostname (e.g. "groq", "openai", "local"). */
export type ProviderName = string;

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export interface LLMProvider {
  /** Name shown in health endpoint + UI badge. */
  name: ProviderName;
  /** Model identifier passed to the API. */
  model: string;
  /** Returns parsed JSON email, or null on any failure (caller falls back to template). */
  generateOutreach(
    systemPrompt: string,
    userContent: string,
  ): Promise<GeneratedEmail | null>;
}

export interface ProviderInfo {
  name: ProviderName;
  model: string | null;
  ready: boolean;
}

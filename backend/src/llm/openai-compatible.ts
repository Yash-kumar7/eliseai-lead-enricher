import OpenAI from "openai";
import { extractJson } from "./json.js";
import type { GeneratedEmail, LLMProvider, ProviderName } from "./types.js";

/**
 * Single adapter that speaks the OpenAI chat completions API.
 * Powers three providers by swapping baseURL + apiKey + model:
 *   • OpenAI:       https://api.openai.com/v1
 *   • Fireworks.ai: https://api.fireworks.ai/inference/v1
 *   • Ollama:       http://localhost:11434/v1 (local, no key needed)
 */
export class OpenAICompatibleProvider implements LLMProvider {
  name: ProviderName;
  model: string;
  private client: OpenAI;
  private supportsJsonMode: boolean;

  constructor(opts: {
    name: ProviderName;
    apiKey: string;
    baseURL: string;
    model: string;
    supportsJsonMode?: boolean;
  }) {
    this.name = opts.name;
    this.model = opts.model;
    this.supportsJsonMode = opts.supportsJsonMode ?? opts.name === "openai";
    this.client = new OpenAI({
      apiKey: opts.apiKey || "dummy",
      baseURL: opts.baseURL,
    });
  }

  async generateOutreach(
    systemPrompt: string,
    userContent: string,
  ): Promise<GeneratedEmail | null> {
    try {
      const res = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 600,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        ...(this.supportsJsonMode
          ? { response_format: { type: "json_object" as const } }
          : {}),
      });
      const text = res.choices[0]?.message?.content ?? "";
      return extractJson<GeneratedEmail>(text);
    } catch (err) {
      console.warn(
        `[llm:${this.name}] failed:`,
        (err as Error).message,
      );
      return null;
    }
  }
}

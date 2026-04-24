/**
 * Extract the first JSON object from LLM output. Handles responses that wrap
 * JSON in prose or code fences. Returns null if parsing fails; caller falls
 * back to the template path.
 */
export function extractJson<T>(text: string): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

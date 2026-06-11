import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";

/**
 * Calls Claude with a single user prompt and returns the raw text response.
 * maxTokens is tunable per call — skeleton/achievements need less than a full
 * config, and a single phase needs less than all phases combined.
 */
export async function callClaude(prompt: string, maxTokens: number): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  return message.content[0].type === "text" ? message.content[0].text : "";
}

/**
 * Strips accidental markdown fences and parses JSON.
 * Returns { ok: true, data } or { ok: false, raw } so callers can log failures.
 */
export function parseJSON<T>(raw: string): { ok: true; data: T } | { ok: false; raw: string } {
  const cleaned = raw
    .replace(/^```json?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return { ok: true, data: JSON.parse(cleaned) as T };
  } catch {
    return { ok: false, raw };
  }
}

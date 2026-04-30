/**
 * lib/ai-router.ts
 *
 * All AI calls in BrandNest route through this module.
 * Traffic flows: This app → Cloudflare AI Gateway → OpenRouter → Model provider
 *
 * NEVER call api.openai.com or api.anthropic.com directly.
 */

// Cloudflare AI Gateway URL ending with /openrouter
const GATEWAY =
  process.env.CLOUDFLARE_AI_GATEWAY_URL ??
  'https://api.openai.com/v1'; // Fallback: direct OpenAI for local dev without gateway

const API_KEY =
  process.env.OPENROUTER_API_KEY ??
  process.env.OPENAI_API_KEY ??
  '';

// ── Model constants ────────────────────────────────────────────────────────────
// Route to cheapest model that produces acceptable output (per spec §2.1)

export const AI_MODELS = {
  /** Step 1 — Research. Web search enabled. */
  research: 'perplexity/sonar-pro',
  /** Step 3 — Long-form article drafting. Best quality. */
  write: 'anthropic/claude-sonnet-4-6',
  /** Step 5 — Social post repurposing. Low cost. */
  social: 'anthropic/claude-haiku-4-5-20251001',
  /** Step 2 — Outline + internal links + duplicate check. */
  outline: 'google/gemini-flash-2.0',
  /** Steps 4 & free tasks — Titles, meta, hashtags, alt text. FREE. */
  free: 'google/gemma-4-31b-it:free',
  /** Featured image generation. */
  image: 'black-forest-labs/flux-2-max',
} as const;

export type AiModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

// ── Chat completions ───────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CallAIOptions {
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  response_format?: { type: 'json_object' };
}

/**
 * Call the AI gateway with a model + messages.
 * Returns the raw Response so callers can stream or parse as needed.
 */
export async function callAI(
  model: string,
  messages: ChatMessage[],
  opts: CallAIOptions = {},
): Promise<Response> {
  if (!API_KEY) {
    throw new Error(
      'No AI API key configured. Add OPENROUTER_API_KEY (or OPENAI_API_KEY for local dev) to environment variables.',
    );
  }

  const endpoint = GATEWAY.endsWith('/openrouter')
    ? `${GATEWAY}/chat/completions`
    : `${GATEWAY}/chat/completions`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      // OpenRouter extras
      'HTTP-Referer': 'https://brandnest.app',
      'X-Title': 'BrandNest',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 2000,
      stream: opts.stream ?? false,
      ...(opts.response_format ? { response_format: opts.response_format } : {}),
    }),
  });

  return res;
}

/**
 * Convenience: call AI and parse the first message content as text.
 * Does NOT stream — use callAI() directly for streaming.
 */
export async function callAIText(
  model: string,
  messages: ChatMessage[],
  opts: Omit<CallAIOptions, 'stream'> = {},
): Promise<string> {
  const res = await callAI(model, messages, { ...opts, stream: false });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI error ${res.status}: ${err}`);
  }
  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * Convenience: call AI and parse result as JSON.
 * Strips markdown code fences if model wraps response in ```json ... ```
 */
export async function callAIJson<T = unknown>(
  model: string,
  messages: ChatMessage[],
  opts: Omit<CallAIOptions, 'stream'> = {},
): Promise<T> {
  const text = await callAIText(model, messages, opts);
  const clean = text
    .replace(/^```json?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();
  return JSON.parse(clean) as T;
}

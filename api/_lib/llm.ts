// ============================================================================
// LLM provider abstraction.
//
// The pipeline only depends on the `LLMProvider` interface, so the underlying
// model service can change ("subject to change") without touching pipeline
// code. Today the only implementation is OpenRouter (OpenAI-compatible Chat
// Completions API). To swap providers, add a new class and select it in
// `getLLM()` via env.
// ============================================================================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCallOptions {
  system: string;
  user: string;
  /** Ask the model for a JSON object response when supported. Default true. */
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  readonly name: string;
  /** Returns the raw text content of the model's reply. */
  complete(opts: LLMCallOptions): Promise<string>;
}

// ── OpenRouter implementation ───────────────────────────────────────────────

class OpenRouterProvider implements LLMProvider {
  readonly name = 'openrouter';
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  /** Per-request hard timeout. Bounds a hung/slow call so it fails fast and
   *  retries instead of silently consuming the whole function budget. Tune via
   *  OPENROUTER_TIMEOUT_MS — free models can be slow, so keep it generous. */
  private readonly timeoutMs: number;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set.');
    this.apiKey = apiKey;
    // Default model is JSON-capable; override via env.
    this.model = process.env.OPENROUTER_MODEL || 'google/gemini-3.1-flash-lite';
    this.baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.timeoutMs = Number(process.env.OPENROUTER_TIMEOUT_MS) || 90_000;
  }

  async complete(opts: LLMCallOptions): Promise<string> {
    const wantsJson = opts.json !== false;

    // Some (often free/preview) models reject `response_format: json_object`.
    // Try with JSON mode first, then transparently retry without it. The
    // downstream parser (parseLlmJson) recovers JSON from plain-text replies.
    try {
      return await this.request(opts, wantsJson);
    } catch (err) {
      if (wantsJson && isJsonModeUnsupported(err)) {
        return await this.request(opts, false);
      }
      throw err;
    }
  }

  private async request(opts: LLMCallOptions, useJsonMode: boolean): Promise<string> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user', content: opts.user },
      ] satisfies LLMMessage[],
      temperature: opts.temperature ?? 0.2,
    };
    if (opts.maxTokens) body.max_tokens = opts.maxTokens;
    if (useJsonMode) body.response_format = { type: 'json_object' };

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          // Optional attribution headers recommended by OpenRouter.
          'HTTP-Referer': process.env.OPENROUTER_REFERER || 'https://resumatch.app',
          'X-Title': 'Resumatch',
        },
        body: JSON.stringify(body),
        // Abort a stalled request so callLLM can retry / fail fast instead of
        // hanging until the serverless function itself times out.
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err) {
      if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        throw new Error(`OpenRouter request timed out after ${Math.round(this.timeoutMs / 1000)}s`);
      }
      throw err;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 500)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenRouter returned an empty completion.');
    }
    return content;
  }
}

/** True when an error looks like the model rejecting JSON-mode / response_format. */
function isJsonModeUnsupported(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    /response_format|json[_\s-]?mode|json[_\s-]?object|structured output/.test(msg) &&
    /\b(400|404|422|not support|unsupported|invalid|unrecognized)\b/.test(msg)
  );
}

// ── Provider selection + retry helper ───────────────────────────────────────

let cached: LLMProvider | null = null;

export function getLLM(): LLMProvider {
  if (cached) return cached;
  const provider = (process.env.LLM_PROVIDER || 'openrouter').toLowerCase();
  switch (provider) {
    case 'openrouter':
    default:
      cached = new OpenRouterProvider();
      return cached;
  }
}

/**
 * Call the active LLM with simple retry on transient failures.
 * Returns the raw text reply (parse with parseLlmJson when JSON is expected).
 */
export async function callLLM(opts: LLMCallOptions, maxTries = 2): Promise<string> {
  const llm = getLLM();
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxTries; attempt++) {
    try {
      return await llm.complete(opts);
    } catch (err) {
      lastErr = err;
      if (attempt < maxTries) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

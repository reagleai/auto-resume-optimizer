// ============================================================================
// Robust JSON extraction for LLM outputs.
// LLMs sometimes wrap JSON in ```fences, add prose, or emit the object inside a
// `text`/`output` wrapper. This mirrors the defensive parsing the n8n
// Formatter / Narrative Parser / Keyword Parser nodes did, condensed.
// ============================================================================

/** Strip leading/trailing markdown code fences (```json ... ```). */
export function stripMarkdownFences(value: string): string {
  let s = String(value).trim();
  s = s.replace(/^```[\w-]*\s*/i, '');
  s = s.replace(/\s*```$/i, '');
  return s.trim();
}

/**
 * Find the first balanced top-level JSON object/array in a string and return it.
 * Tolerates braces inside strings. Returns null if none found.
 */
function sliceFirstJson(text: string): string | null {
  const start = text.search(/[[{]/);
  if (start === -1) return null;

  const open = text[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inStr = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Parse an LLM response into a JS object.
 * Accepts: a raw object, a JSON string, a `{ text }`/`{ output }` wrapper,
 * markdown-fenced JSON, or JSON embedded in surrounding prose.
 * Throws if no JSON can be recovered.
 */
export function parseLlmJson<T = Record<string, unknown>>(raw: unknown): T {
  // Already an object (and not a wrapper) → return as-is.
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.text === 'string') return parseLlmJson<T>(obj.text);
    if (typeof obj.output === 'string') return parseLlmJson<T>(obj.output);
    return raw as T;
  }

  if (typeof raw !== 'string') {
    throw new Error(`parseLlmJson: expected string/object, got ${typeof raw}`);
  }

  const cleaned = stripMarkdownFences(raw);

  // Direct parse first.
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Fall through to slice-based recovery.
  }

  const sliced = sliceFirstJson(cleaned);
  if (sliced) {
    return JSON.parse(sliced) as T;
  }

  throw new Error(
    `parseLlmJson: could not extract JSON from model output (first 200 chars): ${cleaned.slice(0, 200)}`
  );
}

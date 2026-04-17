// Helpers for surfacing friendly AI error messages from edge function responses.
import type { FunctionsHttpError } from "@supabase/supabase-js";

export type AiErrorKind = "credits" | "rate_limit" | "generic";

export interface ParsedAiError {
  kind: AiErrorKind;
  message: string;
}

/**
 * Parse a Supabase Functions error and extract a friendly message.
 * supabase.functions.invoke wraps non-2xx responses in a FunctionsHttpError
 * whose `context` is the original Response object — we read the JSON body
 * to surface the real error from our edge function.
 */
export async function parseAiError(err: unknown): Promise<ParsedAiError> {
  // FunctionsHttpError exposes the response on `context`
  const ctx = (err as { context?: Response })?.context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = await ctx.clone().json();
      const raw = (body?.error || "").toString().toLowerCase();
      if (ctx.status === 402 || raw.includes("credit")) {
        return { kind: "credits", message: "AI credits exhausted. Please add credits to continue generating." };
      }
      if (ctx.status === 429 || raw.includes("rate")) {
        return { kind: "rate_limit", message: "Too many requests. Please wait a moment and try again." };
      }
      if (body?.error) return { kind: "generic", message: body.error };
    } catch {
      // fall through
    }
  }
  const msg = (err as Error)?.message || "Something went wrong. Please try again.";
  if (/402/.test(msg)) return { kind: "credits", message: "AI credits exhausted. Please add credits to continue generating." };
  if (/429/.test(msg)) return { kind: "rate_limit", message: "Too many requests. Please wait a moment and try again." };
  return { kind: "generic", message: msg };
}

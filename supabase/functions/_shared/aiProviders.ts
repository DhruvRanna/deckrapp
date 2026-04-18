// Shared multi-provider AI helper for edge functions.
// Tries providers in a randomized order to guarantee variety across calls,
// and falls back through Gemini → OpenAI → DeepSeek → Lovable AI Gateway.
// Returns parsed JSON arguments from a tool call, OR throws AllProvidersFailedError.

export class AllProvidersFailedError extends Error {
  status: number;
  reason: "credits" | "rate_limit" | "generic";
  constructor(message: string, status = 500, reason: "credits" | "rate_limit" | "generic" = "generic") {
    super(message);
    this.status = status;
    this.reason = reason;
  }
}

type ToolDef = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

type Msg = { role: "system" | "user" | "assistant"; content: string };

interface CallArgs {
  messages: Msg[];
  tool: ToolDef;
  // Higher = more variety. Used for OpenAI/DeepSeek; Gemini ignores but we vary prompts instead.
  temperature?: number;
}

const GEMINI_MODELS = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro"];
const OPENAI_MODELS = ["gpt-4o-mini", "gpt-4o"];
const DEEPSEEK_MODELS = ["deepseek-chat"];
const GROQ_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];
const LOVABLE_MODELS = ["google/gemini-3-flash-preview", "google/gemini-2.5-flash", "openai/gpt-5-mini"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- OpenAI-compatible (OpenAI, DeepSeek, Lovable Gateway) ----------
async function callOpenAICompatible(opts: {
  url: string;
  apiKey: string;
  model: string;
  messages: Msg[];
  tool: ToolDef;
  temperature: number;
}): Promise<{ ok: true; data: any } | { ok: false; status: number; body: string }> {
  const resp = await fetch(opts.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${opts.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature,
      tools: [{
        type: "function",
        function: {
          name: opts.tool.name,
          description: opts.tool.description,
          parameters: opts.tool.parameters,
        },
      }],
      tool_choice: { type: "function", function: { name: opts.tool.name } },
    }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    return { ok: false, status: resp.status, body };
  }
  const data = await resp.json();
  const tc = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc?.function?.arguments) return { ok: false, status: 502, body: "no tool call" };
  try {
    return { ok: true, data: JSON.parse(tc.function.arguments) };
  } catch {
    return { ok: false, status: 502, body: "tool args not valid JSON" };
  }
}

// ---------- Gemini native API ----------
async function callGeminiNative(opts: {
  apiKey: string;
  model: string;
  messages: Msg[];
  tool: ToolDef;
  temperature: number;
}): Promise<{ ok: true; data: any } | { ok: false; status: number; body: string }> {
  const sys = opts.messages.find(m => m.role === "system")?.content || "";
  const userParts = opts.messages.filter(m => m.role !== "system").map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent?key=${opts.apiKey}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: sys ? { parts: [{ text: sys }] } : undefined,
      contents: userParts,
      generationConfig: { temperature: opts.temperature },
      tools: [{
        functionDeclarations: [{
          name: opts.tool.name,
          description: opts.tool.description,
          parameters: opts.tool.parameters,
        }],
      }],
      toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: [opts.tool.name] } },
    }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    return { ok: false, status: resp.status, body };
  }
  const data = await resp.json();
  const fc = data?.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;
  if (!fc?.args) return { ok: false, status: 502, body: "no functionCall in Gemini response" };
  return { ok: true, data: fc.args };
}

// ---------- Public API ----------
export async function generateWithFallback({ messages, tool, temperature = 0.95 }: CallArgs): Promise<any> {
  const GEMINI = Deno.env.get("GEMINI_API_KEY");
  const OPENAI = Deno.env.get("OPENAI_API_KEY");
  const DEEPSEEK = Deno.env.get("DEEPSEEK_API_KEY");
  const GROQ = Deno.env.get("GROQ_API_KEY");
  const LOVABLE = Deno.env.get("LOVABLE_API_KEY");

  // Build provider chain in randomized order for variety, but skip those without keys.
  type Provider = () => Promise<{ ok: true; data: any } | { ok: false; status: number; body: string }>;
  const providers: { name: string; fn: Provider }[] = [];

  if (GEMINI) providers.push({
    name: "gemini",
    fn: () => callGeminiNative({ apiKey: GEMINI, model: pick(GEMINI_MODELS), messages, tool, temperature }),
  });
  if (OPENAI) providers.push({
    name: "openai",
    fn: () => callOpenAICompatible({ url: "https://api.openai.com/v1/chat/completions", apiKey: OPENAI, model: pick(OPENAI_MODELS), messages, tool, temperature }),
  });
  if (DEEPSEEK) providers.push({
    name: "deepseek",
    fn: () => callOpenAICompatible({ url: "https://api.deepseek.com/v1/chat/completions", apiKey: DEEPSEEK, model: pick(DEEPSEEK_MODELS), messages, tool, temperature }),
  });
  if (GROQ) providers.push({
    name: "groq",
    fn: () => callOpenAICompatible({ url: "https://api.groq.com/openai/v1/chat/completions", apiKey: GROQ, model: pick(GROQ_MODELS), messages, tool, temperature }),
  });

  // Randomize order of user-provided keys for variety
  const ordered = shuffle(providers);

  // Always keep Lovable as final fallback (deterministic last).
  if (LOVABLE) ordered.push({
    name: "lovable",
    fn: () => callOpenAICompatible({ url: "https://ai.gateway.lovable.dev/v1/chat/completions", apiKey: LOVABLE, model: pick(LOVABLE_MODELS), messages, tool, temperature }),
  });

  if (ordered.length === 0) {
    throw new AllProvidersFailedError("No AI provider keys configured", 500, "generic");
  }

  let lastStatus = 500;
  let lastReason: "credits" | "rate_limit" | "generic" = "generic";
  let lastMsg = "All AI providers failed";

  for (const p of ordered) {
    try {
      const result = await p.fn();
      if (result.ok) {
        console.log(`[ai] success via ${p.name}`);
        return result.data;
      }
      console.warn(`[ai] ${p.name} failed: ${result.status} ${result.body.slice(0, 200)}`);
      lastStatus = result.status;
      lastMsg = `${p.name}: ${result.body.slice(0, 200)}`;
      if (result.status === 402 || /credit|quota|billing|insufficient|exceeded/i.test(result.body)) lastReason = "credits";
      else if (result.status === 429) lastReason = "rate_limit";
    } catch (e) {
      console.error(`[ai] ${p.name} threw:`, e);
      lastMsg = `${p.name}: ${(e as Error).message}`;
    }
  }

  throw new AllProvidersFailedError(lastMsg, lastStatus, lastReason);
}

export const aiVariety = { pick, shuffle };

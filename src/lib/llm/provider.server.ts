import { getLLMConfig } from "./config.server";

export interface LLMGenerationRequest {
  system: string;
  user: string;
  responseSchema?: Record<string, unknown>;
}

export class LLMProviderError extends Error {
  constructor(public readonly kind: "UNAVAILABLE" | "UNAUTHORIZED" | "RATE_LIMITED" | "TIMEOUT" | "MALFORMED" | "PROVIDER_ERROR", message: string) {
    super(`LLM_${kind}:${message}`);
    this.name = "LLMProviderError";
  }
}

function safeStatus(status: number): LLMProviderError["kind"] {
  if (status === 401 || status === 403) return "UNAUTHORIZED";
  if (status === 429) return "RATE_LIMITED";
  return "PROVIDER_ERROR";
}

export async function generateText(request: LLMGenerationRequest): Promise<string> {
  const config = getLLMConfig();
  if (!config.apiKey) throw new LLMProviderError("UNAVAILABLE", "provider API key is not configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const body: Record<string, unknown> = {
      model: config.model,
      messages: [
        { role: "system", content: request.system },
        { role: "user", content: request.user },
      ],
      temperature: 0,
    };
    if (request.responseSchema) {
      body["response_format"] = {
        type: "json_schema",
        json_schema: { name: "grounded_explanation", strict: true, schema: request.responseSchema },
      };
    }

    let response: Response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          "HTTP-Referer": process.env["OPENROUTER_SITE_URL"] || "http://localhost:8080",
          "X-Title": "IP-SAKTI Sahayak",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw new LLMProviderError("TIMEOUT", "request timed out");
      throw new LLMProviderError("UNAVAILABLE", "provider request failed");
    }

    if (!response.ok) {
      // Never include the provider response body because it may contain sensitive diagnostics.
      throw new LLMProviderError(safeStatus(response.status), `provider returned HTTP ${response.status}`);
    }

    const json = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
    const content = json.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) throw new LLMProviderError("MALFORMED", "provider returned no text content");
    return content;
  } finally {
    clearTimeout(timer);
  }
}

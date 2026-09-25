export type LLMProviderName = "openrouter";

export interface LLMConfig {
  provider: LLMProviderName;
  model: string;
  apiKey: string | undefined;
  timeoutMs: number;
}

const DEFAULT_MODEL = "openrouter/free";
const DEFAULT_TIMEOUT_MS = 30_000;

export function getLLMConfig(): LLMConfig {
  const provider = (process.env["LLM_PROVIDER"] || "openrouter").toLowerCase();
  if (provider !== "openrouter") {
    throw new Error(`LLM_PROVIDER_UNSUPPORTED:${provider}`);
  }

  const timeoutMs = Number(process.env["LLM_TIMEOUT_MS"] || DEFAULT_TIMEOUT_MS);
  return {
    provider,
    model: process.env["LLM_MODEL"] || DEFAULT_MODEL,
    apiKey: process.env["OPENROUTER_API_KEY"] || undefined,
    timeoutMs:
      Number.isFinite(timeoutMs) && timeoutMs > 0
        ? timeoutMs
        : DEFAULT_TIMEOUT_MS,
  };
}

export function isLLMConfigured(): boolean {
  try {
    return Boolean(getLLMConfig().apiKey);
  } catch {
    return false;
  }
}

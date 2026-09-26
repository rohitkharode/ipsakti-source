import { afterEach, describe, expect, it, vi } from "vitest";
import { generateText, LLMProviderError } from "@/lib/llm/provider.server";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
});

describe("LLM provider adapter", () => {
  it("does not require a key during application startup", async () => {
    delete process.env.OPENROUTER_API_KEY;
    await expect(generateText({ system: "system", user: "user" })).rejects.toMatchObject({ kind: "UNAVAILABLE" });
  });

  it("constructs an OpenRouter request with configured model and schema", async () => {
    process.env.LLM_PROVIDER = "openrouter";
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.LLM_MODEL = "test/model";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: "{}" } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateText({ system: "grounding rules", user: "evidence context", responseSchema: { type: "object" } });
    expect(result).toBe("{}");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
    expect(JSON.parse(String(init.body))).toMatchObject({ model: "test/model", temperature: 0, response_format: { type: "json_schema" } });
  });

  it("maps provider HTTP failures without exposing response bodies", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("secret provider diagnostics", { status: 429 })));
    await expect(generateText({ system: "system", user: "user" })).rejects.toEqual(expect.objectContaining({ kind: "RATE_LIMITED" } satisfies Partial<LLMProviderError>));
  });

  it("rejects malformed provider output", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [] }), { status: 200 })));
    await expect(generateText({ system: "system", user: "user" })).rejects.toMatchObject({ kind: "MALFORMED" });
  });
});

# IP-SAKTI Sahayak v2 — LLM Provider Migration Report

## 1. Current Lovable Integration

The initial inspection found four runtime Lovable AI calls: grounded explanation, translation, query embeddings and corpus embeddings. They were located in `src/lib/engine/llm.server.ts`, `translate.server.ts`, `retrieval.server.ts` and `ingest.server.ts`. All four runtime calls were removed or replaced. Lovable build/preview infrastructure (`@lovable.dev/vite-tanstack-config`, preview auth and error reporting) remains because it is unrelated to LLM execution.

## 2. Migration

Business logic still calls `generateGroundedExplanation`; it now delegates to the server-only `generateText` provider adapter. Translation uses the same adapter. Evidence/RAG, routing, validation, citation guarding and deterministic assessment remain provider-independent.

```text
IP-SAKTI pipeline
  -> grounded explanation / translation
  -> LLM provider adapter
  -> OpenRouter chat completions
  -> structured response validation
  -> citation guard
  -> persisted explanation
```

## 3. OpenRouter Integration

`src/lib/llm/provider.server.ts` implements the first provider using the OpenRouter OpenAI-compatible chat-completions endpoint. It supports system/user messages, grounded context, JSON-schema output, configurable model, timeout, and controlled errors for missing key, unauthorized, rate limit, timeout, network, provider and malformed-response failures.

## 4. Environment Variables

Configure these only in the server/runtime environment or an ignored local env file:

```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=
LLM_MODEL=
LLM_TIMEOUT_MS=30000
OPENROUTER_SITE_URL=http://localhost:8080
```

The model fallback is centralized in `src/lib/llm/config.server.ts`; deployments should set `LLM_MODEL` explicitly. An empty key is allowed during startup and fails only when generation is attempted.

## 5. Security

`OPENROUTER_API_KEY` is read only by `.server.ts` code, has no `VITE_` prefix, is never stored in the database, and is not returned in API responses or logs. Provider response bodies are not copied into errors. No secret was added to source control.

## 6. Grounding

`llm.server.ts` continues to send normalized product data, classifications, routing context, accepted evidence, source/document/chunk provenance, evidence quality, verification status and citation IDs. Empty validated evidence still causes safe abstention. Deterministic classification and IP/regulatory routing remain outside the provider.

## 7. Citation Guard

The provider does not determine citation validity. After structured output, the existing guard removes unknown evidence IDs, rejects uncited or lexically unsupported claims, removes definitive legal wording, requires traceable summary evidence, and returns a controlled limitation when no grounded summary survives.

## 8. Translation

Hindi/Marathi canonicalisation and response localisation now call `generateText` through the same adapter. Existing terminology preservation remains active for botanical names, identifiers, regulation references and URLs. Missing provider configuration preserves the original language and records `TRANSLATION_UNAVAILABLE` through the existing pipeline behavior.

## 9. Failure Handling

| Condition | Behavior |
|---|---|
| Missing key | No startup crash; controlled unavailable output and `LLM_UNAVAILABLE` |
| Unsupported provider | Controlled unavailable state; no silent switching |
| 401/403 | Internal provider error without response-body exposure |
| 429 | Rate-limit error |
| Timeout/network failure | Controlled failure; deterministic assessment remains available |
| Malformed response | Rejected; no fabricated answer is shown |
| Missing embeddings | `VECTOR_UNAVAILABLE`; BM25 continues |

## 10. Tests

| Test | Result |
|---|---|
| Missing key does not crash startup | PASS |
| OpenRouter URL, headers, model and schema request | PASS |
| Provider rate-limit handling | PASS |
| Session 1 regression suite | PASS — 16 tests |
| Session 2 evidence/RAG suite | PASS — 7 tests |
| Full Vitest suite | PASS — 3 files, 27 tests |
| TypeScript check | PASS |
| Real OpenRouter request | NOT EXECUTED — no API key supplied |
| Live Supabase flow | NOT EXECUTED — no configured runtime database session |
| Repository lint | FAIL — 1,795 errors and 7 warnings, predominantly existing formatting debt |
| Production build | PASS — existing TanStack deprecation and chunk-size warnings remain |

## 11. Files Changed

- `src/lib/llm/config.server.ts`
- `src/lib/llm/provider.server.ts`
- `src/lib/engine/llm.server.ts`
- `src/lib/engine/translate.server.ts`
- `src/lib/engine/pipeline.server.ts`
- `src/lib/engine/retrieval.server.ts`
- `src/lib/engine/ingest.server.ts`
- `tests/llm-provider.test.ts`
- `docs/ARCHITECTURE.md`
- `docs/DEPLOYMENT.md`
- `docs/RAG.md`

## 12. Remaining Work

1. Configure an OpenRouter key and selected model in the runtime environment.
2. Run one authenticated real-provider request and inspect structured output/citation guard behavior.
3. Add a supported embedding provider later if dense retrieval is required; BM25 fallback is explicit for now.
4. Apply the Session 2 provenance migration in the target Supabase environment.
5. Reduce pre-existing lint debt separately from this migration.

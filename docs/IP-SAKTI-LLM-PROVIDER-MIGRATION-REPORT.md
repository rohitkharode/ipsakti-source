# IP-SAKTI Sahayak — LLM Provider Migration Report

## 1. Initial Provider Integration

The initial inspection found four runtime LLM functions: grounded explanation, translation, query embeddings, and corpus embeddings located in `src/lib/engine/llm.server.ts`, `translate.server.ts`, `retrieval.server.ts`, and `ingest.server.ts`. Runtime text generation calls were migrated to a clean server-side OpenRouter provider adapter.

## 2. Migration Architecture

Business logic calls `generateGroundedExplanation`, which delegates to the server-only `generateText` provider adapter. Translation uses the same adapter. Evidence/RAG, routing, validation, citation guarding, and deterministic assessment remain provider-independent.

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

`src/lib/llm/provider.server.ts` implements the provider using OpenRouter's OpenAI-compatible chat-completions endpoint. It supports system/user messages, grounded context, JSON-schema output, configurable model, timeout, and controlled errors for missing key, unauthorized, rate limit, timeout, network, provider, and malformed-response failures.

## 4. Environment Variables

Configure these in the server runtime environment or local `.env` file:

```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=
LLM_MODEL=openrouter/free
LLM_TIMEOUT_MS=30000
OPENROUTER_SITE_URL=http://localhost:8080
```

The model fallback is centralized in `src/lib/llm/config.server.ts` to `openrouter/free`. An empty API key is allowed during startup and raises a controlled error only when generation is attempted.

## 5. Security

`OPENROUTER_API_KEY` is read only by `.server.ts` modules, has no `VITE_` prefix, is never stored in the database, and is not returned in API responses or logs. Provider response bodies are not copied into error payloads. No secret is committed to source control.

## 6. Grounding

`llm.server.ts` sends normalized product data, classifications, routing context, accepted evidence, source/document/chunk provenance, evidence quality, verification status, and citation IDs. Empty validated evidence causes safe abstention. Deterministic classification and IP/regulatory routing remain outside the provider.

## 7. Citation Guard

The provider does not determine citation validity. After structured output is returned, the guard removes unknown evidence IDs, rejects uncited or lexically unsupported claims, removes definitive legal wording, requires traceable summary evidence, and returns a controlled limitation when no grounded summary survives.

## 8. Translation

Hindi/Marathi canonicalisation and response localisation call `generateText` through the same adapter. Existing terminology preservation remains active for botanical names, identifiers, regulation references, and URLs. Missing provider configuration preserves the original language and records `TRANSLATION_UNAVAILABLE` through pipeline behavior.

## 9. Failure Handling

| Condition               | Behavior                                                              |
| ----------------------- | --------------------------------------------------------------------- |
| Missing key             | No startup crash; controlled unavailable output and `LLM_UNAVAILABLE` |
| Unsupported provider    | Controlled unavailable state; no silent switching                     |
| 401/403                 | Internal provider error without response-body exposure                |
| 429                     | Rate-limit error handling                                             |
| Timeout/network failure | Controlled failure; deterministic assessment remains available        |
| Malformed response      | Rejected; no fabricated answer is shown                               |
| Missing embeddings      | Fallback to BM25 search                                               |

## 10. Verification Suite

- Missing key does not crash startup
- OpenRouter request payload, headers, model, and schema structure
- Provider rate-limit handling
- Session 1 regression test suite
- Session 2 evidence/RAG test suite
- Vitest test suite execution
- TypeScript compilation check
- Lint and production build checks

## 11. Modified Files

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

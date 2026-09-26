# Architecture

IP-SAKTI Sahayak is a modular monolith. One React 19 / TanStack Start application serves the UI, the server functions and the API routes; Supabase PostgreSQL / pgvector with server-side access controls is the primary datastore.

```
Browser (routes, forms, result views)
  -> services layer (src/services/index.ts)
  -> server functions (src/lib/api.functions.ts)
  -> engine modules (src/lib/engine/*.server.ts)
  -> Postgres (corpus, cases, analyses, checklist, review, audit)
  -> LLM provider adapter (OpenRouter for grounded explanation and translation)
```

## Pipeline

`runAnalysis(product, language)` in `src/lib/engine/pipeline.server.ts`:

1. Create case, store submitted product snapshot, audit `case_created`.
2. `canonicaliseProduct` (translate.server.ts) — detects language, normalises free text to canonical English, leaves scientific names, quantities and identifiers untouched. Audit `input_normalised`.
3. `classifyProduct` (classify.server.ts) — deterministic rules from `src/lib/rules/classifier_rules.json`, four dimensions. Audit `classification_completed`.
4. `hybridRetrieve` (retrieval.server.ts) — BM25 (`bm25_evidence`) plus vector search (`match_evidence`), transparent rank fusion. Audit `evidence_retrieved`.
5. `validateEvidence` (validate.server.ts) — authority, jurisdiction, currentness, relevance, conflicts; returns accepted / rejected / conflicts / coverage.
6. `generateGroundedExplanation` (llm.server.ts) — context builder, strict JSON schema, then citation guard.
7. Routing (routing.server.ts) — IP, regulatory, TK, ABS, market screening.
8. Confidence and abstention; `buildChecklist` (checklist.server.ts); expert review packet when required.
9. `localiseNarrative` — translates the narrative back to the user language. Evidence is never translated. Audit `response_translated`.
10. Persist analysis, checklist items, review request and audit events.

## Boundaries

The frontend performs no classification, retrieval, validation or routing. It submits input, renders status, evidence, uncertainty and checklist, and requests actions. All secrets stay server-side.

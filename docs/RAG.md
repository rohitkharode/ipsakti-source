# Retrieval and grounding

## Hybrid retrieval

`src/lib/engine/retrieval.server.ts`.

- **Query normalisation** — canonical English query built from product name, type, description, ingredients (common and scientific names), claims, preparation and innovation text.
- **Lexical** — `bm25_evidence(query_text, match_count)` using `websearch_to_tsquery` and `ts_rank_cd` over the `search` tsvector. Handles section numbers, Act names, scientific binomials and category terms.
- **Semantic** — optional `match_evidence(query_embedding, match_count)` vector search. No embedding provider is configured in the current migration, so BM25 is the active safe fallback.
- **Rank fusion** — transparent weighted sum, stored per item so the UI can explain why an item was retrieved:

  | signal | weight |
  |---|---|
  | lexical score | 0.30 |
  | semantic score | 0.30 |
  | authority level | 0.20 |
  | jurisdiction match | 0.12 |
  | topic match | 0.05 |
  | currentness / version | 0.03 |

- **Metadata filter** — jurisdiction and topic filters applied after fusion.
- Reranking is deliberately not implemented; retrieval correctness and validation were prioritised.

## Evidence validation

`validate.server.ts` checks authority level, jurisdiction fit, currentness, topical relevance and citation integrity, and detects contradictions between accepted items. Output: `accepted`, `rejected` (with reason), `conflicts`, `coverage`. Rejections are shown, not hidden.

## Grounded generation

`llm.server.ts` builds context from accepted evidence only and calls the server-side provider adapter. The current provider is OpenRouter with a centrally configured model and strict JSON schema. The prompt requires: factual regulatory statements only from supplied evidence, source facts separated from inference, explicit statements of insufficient evidence, preserved citations, no definitive legal claims.

## Citation guard

After generation every citation is checked against the retrieved set. Citations to unknown source ids are removed, the affected claim is downgraded (`unsupported` / `insufficient_evidence`), and confidence is reduced. If nothing survives, the analysis abstains.

## Safe abstention

The analysis abstains when there is no accepted evidence, or confidence is below 40, or sources conflict on the key question. The result states the reason, the missing information and the recommended next step instead of producing an answer.

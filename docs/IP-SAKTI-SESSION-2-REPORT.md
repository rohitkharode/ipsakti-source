# IP-SAKTI Sahayak v2 — Session 2 Report

## 1. Executive Summary

The existing BM25/vector pipeline was strengthened without replacing it.

Implemented:

- Explicit source/document/chunk provenance on evidence records.
- Evidence quality states: `VERIFIED`, `CURATED`, `SYNTHETIC`, `UNKNOWN`.
- Source type and authority hierarchy metadata.
- Canonical market-aware candidate filtering.
- Explainable deterministic second-pass reranking.
- Validation statuses and provenance checks.
- Conservative potential-conflict detection.
- LLM context containing provenance and evidence-quality state.
- Summary citation requirements and deterministic claim/evidence alignment checks.
- Session 1 failure-state and ownership behavior preserved.

The system is more honest about its current corpus: the migration marks the existing authored summaries as `CURATED`, not verified source passages.

## 2. Existing Architecture Found

Before this session the runtime path was:

```text
classification queries
  → PostgreSQL BM25 RPC + optional embedding/vector RPC
  → fixed score fusion
  → source lookup
  → heuristic evidence validation
  → deterministic routing
  → optional grounded LLM
  → citation-ID guard
  → checklist/review/case persistence
```

The schema already had `sources`, `documents`, `evidence_chunks`, source IDs, document IDs, sections, pages, dates, versions and URLs. It did not explicitly represent evidence quality or source type, and there was no separate reranking layer.

## 3. Changes Implemented

- Added evidence/domain types for quality, validation status and provenance.
- Added migration `20260920170000_session2_evidence_provenance.sql`.
- Added `source_type`, `document_status`, `evidence_quality`, `verification_status`, `market_scope` and related indexes.
- Backfilled existing seeded evidence as `CURATED` with `curated_summary` verification state.
- Added source-type authority hierarchy derived from existing authority levels.
- Updated generated Supabase types for the new columns.
- Updated retrieval to join source/document metadata.
- Added market-aware candidate filtering using canonical market codes and `Global` scope.
- Added deterministic second-pass reranking with documented component weights.
- Added reranking explanations such as lexical match, semantic match, jurisdiction match, official source type and curated-quality limitation.
- Reworked validation to check provenance completeness, authority class, jurisdiction, currentness, relevance and verification state.
- Added validation statuses: `VALID`, `PARTIAL`, `INSUFFICIENT`, `UNVERIFIED`, `CONFLICTING`.
- Added conservative explicit positive/negative requirement conflict detection.
- Added provenance and quality metadata to LLM context.
- Added summary citation IDs to the structured LLM response schema.
- Added deterministic lexical claim/evidence alignment to the citation guard.
- Preserved Session 1 authentication, ownership, canonical market and failure-state logic.
- Added Session 2 unit tests.

## 4. Evidence Architecture

```text
Source
  → Document
    → Evidence chunk/passage
      → BM25/vector retrieval event
        → ranked Evidence record
          → validation status
            → grounded LLM citation
```

Each runtime evidence record now carries or derives:

- source ID and source name
- document ID and document title
- chunk ID
- section/page
- source URL when available
- source type
- authority level
- jurisdiction
- version/effective date
- evidence quality
- verification state
- retrieval and reranking signals

The current seeded corpus remains curated summaries linked to official landing pages. It is not represented as independently verified passage text.

## 5. Retrieval

### BM25

Preserved PostgreSQL full-text search through `bm25_evidence()`.

### Vector retrieval

Preserved Lovable embedding generation and pgvector similarity search. Missing/unavailable embedding configuration still falls back to lexical retrieval.

### Hybrid retrieval

BM25 and vector candidates are merged before metadata-aware scoring.

### Metadata filtering

Candidates are limited to selected market jurisdictions or `Global`. Canonical values are mapped as:

```text
IN → India
EU → EU
US → US
ASEAN → ASEAN
GLOBAL → Global
```

### Reranking

A deterministic second pass considers:

- lexical score: 25%
- semantic score: 25%
- authority: 20%
- jurisdiction match: 15%
- currentness: 8%
- source type: 4%
- evidence quality: 3%

These are ranking signals, not legal confidence values.

### Fallback

When embeddings are unavailable, the pipeline continues with BM25 candidates and records `VECTOR_UNAVAILABLE` when configuration is absent.

## 6. Evidence Validation

Validation now checks:

- minimum relevance/reranking threshold
- complete source/document/chunk provenance
- source authority class
- selected jurisdiction or `Global` scope
- known effective date
- evidence quality and verification state
- citation location integrity

Curated evidence can remain available for screening context, but is marked `UNVERIFIED` and is not displayed as verified evidence.

## 7. Contradiction Detection

The first implementation is intentionally conservative. It groups evidence by jurisdiction and topic/section and looks for explicit incompatible requirement language such as permitted/allowed versus prohibited/not permitted across different sources.

It preserves both records and emits a potential-conflict message with both evidence IDs. The pipeline escalates the case for human review.

Limitations:

- It is not a full semantic contradiction model.
- It does not infer contradiction from wording differences alone.
- Supersession detection beyond explicit metadata is not implemented.

## 8. LLM Grounding

The LLM receives:

- product summary
- classifications
- routing context
- evidence text
- source/document/chunk provenance
- source type
- evidence quality
- verification status

The structured response now requires `summary_evidence` IDs as well as claim-level evidence IDs. When no valid summary citation or claim/evidence alignment exists, the guard returns a safe limitation instead of presenting unsupported text.

## 9. Citation Integrity

The guard now:

- removes nonexistent evidence IDs
- rejects uncited claims
- rejects claims with no meaningful lexical alignment to cited passages
- rejects definitive legal wording
- requires traceable summary evidence IDs
- preserves only citations from the accepted evidence set

This is a deterministic first layer; it is not a complete semantic entailment system.

## 10. Data Provenance

| State | Meaning | Current corpus use |
|---|---|---|
| `VERIFIED` | Passage and source have been independently verified | Supported for future ingestion; not used by current seed rows |
| `CURATED` | Authored/curated prototype evidence linked to a source reference | Existing migration seed rows |
| `SYNTHETIC` | Test-only or generated fixture | Test fixtures |
| `UNKNOWN` | Quality cannot be established | Default for new unclassified records |

The existing 11 sources, 11 documents and 16 evidence chunks are curated prototype content. No live source ingestion or independent document verification was performed in this session.

## 11. Tests

| Category | Result |
|---|---|
| Session 1 ownership and market regression tests | PASS — 16 tests |
| Provenance validation | PASS |
| Wrong-jurisdiction rejection | PASS |
| Curated evidence quality handling | PASS |
| Compatible evidence conflict check | PASS |
| Incompatible requirement conflict check | PASS |
| Citation alignment guard | PASS |
| Full Vitest suite | PASS — 2 files, 23 tests |
| TypeScript check (`npx.cmd tsc --noEmit`) | PASS |
| Production build (`npm.cmd run build`) | PASS, with existing deprecation/chunk-size warnings |
| Repository lint (`npm.cmd run lint`) | FAIL — 1,788 auto-fixable formatting errors, mostly existing compressed formatting across the repository |
| Live Supabase retrieval/migration test | NOT EXECUTED — configured remote database required |
| Live LLM/embedding test | NOT EXECUTED — no external provider key was configured |
| Browser end-to-end evidence flow | NOT EXECUTED — no authenticated runtime/database session configured |
| Performance measurements | NOT EXECUTED |

## 12. Known Limitations

- The corpus is curated summary text, not a verified legal/regulatory document corpus.
- Reranking is deterministic and heuristic; it is not evaluated against a labelled retrieval set yet.
- Conflict detection is a conservative first pass.
- Semantic citation validation is lexical overlap, not entailment.
- Vector availability is configuration-dependent.
- Live database migration application was not verified.
- LLM grounding was not executed against the external gateway in this environment.
- Repository-wide lint remains failing because of pre-existing formatting debt.

## 13. Security Regression

Session 1 behavior was preserved:

- Protected server functions still use authentication middleware.
- Case creation still derives `cases.user_id` from the authenticated session.
- Case and analysis reads remain ownership-scoped.
- Checklist and review mutations remain ownership-scoped.
- Canonical market normalization remains in place.
- Structured failure states remain persisted and returned.

No Session 2 change weakens service-role ownership checks or exposes service credentials.

## 14. Files Changed

- `src/types/domain.ts`
- `src/integrations/supabase/types.ts`
- `src/lib/engine/retrieval.server.ts`
- `src/lib/engine/validate.server.ts`
- `src/lib/engine/llm.server.ts`
- `src/lib/engine/pipeline.server.ts`
- `src/lib/api.functions.ts`
- `src/lib/errors.ts`
- `src/mock/data.ts`
- `supabase/migrations/20260920170000_session2_evidence_provenance.sql`
- `tests/session2.evidence.test.ts`
- `docs/IP-SAKTI-SESSION-2-REPORT.md`

## 15. Recommended Session 3 Work

1. Apply and verify the provenance migration against a test Supabase project.
2. Run authenticated end-to-end retrieval and case persistence tests.
3. Replace curated summaries incrementally with verified source passages and exact locations.
4. Expand the labelled retrieval benchmark and measure precision@K.
5. Improve contradiction detection with structured subject/condition extraction.
6. Add stage latency instrumentation and execute performance measurements.

No unrelated UI redesign, paid integration, TKDL access, advanced multilingual work or performance optimization was implemented in Session 2.

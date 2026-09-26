# Data model

TypeScript contracts live in `src/types/domain.ts`. Tables live in Supabase PostgreSQL.

## Corpus tables

- `sources` — `id`, `name`, `publisher`, `authority_level` (1 highest), `authority_label`, `jurisdiction`, `document_type`, `version`, `effective_date`, `retrieved_at`, `official_url`, `verification_status`, `topics`. Publicly readable.
- `documents` — `id`, `source_id`, `title`, `version`, `document_hash`, `effective_date`, `retrieved_at`, `language`. Publicly readable.
- `evidence_chunks` — `id`, `document_id`, `source_id`, `section`, `page`, `topic`, `tags`, `jurisdiction`, `effective_date`, `version`, `authority_level`, `text`, `language`, `embedding vector(3072)`, `search tsvector`. Publicly readable. HNSW index on `embedding::halfvec(3072)`.

## Case tables (service role only)

- `cases` — `id`, `case_ref`, `user_id`, `product` (jsonb snapshot), `language`, `status`, `reviewer`, timestamps.
- `analyses` — `id`, `analysis_ref`, `case_id`, `status`, `language`, `classification`, `evidence`, `routes`, `explanation`, `missing_information`, `confidence`, `confidence_label`, `abstained`, `review` (all jsonb where applicable).
- `checklist_items` — `analysis_id`, `title`, `description`, `priority`, `status`, `evidence_id`, `owner`, `due_date`, `notes`, `position`.
- `review_requests` — `analysis_id`, `level`, `reason`, `action`, `packet` jsonb, `status`, `requested_by`.
- `audit_events` — `case_id`, `analysis_id`, `event_type`, `detail` jsonb, `created_at`.

## Audit event types

`case_created`, `input_normalised`, `classification_completed`, `evidence_retrieved`, `evidence_validated`, `assessment_generated`, `response_translated`, `review_requested`, `checklist_updated`.

## Versioning

Sources and documents carry `version`, `effective_date`, `retrieved_at` and `document_hash`. A changed document is added as a new row with a new version; existing evidence chunks and stored analyses keep their original references so past cases remain readable.

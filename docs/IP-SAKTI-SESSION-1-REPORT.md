# IP-SAKTI Sahayak v2 — Session 1 Report

## 1. Changes made

- Enforced the existing Supabase authentication middleware on case and analysis operations.
- Persisted the authenticated Supabase user ID on every newly created case.
- Added explicit server-side ownership filtering for analysis reads, case lists, checklist updates, review requests and overview statistics.
- Added canonical internal market codes: `IN`, `EU`, `US`, `ASEAN`, `GLOBAL`.
- Added compatibility normalization for legacy display strings such as `European Union` and `United States`.
- Updated demo scenarios and routing to use canonical market codes.
- Added missing intake fields for plant part, supplier, geographic source, dosage form, traditional reference, registration/licence, existing IP and applicant information.
- Added `intakeStatus` values for `provided`, `not_provided`, `unknown` and `not_applicable`.
- Added structured failure states for authentication, insufficient product data, unavailable vector/LLM/translation services, no evidence, conflicting evidence, database failure and human review.
- Added a user-facing analysis status panel for persisted failure states.
- Added a database index supporting case ownership lookups.
- Added executable Vitest test definitions for market normalization/routing and ownership policy behavior.

## 2. Files changed

- `src/types/domain.ts`
- `src/lib/markets.ts`
- `src/lib/errors.ts`
- `src/lib/ownership.ts`
- `src/lib/api.functions.ts`
- `src/lib/engine/pipeline.server.ts`
- `src/lib/engine/routing.server.ts`
- `src/lib/engine/classify.server.ts`
- `src/lib/rules/classifier_rules.json`
- `src/lib/demo/scenarios.ts`
- `src/routes/analysis.new.tsx`
- `src/components/features/analysis-result.tsx`
- `supabase/migrations/20260920150000_session1_foundation.sql`
- `tests/session1.foundation.test.ts`
- `package.json`

## 3. Database/migration changes

Added:

- `cases_user_id_created_at_idx`
- `analyses_ref_case_id_idx`

No new case fields were required because `cases.user_id` already existed and product/route snapshots are JSONB. New intake fields persist inside the existing `cases.product` JSONB snapshot.

## 4. Security changes

- Protected create-analysis, get-analysis, list-cases, checklist mutation, review mutation, overview statistics and corpus reindex operations with `requireSupabaseAuth`.
- Ownership is derived from `context.userId`; no client-provided ownership ID is accepted.
- `runAnalysis()` writes `cases.user_id` using the authenticated identity.
- Service-role queries explicitly filter by the authenticated user because service-role access bypasses RLS.
- Cross-user case access returns not-found semantics.

Evidence and source-library reads remain public because the existing design exposes the evidence corpus publicly. Case and analysis data are protected.

## 5. Market normalization changes

Canonical internal values are now:

```text
India            → IN
European Union   → EU
United States    → US
ASEAN            → ASEAN
Global           → GLOBAL
```

Routing receives canonical codes. Evidence jurisdiction matching maps `IN` to the seeded corpus value `India`; `EU`, `US`, `ASEAN` and `GLOBAL` remain compatible with their corpus values.

## 6. Intake changes

The actual intake form now includes:

- Plant part
- Supplier
- Geographic source
- Source status
- Dosage form
- Traditional reference
- Existing registration/licence
- Existing IP
- Applicant name
- Applicant organisation
- Applicant email
- Applicant address

These values pass through the product schema and are persisted with the case snapshot. ABS and classification logic consume the relevant fields already used by those engines.

## 7. Failure-state changes

Added machine-readable codes:

```text
AUTH_REQUIRED
INSUFFICIENT_PRODUCT_DATA
NO_EVIDENCE
VECTOR_UNAVAILABLE
LLM_UNAVAILABLE
TRANSLATION_UNAVAILABLE
DATABASE_ERROR
CONFLICTING_EVIDENCE
HUMAN_REVIEW_REQUIRED
```

Failure states are persisted in the existing analysis route JSONB snapshot and returned by `getAnalysis`. The analysis screen displays them separately from normal low-confidence results.

## 8. Tests added

`tests/session1.foundation.test.ts` contains:

- Display-label to canonical-market normalization tests.
- Routing tests for `IN`, `EU`, `US`, `ASEAN` and `GLOBAL`.
- Unauthenticated ownership rejection test.
- Authenticated case-owner persistence test.
- Same-user access test.
- Cross-user read rejection test.
- Cross-user checklist mutation policy test.
- Cross-user review mutation policy test.

These are policy/unit tests. Live Supabase integration tests that create real users and database rows still require a configured test environment.

## 9. Tests actually executed

| COMMAND                                        | RESULT                                                       | STATUS                                           |
| ---------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| `npm.cmd install`                              | Did not complete; no `node_modules` was created              | NOT EXECUTED — ENVIRONMENT/NETWORK REQUIRED      |
| `npm.cmd run test`                             | `vitest` not found because dependencies were unavailable     | NOT EXECUTED — DEPENDENCIES MISSING              |
| `npm.cmd run lint`                             | `eslint` not found because dependencies were unavailable     | NOT EXECUTED — DEPENDENCIES MISSING              |
| `npm.cmd run build`                            | `vite` not found because dependencies were unavailable       | NOT EXECUTED — DEPENDENCIES MISSING              |
| Live Supabase authentication tests             | No configured runtime credentials/environment were available | NOT EXECUTED — ENVIRONMENT REQUIRED              |
| Browser create → refresh → reopen verification | No runnable application server was available                 | NOT EXECUTED — DEPENDENCIES/ENVIRONMENT REQUIRED |

Static verification was performed with repository inspection and targeted searches. Static verification is not a substitute for the commands above.

## 10. Remaining problems

- Dependencies and runtime verification remain outstanding.
- Live cross-user Supabase integration tests are not yet run.
- The application currently has no visible sign-in flow; deployment must provide authenticated sessions before protected pages can operate.
- Existing evidence corpus, reranking, contradiction detection, multilingual retrieval and performance work remain unchanged.
- The seeded corpus is still curated prototype text rather than verified source-document ingestion.
- Error handling around some secondary database writes still needs stronger transaction semantics.
- Existing legacy/mock fixtures remain in the repository but are not used by the production service path.

## 11. Recommended next session

1. Install dependencies in a network-enabled environment and run typecheck, lint, tests and build.
2. Configure a test Supabase project with two test users and execute the live ownership tests.
3. Run the complete Ashwagandha flow and refresh/reopen persistence verification.
4. Then proceed to P0 evidence provenance and executable pipeline tests.

Reranking, contradiction detection, advanced RAG, multilingual overhaul and performance optimization were intentionally not implemented in Session 1.

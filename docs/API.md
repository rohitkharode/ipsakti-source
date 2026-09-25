# API

App-internal calls are TanStack server functions in `src/lib/api.functions.ts`, consumed through the service layer in `src/services/index.ts`. Every payload is validated server-side and every query is parameterised.

| Server function       | Input                                              | Output                                                                                                                                  |
| --------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `createAnalysis`      | `Product` + `language`                             | analysis id, case ref, status                                                                                                           |
| `getAnalysis`         | analysis id                                        | case, product snapshot, classification, evidence, routes, explanation, confidence, missing information, checklist, review, audit events |
| `listCases`           | search, filters, paging                            | case rows                                                                                                                               |
| `listEvidence`        | query, jurisdiction, source type, authority, topic | evidence rows                                                                                                                           |
| `listEvidenceItem`    | evidence id                                        | evidence record with source metadata                                                                                                    |
| `listSources`         | —                                                  | source registry                                                                                                                         |
| `updateChecklistItem` | item id, status / owner / due date / notes         | updated item                                                                                                                            |
| `requestExpertReview` | analysis id, reason                                | review request                                                                                                                          |
| `getOverviewStats`    | —                                                  | counts for the overview screen                                                                                                          |
| `reindexCorpus`       | —                                                  | embedding backfill result                                                                                                               |

## Service abstraction

UI components never call the network directly. `analysisService`, `evidenceService`, `caseService`, `sourceService`, `checklistService` and the translation layer are thin wrappers, so the transport can change without touching components.

## Structured errors

`VALIDATION_ERROR`, `SOURCE_NOT_FOUND`, `INSUFFICIENT_EVIDENCE`, `JURISDICTION_UNCLEAR`, `TRANSLATION_FAILED`, `RETRIEVAL_FAILED`, `LLM_FAILED`, `ANALYSIS_FAILED`, `DATABASE_ERROR`. Each is mapped to a user-facing message that says what failed, what was saved and what to do next.

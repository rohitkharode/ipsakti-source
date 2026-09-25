# Testing

## Test data

- `tests/benchmark.cases.json` — classification, retrieval, grounding, routing and safety cases with expectations.
- `tests/multilingual.cases.json` — English, Hindi, Marathi and mixed-language cases.
- `src/lib/demo/scenarios.ts` — five end-to-end scenarios, also selectable in the wizard.

## Metrics

classification accuracy, evidence precision@5, citation support rate, unsupported-claim rate, correct escalation rate, multilingual intent preservation, routing correctness, end-to-end success rate, average response time.

No accuracy number may be published unless it was produced by running this benchmark. The prototype ships no invented percentages.

## What has been verified

- Type check: `bunx tsgo --noEmit` passes.
- End-to-end English run through the wizard producing classification, evidence, routing, checklist, escalation and a saved case with audit history.
- End-to-end Hindi run (cases IPS-2026-36700, IPS-2026-99595): Hindi input, English reasoning, Hindi narrative, untranslated sources, preserved identifiers.
- Checklist route renders independently of the result route.
- Responsive check at 1280x1800 and 375x900 with no console or page errors.

## Not yet run

- A full scored pass of `tests/benchmark.cases.json` (the file defines the expectations; the scores are not claimed).
- A Marathi end-to-end wizard run.

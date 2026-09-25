# Routing engines

`src/lib/engine/routing.server.ts`. All engines are deterministic and driven by classification, product facts and validated evidence. Wording is always conditional.

## IP pathways

Patent, Trademark, GI, Copyright, Trade Secret, Prior Art, Traditional Knowledge. Each returns `relevance` (Potentially relevant / Review recommended / Further evidence required), `reason`, `evidence`, `nextStep`, `confidence`, `reviewRequired`. The system never states that something is patentable or protected.

## Regulatory routes

Derived from product pathway, claim profile, ingredients, dosage form and market. Each route returns the potentially applicable authority, the reason, supporting evidence, the next step and remaining uncertainty. Jurisdictions covered by the seeded corpus: India, European Union, United States, ASEAN (limited), Global (generic).

## TK / prior-art screening

Flags traditional-knowledge relevance and recommends prior-art screening. The prototype has **no authorised TKDL access** and never claims to have searched TKDL. It explains that TKDL exists and routes the user to the appropriate authorised verification path.

## ABS screening

Inputs: biological resource, geographic source, cultivated or wild status, supplier, TK association, market and use. Output: potential ABS relevance, reason, missing information, verification required and the suggested authority or pathway. Not a legal determination.

## International market screening

India, European Union, United States, ASEAN, Other. Each market returns the potential category, relevant evidence, potential authority, missing information and review status, with coverage limits stated explicitly.

## Checklist

`checklist.server.ts` combines classification, claims, innovation, IP and regulatory routes, ABS, TK, markets, missing information and confidence into prioritised actions (High / Medium / Low) with reason, evidence reference, status and review flag.

## Human escalation

Triggered by insufficient evidence, ambiguous classification, conflicting sources, high legal significance, incomplete prior-art or TK verification, low translation confidence or unclear jurisdiction. The packet contains the case, product, inputs, classification, evidence, uncertainty, missing facts and a suggested question for the expert.

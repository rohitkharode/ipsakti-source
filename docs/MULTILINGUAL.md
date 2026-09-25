# Multilingual layer

Supported: **English, Hindi, Marathi**. The architecture allows additional languages through a translation fallback; nothing beyond these three is claimed.

## Pipeline

```
user language -> detection -> input normalisation -> canonical English
  -> classification / retrieval / validation / reasoning
  -> canonical English response -> translation -> user language
```

`src/lib/engine/translate.server.ts` implements `TranslationService`: `detectLanguage` (offline Devanagari and Marathi-marker test), `translateToEnglish`, `translateFromEnglish`, `canonicaliseProduct`, `localiseNarrative`, `collectProtectedTerms`.

## Rules

- English is the canonical reasoning representation.
- **Source evidence is never translated before validation.** The official source, its original title, section and citation are always shown in the original language. A translated explanation may accompany it; it never becomes the authoritative citation.
- Identifiers are preserved verbatim: URLs, source ids, section and rule numbers, patent numbers, case ids, scientific binomials, quantities. Enforced by protected patterns plus a domain glossary.
- UI strings, navigation, field labels and system messages come from `src/lib/i18n.ts`.

## Evaluation

`tests/multilingual.cases.json` (ML-01..ML-05) covers English, Hindi, Marathi and mixed input with scientific names and legal terms. The measured properties are intent preservation, retrieval overlap with the English query and identifier preservation — not translation fluency.

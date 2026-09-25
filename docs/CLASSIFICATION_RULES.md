# Classification rules

Deterministic and data-driven. Rules live in `src/lib/rules/classifier_rules.json`; the engine is `src/lib/engine/classify.server.ts`. Rules can be edited without changing application code.

Four independent dimensions, each returning value, confidence, rationale and a review flag:

1. **Product pathway** — Classical Ayurveda, Proprietary / registered Ayurvedic medicine, Ayurveda Aahara / food, Cosmetic / non-therapeutic, Novel / unclear, Other / needs review. Default: *Other / needs review*.
2. **Claim profile** — Wellness, Food / nutrition, Therapeutic / medicinal, Cosmetic, Mixed, Unknown. Default: *Unknown*.
3. **Innovation profile** — Traditional formulation, Modified formulation, Novel extraction, Novel process, Novel composition, Unknown. Default: *Unknown*.
4. **IP relevance** — Patent, Trademark, GI, Copyright, Trade secret, Multiple, Unclear. Default: *Unclear*.

Each rule is a set of term matchers over normalised product fields with a weight. The highest-scoring value wins; ties, low scores and conflicting signals set `review: true`. The rules file also carries ABS and TK trigger terms and per-market rules.

Classification is a preliminary assessment, never a legal determination. The LLM does not decide classification; it only helps normalise claim wording and explain the result.

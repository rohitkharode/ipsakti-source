# Evidence corpus and sources

The corpus is curated and small by design: 11 sources, 11 documents and 16 evidence records seeded through database migrations.

## Authority hierarchy

1. Primary official source
2. Official regulatory publication
3. Official government guidance
4. Recognised institutional source
5. Secondary reference

`authority_level` (1 = highest) participates in rank fusion and in evidence validation.

## Seeded sources

| id               | area                                                           |
| ---------------- | -------------------------------------------------------------- |
| SRC-FSSAI-AAHARA | Ayurveda Aahara framework, India                               |
| SRC-FSSAI-CLAIMS | Food claims and health claims, India                           |
| SRC-API          | Ayurvedic Pharmacopoeia monographs                             |
| SRC-DCA-ASU      | Drugs and Cosmetics Act, ASU provisions                        |
| SRC-PATENTS-ACT  | Patents Act                                                    |
| SRC-TM-ACT       | Trade Marks Act                                                |
| SRC-GI-ACT       | Geographical Indications Act                                   |
| SRC-BDA          | Biological Diversity Act / ABS                                 |
| SRC-TKDL         | Traditional Knowledge Digital Library (descriptive entry only) |
| SRC-EU-NOVEL     | EU novel food regulation                                       |
| SRC-US-DSHEA     | US dietary supplement framework                                |

## Ingestion

`src/lib/engine/ingest.server.ts`: document -> extraction -> cleaning -> section detection -> chunking -> metadata -> hash and version -> corpus. Every chunk keeps source, section, page, version and effective date, so each retrieved item is traceable. `ensureEmbeddings` backfills embeddings for chunks that lack them.

## TKDL boundary

The prototype does not scrape or reproduce TKDL content and has no authorised TKDL access. The SRC-TKDL entry describes what TKDL is and points to the authorised verification route.

# IP-SAKTI Sahayak

An AI-assisted intellectual-property support platform designed for Ayurvedic product assessment, IP screening, regulatory routing, and traditional knowledge protection.

## Core Capabilities

- **Product Intake & Language Normalisation**: Accepts multi-language product descriptors (e.g., Hindi, Marathi, English), detecting language and standardising text into canonical English while preserving scientific botanical names, quantities, and regulatory references.
- **Deterministic Product Classification**: Classifies products across form, usage, composition, and target claims using strict, rule-based deterministic classifiers.
- **BM25 + Vector Hybrid Retrieval**: Combines sparse BM25 lexical search with pgvector dense embeddings for comprehensive evidence retrieval across legal and technical corpora.
- **Evidence Provenance**: Maintains explicit source, document, section, page, version, and effective date metadata for all retrieved evidence.
- **Evidence Quality & Verification**: Evaluates evidence against verification states (`VERIFIED`, `CURATED`, `SYNTHETIC`, `UNKNOWN`) and source authority levels.
- **Market-Aware Routing**: Filters and evaluates candidates based on targeted market jurisdictions (e.g., India, EU, US, ASEAN, Global).
- **IP / TK / ABS / Regulatory Screening**: Screens products against Patents, Trademarks, Biodiversity Act / Access & Benefit Sharing (ABS), Traditional Knowledge Digital Library (TKDL), and AYUSH / Food safety regulations.
- **Grounded LLM Explanations**: Generates structured explanations grounded strictly in validated evidence.
- **Citation Guard**: Validates LLM outputs to enforce exact evidence citation matching, stripping uncited claims or hallucinated references.
- **Multilingual Support**: Translates response narratives back into the user's native language while maintaining evidence text integrity.
- **Confidence & Abstention**: Evaluates evidence sufficiency and automatically abstains or requests expert review when evidence is missing or conflicting.
- **Review Workflow**: Supports expert review packets, status tracking, and structured feedback for ambiguous cases.
- **Audit Trail**: Logs immutable audit events for every pipeline step (`case_created`, `input_normalised`, `classification_completed`, `evidence_retrieved`, `evidence_validated`, `assessment_generated`, `response_translated`, `review_requested`, `checklist_updated`).

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, TanStack Start, TanStack Router, TanStack Query
- **Build System**: Vite, Nitro
- **Backend / Datastore**: Supabase (PostgreSQL + pgvector), Server Functions, Auth
- **AI / LLM Integration**: OpenRouter provider adapter (Zero-cost model default: `openrouter/free`)
- **Testing**: Vitest

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                       Browser UI                        │
│         (React 19, TanStack Router, Tailwind CSS)       │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│            Server Functions & API Handlers              │
│                 (TanStack Start / Nitro)                │
└──────────────────────────┬──────────────────────────────┘
                           │
      ┌────────────────────┼────────────────────┐
      ▼                    ▼                    ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
│ Deterministic│   │ Hybrid RAG   │   │  OpenRouter      │
│ Classifier   │   │ (BM25 +      │   │  Adapter         │
│ & Rules      │   │  pgvector)   │   │  (Grounded LLM)  │
└──────────────┘   └──────┬───────┘   └──────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│             Supabase / PostgreSQL + pgvector            │
│      (Corpus, Cases, Analyses, Audit Trail, RLS)        │
└─────────────────────────────────────────────────────────┘
```

## Local Setup Instructions

### Prerequisites

- Node.js (v20+) or Bun
- npm or Bun package manager

### Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set the required environment variables in `.env`:

```env
# LLM Configuration
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key
LLM_MODEL=openrouter/free
LLM_TIMEOUT_MS=30000
OPENROUTER_SITE_URL=http://localhost:8080

# Supabase Credentials (Required for local operation)
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

### Installation & Execution

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run local development server:

   ```bash
   npm run dev
   ```

3. Run unit tests:

   ```bash
   npm run test
   ```

4. Build for production:

   ```bash
   npm run build
   ```

5. Run linter:
   ```bash
   npm run lint
   ```

## Environment Variables Reference

| Variable                        | Description                                      |
| ------------------------------- | ------------------------------------------------ |
| `LLM_PROVIDER`                  | LLM provider adapter name (`openrouter`)         |
| `OPENROUTER_API_KEY`            | Server-side API key for OpenRouter inference     |
| `LLM_MODEL`                     | Model identifier (defaults to `openrouter/free`) |
| `LLM_TIMEOUT_MS`                | Server-side request timeout in milliseconds      |
| `OPENROUTER_SITE_URL`           | Site URL for OpenRouter request headers          |
| `SUPABASE_URL`                  | Supabase project URL                             |
| `SUPABASE_PUBLISHABLE_KEY`      | Supabase publishable/anon key                    |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key (server-side only)     |
| `VITE_SUPABASE_URL`             | Client-accessible Supabase project URL           |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client-accessible Supabase publishable key       |

---

**Developed by Rohit Kharode**

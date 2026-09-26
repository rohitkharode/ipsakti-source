# Development Guidance for IP-SAKTI Sahayak

This document outlines standard principles and rules for maintaining and developing the IP-SAKTI Sahayak codebase.

## Key Principles

1. **Security & Key Management**:
   - Keep all secrets strictly server-side (e.g., `OPENROUTER_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
   - Do not expose service-role or API keys to client code or `VITE_` variables.
   - Never commit `.env` or sensitive environment files to version control.

2. **Preserve IP-SAKTI Core Architecture**:
   - Maintain the RAG/evidence architecture, hybrid BM25 + vector retrieval, and second-pass reranking.
   - Preserve deterministic rule-based classification; do not replace deterministic classifiers with probabilistic LLM calls.
   - Preserve evidence provenance tracking and citation validation guards.

3. **LLM Provider Adapter**:
   - Execute LLM operations via the existing server-side OpenRouter provider adapter (`src/lib/llm/provider.server.ts`).
   - Default to zero-cost models (`openrouter/free`).
   - Ensure the API key remains server-side only and is read via `config.server.ts`.

4. **Testing and Verification**:
   - Always run unit tests (`npm run test`) and typechecks/build (`npm run build`) before committing changes.
   - Write tests for new pipeline features or bug fixes.

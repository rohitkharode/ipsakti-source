# Deployment and setup

## Stack

React 19, TypeScript, TanStack Start v1 (Vite 7), Tailwind v4, shadcn/ui, Lucide. Backend: Lovable Cloud (Postgres + pgvector + auth + storage + secrets). AI: Lovable AI Gateway.

## Local development

```
bun install
bun run dev        # http://localhost:8080
bunx tsgo --noEmit # type check
```

## Environment

Set as backend secrets, never in browser code:

| variable | purpose |
|---|---|
| `LLM_PROVIDER` | LLM provider selector; currently `openrouter` |
| `OPENROUTER_API_KEY` | Server-side OpenRouter key for grounded explanation and translation |
| `LLM_MODEL` | OpenRouter model identifier; defaults centrally when omitted |
| `LLM_TIMEOUT_MS` | Optional server-side provider timeout |
| `SUPABASE_URL` | database URL (managed) |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side privileged access (managed) |
| `SUPABASE_ANON_KEY` | public read access to the corpus (managed) |
| `LOVABLE_CRON_SECRET` | protects scheduled endpoints, if Lovable preview infrastructure is used |

Client-side configuration uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` only.

## Database

Schema and corpus seeds are applied as migrations. `reindexCorpus` backfills embeddings for any chunk without one.

## Security

Input validation on every server function, parameterised queries throughout, RLS on all tables (corpus readable, case data service-role only), secrets server-side only, audit logging of every analysis step.

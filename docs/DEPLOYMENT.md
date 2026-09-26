# Deployment and Setup

## Stack

- **Frontend & Framework**: React 19, TypeScript, TanStack Start, Vite, Tailwind CSS, shadcn/ui, Lucide
- **Datastore & Auth**: Supabase (PostgreSQL with pgvector extension, authentication, storage, row-level security)
- **AI Integration**: OpenRouter server-side provider adapter

## Local Development

```bash
npm install
npm run dev        # http://localhost:8080
npm run test       # unit test execution
npm run build      # production build verification
```

## Environment Variables

Configure these variables in your runtime environment or a local `.env` file (never commit real credentials):

| Variable                        | Description                                                         |
| ------------------------------- | ------------------------------------------------------------------- |
| `LLM_PROVIDER`                  | LLM provider selector (`openrouter`)                                |
| `OPENROUTER_API_KEY`            | Server-side OpenRouter key for grounded explanation and translation |
| `LLM_MODEL`                     | OpenRouter model identifier (defaults to `openrouter/free`)         |
| `LLM_TIMEOUT_MS`                | Server-side provider timeout in milliseconds                        |
| `OPENROUTER_SITE_URL`           | Application site URL for OpenRouter headers                         |
| `SUPABASE_URL`                  | Supabase database project URL                                       |
| `SUPABASE_PUBLISHABLE_KEY`      | Supabase publishable/anon key                                       |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase server-side privileged access key                          |
| `VITE_SUPABASE_URL`             | Client-accessible Supabase project URL                              |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client-accessible Supabase publishable key                          |

Client-side configuration uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` only.

## Database Setup

Schema and corpus seeds are applied via migrations in `supabase/migrations/`. `reindexCorpus` backfills embeddings for any chunk without one.

## Security

Input validation on every server function, parameterised queries throughout, RLS on all tables (corpus readable, case data service-role only), secrets server-side only, audit logging of every analysis step.

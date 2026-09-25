
create or replace function public.bm25_evidence(query_text text, match_count int default 10)
returns table (id text, score double precision)
language sql stable
set search_path = public
as $$
  with q as (
    select websearch_to_tsquery('english', coalesce(nullif(trim(query_text), ''), 'evidence')) as tsq
  )
  select e.id, ts_rank_cd(e.search, q.tsq)::double precision as score
  from public.evidence_chunks e, q
  where e.search @@ q.tsq
  order by score desc
  limit match_count;
$$;

grant execute on function public.bm25_evidence(text, int) to service_role, authenticated, anon;
grant execute on function public.match_evidence(vector, int) to service_role, authenticated, anon;

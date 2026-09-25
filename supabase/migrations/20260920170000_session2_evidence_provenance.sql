-- Session 2: make provenance and evidence quality explicit.
alter table public.sources
  add column if not exists source_type text not null default 'curated_internal';

alter table public.documents
  add column if not exists document_status text not null default 'current';

alter table public.evidence_chunks
  add column if not exists evidence_quality text not null default 'UNKNOWN',
  add column if not exists verification_status text not null default 'unknown',
  add column if not exists source_type text not null default 'curated_internal',
  add column if not exists market_scope text[] not null default '{}';

-- The existing migration contains authored summaries linked to official landing
-- pages. They are useful curated prototype evidence, but are not independently
-- verified source passages.
update public.sources
set verification_status = 'curated',
    source_type = case
      when authority_level = 1 then 'official_government_regulatory'
      when authority_level = 2 then 'official_regulatory_publication'
      when authority_level = 3 then 'official_guidance'
      else 'curated_internal'
    end
where verification_status = 'verified';

update public.evidence_chunks e
set evidence_quality = 'CURATED',
    verification_status = 'curated_summary',
    source_type = s.source_type,
    market_scope = case when e.jurisdiction = 'Global' then array['GLOBAL'] else array[e.jurisdiction] end
from public.sources s
where s.id = e.source_id
  and e.evidence_quality = 'UNKNOWN';

create index if not exists evidence_chunks_quality_idx on public.evidence_chunks (evidence_quality);
create index if not exists evidence_chunks_source_type_idx on public.evidence_chunks (source_type);

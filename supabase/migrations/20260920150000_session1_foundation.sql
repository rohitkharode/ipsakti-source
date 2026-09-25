-- Session 1: ownership lookup support. Case ownership is enforced explicitly
-- in server functions because those functions use the service-role client.
create index if not exists cases_user_id_created_at_idx
  on public.cases (user_id, created_at desc);

create index if not exists analyses_ref_case_id_idx
  on public.analyses (analysis_ref, case_id);

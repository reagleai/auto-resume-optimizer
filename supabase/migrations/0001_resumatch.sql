-- ============================================================================
-- Resumatch schema  —  Supabase project: tnbwnfgajoxdqoollbxi
-- ============================================================================
-- This project is SHARED with another working project. This migration is
-- CREATE-ONLY: it never ALTERs, RENAMEs, or DROPs any pre-existing object.
-- Every object created here is prefixed `resumatch`.
--
-- Run in the Supabase SQL editor (or `supabase db push`). Safe to re-run.
-- ============================================================================

-- ── Profile (single-row app profile; webhook_url intentionally NOT included) ──
create table if not exists resumatch_profiles (
  id                  uuid primary key default gen_random_uuid(),
  first_name          text,
  last_name           text,
  base_resume_html    text,
  maxgrowthpct        numeric default 8,
  companynamefallback text default 'unknown-company',
  roletitlefallback   text default 'target-role',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ── Generated-resume history ─────────────────────────────────────────────────
create table if not exists resumatch_resume_history (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  company_name    text,
  role_title      text,
  filename        text,
  resume_html     text,
  format          text,                       -- 'html' | 'pdf'
  job_description text,
  keywords        text
);

-- ── PDF artifacts (1:1 with a history row) ──────────────────────────────────
-- The FK lets PostgREST embed `resumatch_resume_pdfs ( ... )` inside the
-- history query used by the frontend (useResumeHistory).
create table if not exists resumatch_resume_pdfs (
  id                uuid primary key default gen_random_uuid(),
  resume_history_id uuid references resumatch_resume_history(id) on delete cascade,
  file_name         text,
  file_path         text,
  public_url        text,
  file_size_bytes   bigint,
  created_at        timestamptz default now()
);

create index if not exists resumatch_resume_pdfs_history_idx
  on resumatch_resume_pdfs (resume_history_id);

-- ── Async generation jobs (resumable pipeline state machine) ─────────────────
create table if not exists resumatch_jobs (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status     text not null default 'queued',       -- queued|processing|complete|error
  step       int  not null default 0,              -- 0..4, drives the UI loader
  stage      text not null default 'extract_jd',   -- internal state-machine stage
  input      jsonb,                                 -- {profile + jd + keywords}
  state      jsonb not null default '{}'::jsonb,    -- intermediate stage outputs
  result     jsonb,                                 -- {filename, companyname, roletitle, pdf_url, history_id, format}
  error      text
);

create index if not exists resumatch_jobs_status_idx on resumatch_jobs (status);

-- ── Waitlist (replaces the n8n early-access → Google Sheets path) ────────────
create table if not exists resumatch_waitlist (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz default now(),
  email                text not null,
  must_have_keywords   text,
  aggressive_reframing text,
  source               text default 'resumatch-waitlist'
);

-- ── Storage bucket for generated PDFs (public read) ──────────────────────────
insert into storage.buckets (id, name, public)
values ('resumatch-pdfs', 'resumatch-pdfs', true)
on conflict (id) do nothing;

-- ============================================================================
-- Row Level Security
-- ----------------------------------------------------------------------------
-- The backend uses the SERVICE ROLE key (bypasses RLS) for all writes. The
-- browser uses the ANON key for profile + history reads/deletes. We enable RLS
-- and add permissive anon policies SCOPED ONLY to resumatch_* tables. No policy
-- here touches any other project's tables.
-- ============================================================================

alter table resumatch_profiles        enable row level security;
alter table resumatch_resume_history  enable row level security;
alter table resumatch_resume_pdfs     enable row level security;
alter table resumatch_jobs            enable row level security;
alter table resumatch_waitlist        enable row level security;

-- profiles: anon may read + upsert the single profile row
drop policy if exists resumatch_profiles_anon_all on resumatch_profiles;
create policy resumatch_profiles_anon_all on resumatch_profiles
  for all to anon using (true) with check (true);

-- history: anon may read + delete (writes happen via service role)
drop policy if exists resumatch_history_anon_read on resumatch_resume_history;
create policy resumatch_history_anon_read on resumatch_resume_history
  for select to anon using (true);
drop policy if exists resumatch_history_anon_delete on resumatch_resume_history;
create policy resumatch_history_anon_delete on resumatch_resume_history
  for delete to anon using (true);

-- pdfs: anon may read + delete the embedded artifact rows
drop policy if exists resumatch_pdfs_anon_read on resumatch_resume_pdfs;
create policy resumatch_pdfs_anon_read on resumatch_resume_pdfs
  for select to anon using (true);
drop policy if exists resumatch_pdfs_anon_delete on resumatch_resume_pdfs;
create policy resumatch_pdfs_anon_delete on resumatch_resume_pdfs
  for delete to anon using (true);

-- jobs: anon may read job status (poll). All writes are service-role only.
drop policy if exists resumatch_jobs_anon_read on resumatch_jobs;
create policy resumatch_jobs_anon_read on resumatch_jobs
  for select to anon using (true);

-- waitlist: anon may insert a signup (also allowed via the backend endpoint)
drop policy if exists resumatch_waitlist_anon_insert on resumatch_waitlist;
create policy resumatch_waitlist_anon_insert on resumatch_waitlist
  for insert to anon with check (true);

-- storage: allow public read + anon delete on the resumatch-pdfs bucket only
drop policy if exists resumatch_pdfs_public_read on storage.objects;
create policy resumatch_pdfs_public_read on storage.objects
  for select using (bucket_id = 'resumatch-pdfs');
drop policy if exists resumatch_pdfs_anon_delete_obj on storage.objects;
create policy resumatch_pdfs_anon_delete_obj on storage.objects
  for delete to anon using (bucket_id = 'resumatch-pdfs');

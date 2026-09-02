-- InvoiceCraft Audit Log Schema (Supabase/PostgreSQL)
-- Run this in the Supabase SQL Editor: Dashboard -> SQL Editor -> New query -> paste -> Run

create table if not exists public.audit_log (
    id uuid primary key default uuid_generate_v4(),
    org_id uuid references public.organizations(id) on delete cascade not null,
    actor text not null default 'system',
    action text not null,
    entity_type text,
    entity_id text,
    details jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

create index if not exists idx_audit_org on public.audit_log(org_id);
create index if not exists idx_audit_created on public.audit_log(created_at desc);

alter table public.audit_log enable row level security;

create policy "Users can view audit log"
    on public.audit_log for select
    using (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

create policy "Service role inserts audit log"
    on public.audit_log for insert
    with check (true);
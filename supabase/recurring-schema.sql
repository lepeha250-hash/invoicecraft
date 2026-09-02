-- InvoiceCraft Recurring Billing Schema (Supabase/PostgreSQL)
-- Run this in the Supabase SQL Editor

-- ==== RECURRING DOCUMENTS (Subscriptions / Auto-invoices) ====
create table if not exists public.recurring_documents (
    id uuid primary key default uuid_generate_v4(),
    org_id uuid references public.organizations(id) on delete cascade not null,
    template_id uuid references public.templates(id) on delete set null,
    title text not null,
    cadence text not null,
    next_run_at timestamptz not null,
    last_run_at timestamptz,
    active boolean default true,
    total numeric(12,2) default 0,
    currency text default 'USD',
    client_name text,
    client_email text,
    config jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    constraint recurring_cadence_check check (cadence in ('weekly', 'monthly', 'quarterly', 'yearly'))
);

create index if not exists idx_recurring_org on public.recurring_documents(org_id);
create index if not exists idx_recurring_next on public.recurring_documents(next_run_at);

alter table public.recurring_documents enable row level security;

create policy "Users can view recurring docs"
    on public.recurring_documents for select
    using (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

create policy "Users can insert recurring docs"
    on public.recurring_documents for insert
    with check (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

create policy "Users can update recurring docs"
    on public.recurring_documents for update
    using (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

create policy "Users can delete recurring docs"
    on public.recurring_documents for delete
    using (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

-- ==== DOCUMENT SHARES (already referenced by portal-schema, ensure exists) ====
create table if not exists public.document_shares (
    id uuid primary key default uuid_generate_v4(),
    document_id uuid references public.documents(id) on delete cascade not null,
    share_token text unique not null,
    created_by uuid references public.profiles(id) on delete cascade not null,
    created_at timestamptz default now(),
    expires_at timestamptz,
    signature_data jsonb
);

create index if not exists idx_shares_token on public.document_shares(share_token);
alter table public.document_shares enable row level security;

-- ==== TEAMS (already referenced by team-schema, ensure exists) ====
create table if not exists public.teams (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text unique not null,
    owner_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.team_members (
    id uuid primary key default uuid_generate_v4(),
    team_id uuid references public.teams(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    role text default 'member',
    joined_at timestamptz default now(),
    constraint team_members_role_check check (role in ('owner', 'admin', 'member', 'viewer')),
    unique (team_id, user_id)
);

create table if not exists public.team_invites (
    id uuid primary key default uuid_generate_v4(),
    team_id uuid references public.teams(id) on delete cascade not null,
    email text not null,
    role text default 'member',
    invited_by uuid,
    token text unique not null,
    invited_at timestamptz default now(),
    expires_at timestamptz not null,
    accepted_at timestamptz,
    constraint team_invites_role_check check (role in ('admin', 'member', 'viewer'))
);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invites enable row level security;

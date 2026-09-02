-- InvoiceCraft API Keys + Webhooks Schema (Supabase/PostgreSQL)
-- Run this in the Supabase SQL Editor: Dashboard -> SQL Editor -> New query -> paste -> Run

-- ==== API KEYS (public REST API access) ====
create table if not exists public.api_keys (
    id uuid primary key default uuid_generate_v4(),
    org_id uuid references public.organizations(id) on delete cascade not null,
    name text not null,
    api_key text not null, -- full key (demo: stored plain, shown once on creation)
    key_prefix text not null, -- first 8 chars for display
    created_at timestamptz default now(),
    last_used_at timestamptz,
    revoked boolean not null default false
);

create index if not exists idx_api_keys_org on public.api_keys(org_id);

-- ==== WEBHOOKS (outgoing event notifications) ====
create table if not exists public.webhooks (
    id uuid primary key default uuid_generate_v4(),
    org_id uuid references public.organizations(id) on delete cascade not null,
    url text not null,
    events text[] not null default '{}'::text[], -- ['document.created','document.sent', ...]
    secret text,
    active boolean not null default true,
    created_at timestamptz default now()
);

create index if not exists idx_webhooks_org on public.webhooks(org_id);

-- ==== WEBHOOK DELIVERIES (delivery log) ====
create table if not exists public.webhook_deliveries (
    id uuid primary key default uuid_generate_v4(),
    webhook_id uuid references public.webhooks(id) on delete cascade not null,
    event text not null,
    payload jsonb not null default '{}'::jsonb,
    status text not null, -- 'delivered' | 'failed'
    response_status int,
    created_at timestamptz default now()
);

create index if not exists idx_wh_deliveries on public.webhook_deliveries(webhook_id);

alter table public.api_keys enable row level security;
alter table public.webhooks enable row level security;
alter table public.webhook_deliveries enable row level security;

create policy "Users can view api keys"
    on public.api_keys for select
    using (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

create policy "Users can insert api keys"
    on public.api_keys for insert
    with check (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

create policy "Users can update api keys"
    on public.api_keys for update
    using (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

create policy "Users can delete api keys"
    on public.api_keys for delete
    using (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

create policy "Users can view webhooks"
    on public.webhooks for select
    using (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

create policy "Users can insert webhooks"
    on public.webhooks for insert
    with check (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

create policy "Users can update webhooks"
    on public.webhooks for update
    using (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

create policy "Users can delete webhooks"
    on public.webhooks for delete
    using (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

create policy "Users can view webhook deliveries"
    on public.webhook_deliveries for select
    using (webhook_id in (
        select w.id from public.webhooks w
        where w.org_id in (
            select id from public.organizations where user_id = auth.uid()
        )
    ));

-- Service role (and our server-side routes) manage deliveries
create policy "Service role manages deliveries"
    on public.webhook_deliveries for all
    using (true);
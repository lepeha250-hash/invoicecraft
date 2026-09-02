-- Document shares / client portal
create table if not exists public.document_shares (
    id uuid primary key default uuid_generate_v4(),
    document_id uuid references public.documents(id) on delete cascade not null,
    token text unique not null,
    email text not null,
    expires_at timestamptz not null,
    status text default 'pending',
    viewed_at timestamptz,
    signed_at timestamptz,
    signature_data jsonb,
    paid_at timestamptz,
    stripe_session_id text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_document_shares_token on public.document_shares(token);
create index if not exists idx_document_shares_document on public.document_shares(document_id);

alter table public.document_shares enable row level security;

create policy "Anyone can view valid share by token"
    on public.document_shares for select
    using (expires_at > now() and status in ('pending', 'viewed', 'signed'));

create policy "Service role can manage shares"
    on public.document_shares for all
    using (auth.role() = 'service_role');

-- Trigger for updated_at
create trigger set_shares_updated_at
    before update on public.document_shares
    for each row execute procedure public.handle_updated_at();
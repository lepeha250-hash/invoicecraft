-- Fix document_shares table - add missing columns (run this in Supabase SQL Editor)
-- The table was created by recurring-schema.sql with different columns

alter table public.document_shares
add column if not exists email text,
add column if not exists status text default 'pending',
add column if not exists viewed_at timestamptz,
add column if not exists signed_at timestamptz,
add column if not exists paid_at timestamptz,
add column if not exists stripe_session_id text,
add column if not exists updated_at timestamptz default now();

-- Rename share_token to token if it exists as share_token
-- (This requires a more complex migration, but we can add token column and copy data)
alter table public.document_shares
add column if not exists token text;

-- Update token from share_token if token is null and share_token exists
update public.document_shares
set token = share_token
where token is null and share_token is not null;

-- Make token unique and not null after data migration
-- alter table public.document_shares alter column token set not null; -- run after data is migrated
-- create unique index if not exists idx_document_shares_token on public.document_shares(token);

-- Update RLS policy to use token
drop policy if exists "Anyone can view valid share by token" on public.document_shares;
create policy "Anyone can view valid share by token"
    on public.document_shares for select
    using (expires_at > now() and status in ('pending', 'viewed', 'signed'));

drop policy if exists "Service role can manage shares" on public.document_shares;
create policy "Service role can manage shares"
    on public.document_shares for all
    using (auth.role() = 'service_role');

-- Trigger for updated_at
drop trigger if exists set_shares_updated_at on public.document_shares;
create trigger set_shares_updated_at
    before update on public.document_shares
    for each row execute procedure public.handle_updated_at();
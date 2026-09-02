-- Fix document_shares + create handle_updated_at() function
-- Run this entire script in Supabase SQL Editor

-- 1. Create the trigger function if it doesn't exist
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- 2. Fix document_shares table - add missing columns
alter table public.document_shares
add column if not exists email text,
add column if not exists status text default 'pending',
add column if not exists viewed_at timestamptz,
add column if not exists signed_at timestamptz,
add column if not exists paid_at timestamptz,
add column if not exists stripe_session_id text,
add column if not exists updated_at timestamptz default now();

-- 3. Add token column and migrate from share_token
alter table public.document_shares
add column if not exists token text;

update public.document_shares
set token = share_token
where token is null and share_token is not null;

-- 4. Update RLS policies
drop policy if exists "Anyone can view valid share by token" on public.document_shares;
create policy "Anyone can view valid share by token"
    on public.document_shares for select
    using (expires_at > now() and status in ('pending', 'viewed', 'signed'));

drop policy if exists "Service role can manage shares" on public.document_shares;
create policy "Service role can manage shares"
    on public.document_shares for all
    using (auth.role() = 'service_role');

-- 5. Trigger for updated_at
drop trigger if exists set_shares_updated_at on public.document_shares;
create trigger set_shares_updated_at
    before update on public.document_shares
    for each row execute procedure public.handle_updated_at();
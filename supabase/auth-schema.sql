-- InvoiceCraft: enable OAuth (Google) + auto-create organization per user

-- 1) Make sure the auth schema RLS helper exists (idempotent)
create extension if not exists "uuid-ossp";

-- 2) Auto-create an organization when a user's profile is created.
--    This extends the existing handle_new_profile trigger so every new
--    signup (email or Google) gets a fresh organization.
create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    -- free subscription
    insert into public.subscriptions (user_id, plan, status)
    values (new.id, 'free', 'active')
    on conflict do nothing;

    -- default organization
    insert into public.organizations (user_id, name, settings)
    values (
        new.id,
        coalesce(nullif(new.name, ''), 'My Company'),
        '{}'::jsonb
    )
    on conflict do nothing;

    return new;
end;
$$;

-- 3) Ensure the trigger actually runs handle_new_profile
drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
    after insert on public.profiles
    for each row execute procedure public.handle_new_profile();

-- 4) For users created BEFORE this change (or restored), backfill an org
insert into public.organizations (user_id, name, settings)
select
    p.id,
    coalesce(nullif(p.name, ''), 'My Company'),
    '{}'::jsonb
from public.profiles p
where not exists (
    select 1 from public.organizations o where o.user_id = p.id
);

-- InvoiceCraft Database Schema (Supabase/PostgreSQL)

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==== PROFILES ====
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text unique not null,
    name text,
    avatar_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ==== ORGANIZATIONS ====
create table if not exists public.organizations (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    name text not null,
    logo_url text,
    settings jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ==== SUBSCRIPTIONS ====
create table if not exists public.subscriptions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    stripe_customer_id text,
    stripe_subscription_id text,
    plan text default 'free',
    status text default 'active',
    current_period_end timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    constraint subscriptions_plan_check check (plan in ('free', 'pro', 'business'))
);

-- ==== DOCUMENTS ====
create table if not exists public.documents (
    id uuid primary key default uuid_generate_v4(),
    org_id uuid references public.organizations(id) on delete cascade not null,
    type text not null,
    title text not null,
    content jsonb default '{}'::jsonb,
    status text default 'draft',
    total numeric(12,2) default 0,
    currency text default 'USD',
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    constraint documents_type_check check (type in ('proposal', 'invoice', 'act')),
    constraint documents_status_check check (status in ('draft', 'sent', 'paid', 'archived'))
);

-- ==== TEMPLATES ====
create table if not exists public.templates (
    id uuid primary key default uuid_generate_v4(),
    org_id uuid references public.organizations(id) on delete cascade,
    name text not null,
    category text not null,
    preview_url text,
    content jsonb default '{}'::jsonb,
    is_system boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    constraint templates_category_check check (category in ('proposal', 'invoice', 'act'))
);

-- ==== INDEXES ====
create index if not exists idx_documents_org on public.documents(org_id);
create index if not exists idx_documents_created on public.documents(created_at desc);
create index if not exists idx_org_user on public.organizations(user_id);
create index if not exists idx_sub_user on public.subscriptions(user_id);

-- ==== ROW LEVEL SECURITY ====
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.documents enable row level security;
alter table public.templates enable row level security;
alter table public.subscriptions enable row level security;

-- Profiles: users can only see/edit their own
create policy "Users can view own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- Organizations: users manage their own org
create policy "Users can view own org"
    on public.organizations for select
    using (auth.uid() = user_id);

create policy "Users can insert own org"
    on public.organizations for insert
    with check (auth.uid() = user_id);

create policy "Users can update own org"
    on public.organizations for update
    using (auth.uid() = user_id);

-- Documents: RLS via org membership
create policy "Users can view org documents"
    on public.documents for select
    using (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

create policy "Users can insert org documents"
    on public.documents for insert
    with check (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

create policy "Users can update org documents"
    on public.documents for update
    using (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

create policy "Users can delete org documents"
    on public.documents for delete
    using (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

-- Templates: system templates + own templates
create policy "Users can view templates"
    on public.templates for select
    using (
        is_system = true or
        org_id in (select id from public.organizations where user_id = auth.uid())
    );

-- Subscriptions: users manage own subscription
create policy "Users can view own subscription"
    on public.subscriptions for select
    using (auth.uid() = user_id);

-- ==== TRIGGERS ====

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, email, name)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''));
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Auto-create subscription on profile creation
create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.subscriptions (user_id, plan, status)
    values (new.id, 'free', 'active');
    return new;
end;
$$;

create trigger on_profile_created
    after insert on public.profiles
    for each row execute procedure public.handle_new_profile();

-- Update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger set_updated_at
    before update on public.profiles
    for each row execute procedure public.handle_updated_at();

create trigger set_org_updated_at
    before update on public.organizations
    for each row execute procedure public.handle_updated_at();

create trigger set_doc_updated_at
    before update on public.documents
    for each row execute procedure public.handle_updated_at();

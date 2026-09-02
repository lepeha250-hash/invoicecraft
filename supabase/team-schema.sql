-- Team Workspaces
create type public.team_role as enum ('owner', 'admin', 'member', 'viewer');

create table if not exists public.teams (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text unique not null,
    owner_id uuid references public.profiles(id) on delete cascade not null,
    settings jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.team_members (
    id uuid primary key default uuid_generate_v4(),
    team_id uuid references public.teams(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    role public.team_role default 'member',
    invited_by uuid references public.profiles(id) on delete set null,
    invited_at timestamptz default now(),
    accepted_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique (team_id, user_id)
);

create table if not exists public.team_invites (
    id uuid primary key default uuid_generate_v4(),
    team_id uuid references public.teams(id) on delete cascade not null,
    email text not null,
    role public.team_role default 'member',
    invited_by uuid references public.profiles(id) on delete cascade not null,
    token text unique not null,
    expires_at timestamptz not null,
    accepted_at timestamptz,
    created_at timestamptz default now()
);

create index if not exists idx_team_members_team on public.team_members(team_id);
create index if not exists idx_team_members_user on public.team_members(user_id);
create index if not exists idx_team_invites_token on public.team_invites(token);
create index if not exists idx_team_invites_email on public.team_invites(email);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invites enable row level security;

-- Teams: owner can manage, members can view
create policy "Team owner can manage"
    on public.teams for all
    using (owner_id = auth.uid());

create policy "Team members can view"
    on public.teams for select
    using (id in (select team_id from public.team_members where user_id = auth.uid()));

-- Team members: owner/admin can manage, members can view
create policy "Owner/Admin can manage members"
    on public.team_members for all
    using (team_id in (
        select id from public.teams where owner_id = auth.uid()
    ) or team_id in (
        select team_id from public.team_members
        where user_id = auth.uid() and role in ('owner', 'admin')
    ));

create policy "Members can view team members"
    on public.team_members for select
    using (team_id in (select team_id from public.team_members where user_id = auth.uid()));

-- Invites: owner/admin can manage
create policy "Owner/Admin can manage invites"
    on public.team_invites for all
    using (team_id in (
        select id from public.teams where owner_id = auth.uid()
    ) or team_id in (
        select team_id from public.team_members
        where user_id = auth.uid() and role in ('owner', 'admin')
    ));

create policy "Anyone can view valid invite by token"
    on public.team_invites for select
    using (expires_at > now() and accepted_at is null);

-- Triggers
create trigger set_teams_updated_at
    before update on public.teams
    for each row execute procedure public.handle_updated_at();

create trigger set_team_members_updated_at
    before update on public.team_members
    for each row execute procedure public.handle_updated_at();
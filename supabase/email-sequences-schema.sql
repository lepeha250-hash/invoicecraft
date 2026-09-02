-- InvoiceCraft Email Sequences Schema (Supabase/PostgreSQL)
-- Run this in the Supabase SQL Editor: Dashboard -> SQL Editor -> New query -> paste -> Run

-- ==== EMAIL SEQUENCES (automated follow-up reminders) ====
create table if not exists public.email_sequences (
    id uuid primary key default uuid_generate_v4(),
    org_id uuid references public.organizations(id) on delete cascade not null,
    name text not null,
    trigger_type text not null default 'document_sent',
    document_type text, -- 'proposal' | 'invoice' | 'act' | null (all)
    steps jsonb not null default '[]'::jsonb, -- [{delay_days, subject, body}]
    active boolean not null default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    constraint seq_trigger_check check (trigger_type in ('document_sent', 'invoice_unpaid'))
);

create index if not exists idx_seq_org on public.email_sequences(org_id);

-- ==== EMAIL SEQUENCE LOGS (per-document follow-up tracking) ====
create table if not exists public.email_sequence_logs (
    id uuid primary key default uuid_generate_v4(),
    sequence_id uuid references public.email_sequences(id) on delete cascade not null,
    document_id uuid references public.documents(id) on delete cascade not null,
    step_index int not null default 0,
    status text not null default 'scheduled', -- 'scheduled' | 'sent' | 'skipped'
    scheduled_at timestamptz,
    sent_at timestamptz,
    to_email text,
    subject text,
    created_at timestamptz default now(),
    unique (sequence_id, document_id, step_index)
);

create index if not exists idx_seqlog_seq on public.email_sequence_logs(sequence_id);
create index if not exists idx_seqlog_doc on public.email_sequence_logs(document_id);

alter table public.email_sequences enable row level security;
alter table public.email_sequence_logs enable row level security;

create policy "Users can view sequences"
    on public.email_sequences for select
    using (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

create policy "Users can insert sequences"
    on public.email_sequences for insert
    with check (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

create policy "Users can update sequences"
    on public.email_sequences for update
    using (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

create policy "Users can delete sequences"
    on public.email_sequences for delete
    using (org_id in (
        select id from public.organizations where user_id = auth.uid()
    ));

-- Logs visible via the owning sequence's org
create policy "Users can view sequence logs"
    on public.email_sequence_logs for select
    using (sequence_id in (
        select s.id from public.email_sequences s
        where s.org_id in (
            select id from public.organizations where user_id = auth.uid()
        )
    ));

create policy "Service role manages logs"
    on public.email_sequence_logs for all
    using (true);
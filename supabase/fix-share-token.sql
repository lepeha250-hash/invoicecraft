-- Fix share_token NOT NULL constraint
alter table public.document_shares alter column share_token drop not null;
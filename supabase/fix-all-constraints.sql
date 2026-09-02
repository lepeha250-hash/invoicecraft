-- Fix all NOT NULL constraints for document_shares
alter table public.document_shares alter column share_token drop not null;
alter table public.document_shares alter column created_by drop not null;

-- Make created_by nullable with default for future inserts
alter table public.document_shares alter column created_by drop default;
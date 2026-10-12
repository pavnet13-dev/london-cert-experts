
-- London Cert Experts client portal
-- Run this script in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.client_properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_name text not null check (char_length(property_name) between 1 and 100),
  property_address text not null check (char_length(property_address) between 1 and 1000),
  postcode text not null check (char_length(postcode) between 1 and 20),
  service_type text not null check (char_length(service_type) between 1 and 100),
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.client_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.client_properties(id) on delete cascade,
  document_type text not null check (char_length(document_type) between 1 and 100),
  file_name text not null check (char_length(file_name) between 1 and 255),
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png')),
  file_size bigint not null check (file_size > 0 and file_size <= 10485760),
  created_at timestamptz not null default now()
);

create index if not exists client_properties_user_id_idx
  on public.client_properties(user_id);

create index if not exists client_documents_user_id_idx
  on public.client_documents(user_id);

create index if not exists client_documents_property_id_idx
  on public.client_documents(property_id);

alter table public.client_properties enable row level security;
alter table public.client_documents enable row level security;

-- Customers can only access their own property records.
drop policy if exists "Customers read own properties" on public.client_properties;
create policy "Customers read own properties"
on public.client_properties for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Customers add own properties" on public.client_properties;
create policy "Customers add own properties"
on public.client_properties for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Customers update own properties" on public.client_properties;
create policy "Customers update own properties"
on public.client_properties for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Customers delete own properties" on public.client_properties;
create policy "Customers delete own properties"
on public.client_properties for delete
to authenticated
using (user_id = (select auth.uid()));

-- Customers can only access their own document metadata.
drop policy if exists "Customers read own documents" on public.client_documents;
create policy "Customers read own documents"
on public.client_documents for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Customers add own documents" on public.client_documents;
create policy "Customers add own documents"
on public.client_documents for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.client_properties p
    where p.id = property_id and p.user_id = (select auth.uid())
  )
  and storage_path like (select auth.uid())::text || '/%'
);

drop policy if exists "Customers delete own documents" on public.client_documents;
create policy "Customers delete own documents"
on public.client_documents for delete
to authenticated
using (user_id = (select auth.uid()));

-- Create a private bucket. Objects are not publicly readable.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-documents',
  'client-documents',
  false,
  10485760,
  array['application/pdf','image/jpeg','image/png']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf','image/jpeg','image/png'];

-- A signed-in customer may upload only into their own UUID folder.
drop policy if exists "Customers upload own documents" on storage.objects;
create policy "Customers upload own documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'client-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Customers read own stored documents" on storage.objects;
create policy "Customers read own stored documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'client-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Customers delete own stored documents" on storage.objects;
create policy "Customers delete own stored documents"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'client-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

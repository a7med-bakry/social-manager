create extension if not exists pgcrypto;

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('instagram','tiktok')),
  platform_user_id text not null,
  username text,
  display_name text,
  avatar_url text,
  profile_url text,
  access_token text,
  token_expires_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending','connected','error','disconnected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, platform_user_id)
);

create index if not exists idx_social_accounts_user_id
  on public.social_accounts(user_id);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  social_account_id uuid references public.social_accounts(id) on delete set null,
  action text not null,
  status text not null default 'pending',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.social_accounts enable row level security;
alter table public.activity_logs enable row level security;

create policy "Users can manage their own social accounts"
on public.social_accounts for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can read their activity logs"
on public.activity_logs for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their activity logs"
on public.activity_logs for insert to authenticated
with check ((select auth.uid()) = user_id);

-- OAuth secrets are kept in a non-exposed schema and are accessed only by server code.
create schema if not exists private;

create table if not exists private.tiktok_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  social_account_id uuid not null unique references public.social_accounts(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scopes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tiktok_connections_user_id
  on private.tiktok_connections(user_id);

alter table private.tiktok_connections enable row level security;
revoke all on schema private from anon, authenticated;
revoke all on private.tiktok_connections from anon, authenticated;

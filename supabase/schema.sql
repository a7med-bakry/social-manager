create extension if not exists pgcrypto;

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('instagram','tiktok')),
  platform_account_id text not null,
  username text,
  display_name text,
  avatar_url text,
  status text not null default 'connected',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform, platform_account_id)
);

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

create policy "Users can read their social accounts"
on public.social_accounts for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their social accounts"
on public.social_accounts for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their social accounts"
on public.social_accounts for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their social accounts"
on public.social_accounts for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their activity logs"
on public.activity_logs for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their activity logs"
on public.activity_logs for insert to authenticated
with check ((select auth.uid()) = user_id);

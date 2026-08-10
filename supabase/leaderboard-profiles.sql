-- フレンズ機能の公開プロフィール（Supabase SQL Editor で実行）
create extension if not exists pgcrypto;

create table if not exists public.leaderboard_profiles (
  line_user_id text primary key
    check (length(btrim(line_user_id)) between 1 and 255),
  public_id uuid not null default gen_random_uuid() unique,
  display_name text not null
    check (length(btrim(display_name)) between 1 and 40),
  purpose text not null
    check (length(btrim(purpose)) between 1 and 200),
  weekly_target integer not null
    check (weekly_target between 1 and 1000),
  qualifications jsonb not null default '[]'::jsonb,
  overseas_history jsonb not null default '[]'::jsonb,
  avatar_path text,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_leaderboard_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leaderboard_profiles_set_updated_at
  on public.leaderboard_profiles;
create trigger leaderboard_profiles_set_updated_at
before update on public.leaderboard_profiles
for each row execute function public.set_leaderboard_profile_updated_at();

alter table public.leaderboard_profiles enable row level security;
alter table public.leaderboard_profiles force row level security;

revoke all on table public.leaderboard_profiles from public, anon, authenticated;
grant select, insert, update, delete
  on table public.leaderboard_profiles to service_role;

revoke all on function public.set_leaderboard_profile_updated_at()
  from public, anon, authenticated;

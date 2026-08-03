-- 週末リマインドのオプトイン設定
-- Supabase ダッシュボード → SQL Editor で実行してください

create table if not exists public.reminder_preferences (
  line_user_id text primary key,
  reminder_enabled boolean not null default false,
  opted_in_at timestamptz,
  opted_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reminder_preferences_enabled_idx
  on public.reminder_preferences (reminder_enabled)
  where reminder_enabled = true;

alter table public.reminder_preferences enable row level security;

drop policy if exists "Allow public read reminder preferences"
  on public.reminder_preferences;

create policy "Allow public read reminder preferences"
  on public.reminder_preferences
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow public insert reminder preferences"
  on public.reminder_preferences;

create policy "Allow public insert reminder preferences"
  on public.reminder_preferences
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Allow public update reminder preferences"
  on public.reminder_preferences;

create policy "Allow public update reminder preferences"
  on public.reminder_preferences
  for update
  to anon, authenticated
  using (true)
  with check (true);

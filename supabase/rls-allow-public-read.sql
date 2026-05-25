-- アプリ（anon キー）から english_vocab を読めるようにする
-- Supabase ダッシュボード → SQL Editor でこのファイルの内容を実行してください

alter table public.english_vocab enable row level security;

drop policy if exists "Allow public read access" on public.english_vocab;

create policy "Allow public read access"
  on public.english_vocab
  for select
  to anon, authenticated
  using (true);

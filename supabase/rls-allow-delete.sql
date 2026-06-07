-- アプリ（anon キー）から自分の単語を削除できるようにする
-- API が id + line_user_id の両方で絞り込んでから削除します
-- Supabase SQL Editor で実行してください

alter table public.english_vocab enable row level security;

drop policy if exists "Allow public delete access" on public.english_vocab;

create policy "Allow public delete access"
  on public.english_vocab
  for delete
  to anon, authenticated
  using (true);

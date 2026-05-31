-- マルチユーザー対応: english_vocab に LINE ユーザー ID 列を追加
-- Supabase SQL Editor で実行してください

alter table public.english_vocab
  add column if not exists line_user_id text;

create index if not exists english_vocab_line_user_id_idx
  on public.english_vocab (line_user_id);

-- Supabase SQL Editor で実行してください
-- english_vocab に類語カラムを追加

alter table public.english_vocab
  add column if not exists synonyms text;

comment on column public.english_vocab.synonyms is
  '類語（カンマ区切りの英単語・熟語。例: ignore, let be）';

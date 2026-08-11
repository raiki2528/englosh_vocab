-- Supabase SQL Editor で実行してください
-- english_vocab に種類カラムを追加（word / phrase / sentence）

alter table public.english_vocab
  add column if not exists entry_type text not null default 'word';

alter table public.english_vocab
  drop constraint if exists english_vocab_entry_type_check;

alter table public.english_vocab
  add constraint english_vocab_entry_type_check
  check (entry_type in ('word', 'phrase', 'sentence'));

comment on column public.english_vocab.entry_type is
  'word=単語, phrase=フレーズ, sentence=例文・文章';

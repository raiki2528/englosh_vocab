-- Supabase SQL Editor で実行してください（ダッシュボードからの投入用）
-- テーブル: public.english_vocab
-- カラム: id, word, meaning, example_1, example_2, created_at

insert into public.english_vocab (word, meaning, example_1, example_2)
values (
  'leave sth/sb alone',
  '〜を放っておく',
  '{"en":"Don''t bother talking to Jimmy now. He''s having a fit, so just **leave** him **alone**.","ja":"今ジミーに話しかけないで。カッとしてるから、**放っておいて**。","note":"leave A alone は「Aを放っておく、干渉しない」という意味の句動詞です。"}',
  '{"en":"It''s better to **leave it alone** now and not mess with any of the plans.","ja":"今は**そのままにして**、計画をいじらないほうがいいよ。"}'
);

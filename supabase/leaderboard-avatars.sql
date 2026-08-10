-- 非公開アバターバケット（leaderboard-profiles.sql の後に実行）
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'leaderboard-avatars',
  'leaderboard-avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Service role manages leaderboard avatars"
  on storage.objects;
create policy "Service role manages leaderboard avatars"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'leaderboard-avatars')
  with check (bucket_id = 'leaderboard-avatars');

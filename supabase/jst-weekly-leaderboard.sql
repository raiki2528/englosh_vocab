-- JST（月曜 00:00〜翌月曜 00:00）の週間ランキング
-- leaderboard-profiles.sql の後に実行してください
create or replace function public.get_jst_weekly_leaderboard(
  reference_time timestamptz default now()
)
returns table (
  public_id uuid,
  display_name text,
  avatar_path text,
  weekly_target integer,
  weekly_word_count bigint,
  rank bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with boundaries as (
    select
      date_trunc('week', reference_time at time zone 'Asia/Tokyo')
        at time zone 'Asia/Tokyo' as week_start,
      (date_trunc('week', reference_time at time zone 'Asia/Tokyo')
        + interval '7 days') at time zone 'Asia/Tokyo' as week_end
  ),
  counts as (
    select
      vocab.line_user_id,
      count(distinct lower(btrim(vocab.word)))::bigint as weekly_word_count
    from public.english_vocab as vocab
    cross join boundaries
    where vocab.created_at >= boundaries.week_start
      and vocab.created_at < boundaries.week_end
      and nullif(btrim(vocab.word), '') is not null
    group by vocab.line_user_id
  ),
  ranked as (
    select
      profile.public_id,
      profile.display_name,
      profile.avatar_path,
      profile.weekly_target,
      coalesce(counts.weekly_word_count, 0)::bigint as weekly_word_count,
      rank() over (
        order by coalesce(counts.weekly_word_count, 0) desc
      )::bigint as rank
    from public.leaderboard_profiles as profile
    left join counts on counts.line_user_id = profile.line_user_id
  )
  select
    ranked.public_id,
    ranked.display_name,
    ranked.avatar_path,
    ranked.weekly_target,
    ranked.weekly_word_count,
    ranked.rank
  from ranked
  order by ranked.rank, lower(ranked.display_name), ranked.public_id;
$$;

revoke all on function public.get_jst_weekly_leaderboard(timestamptz)
  from public, anon, authenticated;
grant execute on function public.get_jst_weekly_leaderboard(timestamptz)
  to service_role;

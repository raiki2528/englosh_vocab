# 友達・ランキング機能のセットアップ

## 1. Supabase SQL

Supabase の SQL Editor で、次の順に実行します。

1. `supabase/leaderboard-profiles.sql`
2. `supabase/leaderboard-avatars.sql`
3. `supabase/jst-weekly-leaderboard.sql`

これにより、公開プロフィール、最大 5MB の非公開プロフィール画像、
日本時間の月曜始まり週間ランキングが作成されます。

## 2. Vercel 環境変数

Vercel の Production / Preview / Development に、次を追加します。

```text
SUPABASE_SERVICE_ROLE_KEY=Supabase の service_role key
```

`NEXT_PUBLIC_` は付けないでください。このキーはサーバー内だけで使います。
既存の次の環境変数も必要です。

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
LINE_CHANNEL_ACCESS_TOKEN
CRON_SECRET
NEXT_PUBLIC_APP_URL
```

## 3. デプロイ後の確認

1. LINE の専用 URL から単語帳を開く
2. 「友達」タブでプロフィールを作成する
3. 写真、資格、海外歴、週目標を保存できることを確認する
4. 今週追加した単語数とランキングが表示されることを確認する
5. 単語カードのスピーカーボタンを iPhone で確認する

週間ランキング通知は、毎週月曜 09:00（日本時間）に前週分を送信します。

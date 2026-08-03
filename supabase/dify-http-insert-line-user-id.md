# Dify HTTP ノードで `line_user_id` を Supabase に保存する

Webhook（Vercel）は Dify に `inputs.line_user_id` を渡しています。  
Supabase で `line_user_id` が NULL のままになるのは、**Dify の HTTP リクエストの JSON にその列が含まれていない**ためです。

## 手順

1. Dify → **English Vocab** → ワークフロー → **HTTP リクエスト** ノードを開く
2. **Body**（JSON）に、他の列と一緒に次を追加する:

```json
"line_user_id": "{{#開始.line_user_id#}}"
```

※ Dify のバージョンによって変数の書き方が異なる場合があります。  
   開始ノードの変数名が `line_user_id` なら、変数パネルから **挿入** して Body に載せてください。

3. 例（イメージ）:

```json
{
  "word": "...",
  "meaning": "...",
  "synonyms": "...",
  "example_1": "...",
  "example_2": "...",
  "line_user_id": "{{#開始.line_user_id#}}"
}
```

4. 保存 → ワークフローを公開し直す
5. LINE で単語を 1 通送り、Supabase の `line_user_id` に `U` で始まる ID が入るか確認

## 確認

- 単語帳 URL の `?uid=Uxxxx` と同じ値が入れば OK
- まだ NULL → Body のキー名が `line_user_id`（アンダースコア）か、開始ノードの必須変数名と一致しているか確認

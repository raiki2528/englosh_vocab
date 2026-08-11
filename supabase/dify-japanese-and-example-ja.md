# Dify：日本語入力・例文・文章モード対応

アプリ側は `example_1` / `example_2` の JSON 内 `ja` を表示し、`entry_type` で **単語 / フレーズ / 例文** を区別します。  
LINE で日本語を送った場合も同じ形式で保存・返信するよう、Dify ワークフローを次のように設定してください。

## 0. Supabase 準備

`supabase/add-entry-type.sql` を SQL Editor で実行してください（`entry_type` カラム追加）。

## 1. 開始ノード

既存の `line_user_id`（必須）のままで OK です。単語かフレーズか文章かは **LLM がユーザーのメッセージ（query）から自動判断** します（`文:` プレフィックスは使いません）。

## 2. LLM ノードのプロンプト

```
あなたは実践的なビジネス英語を教えるプロの英語コーチです。
ユーザーから「覚えたい英単語・熟語・スラング・英文」または「これって英語で何て言うの？という日本語の質問やフレーズ・文章」が送信されます。
ユーザーの入力内容を解析し、以下の指定フォーマット（JSON形式）で出力してください。

【entry_type の自動判定】
- "word": 英単語1語（例: deadline, leverage）
- "phrase": 短い熟語・コロケーション（例: look forward to, follow up）
- "sentence": 完全な英文、または日本語で「〜って英語で？」と聞かれた1文

【入力パターン別の対応ルール】
1. 英語が入力された場合:
  - word: その英語（sentence の場合は英文そのまま）
  - meaning: 日本語での自然な意味（sentence の場合は日本語訳）
2. 日本語が入力された場合（例：「会社って英語で何？」「明日また連絡しますって英語で？」）:
  - word: 最も適した英語（sentence の場合は英文1文）
  - meaning: ユーザーが入力した日本語の意味やニュアンス

【word モード（entry_type = "word"）】
1. synonyms: 類語（英語のみ、1〜2個）。シンプルな単語や短い熟語。word 自体は含めない。カンマ区切り。
2. example_1, example_2: ビジネスで使える実践例文（en + ja）
3. memo: 語源、ニュアンス、ビジネスでの使い方（日本語）

【phrase モード（entry_type = "phrase"）】
word モードと同じルール（類語 + 例文2つ + memo）

【sentence モード（entry_type = "sentence"）】
1. word: 覚える英文そのもの
2. meaning: 日本語訳
3. synonyms: 同じ意味の**別の言い回し**（英文、1〜2個）。カンマ区切り。なければ空文字
4. example_1: word と同じなら {"en":"","ja":"","note":""} でよい。別の使い方例がある場合のみ en/ja を入れる
5. example_2: 必ず {"en":"","ja":"","note":""}（空）
6. memo: 使う場面、フォーマル度、注意点（日本語）

【出力フォーマット】
必ず以下のJSON形式のみを出力してください。余計な解説文やバッククォート（```json）は一切含めないでください。
{
  "entry_type": "word",
  "word": "英単語",
  "meaning": "日本語の意味",
  "synonyms": "類語1, 類語2",
  "example_1": {
    "en": "English example sentence 1.",
    "ja": "例文1の日本語訳",
    "note": ""
  },
  "example_2": {
    "en": "English example sentence 2.",
    "ja": "例文2の日本語訳",
    "note": ""
  },
  "memo": "日本語の説明"
}
```

## 3. HTTP リクエスト（Supabase POST）の Body 例

```json
{
  "entry_type": "{{#LLM.entry_type#}}",
  "word": "（LLMが生成した英語）",
  "meaning": "（LLMが生成した日本語の意味）",
  "synonyms": "ignore, let be",
  "example_1": "{\"en\":\"...\",\"ja\":\"...\",\"note\":\"\"}",
  "example_2": "{\"en\":\"...\",\"ja\":\"...\",\"note\":\"\"}",
  "memo": "（日本語の説明）",
  "line_user_id": "{{#開始.line_user_id#}}"
}
```

`example_1` / `example_2` は **JSON 文字列** で保存してください。`ja` がないとアプリに日本語訳が出ません。

## 4. コード実行（Supabase POST 用）

LLM の JSON を Supabase 用に整形するノードで `entry_type` を渡してください。

```javascript
return {
  entry_type: data.entry_type || "word",
  word: data.word || "",
  meaning: data.meaning || "",
  synonyms: data.synonyms || "",
  example_1: JSON.stringify(data.example_1 || { en: "", ja: "", note: "" }),
  example_2: JSON.stringify(data.example_2 || { en: "", ja: "", note: "" }),
  memo: data.memo || "",
  line_user_id: line_user_id,
};
```

## 5. コード実行（LINE 返信用 `<SPLIT>`）

```javascript
function main({ json_text }) {
  try {
    const data = JSON.parse(json_text);

    const word = data.word || "";
    const meaning = data.meaning || "";
    const synonyms = data.synonyms || "";
    const memo = data.memo || "";
    const entryType = data.entry_type || "word";

    let ex1_en = "", ex1_ja = "";
    if (data.example_1) {
      if (typeof data.example_1 === "object") {
        ex1_en = data.example_1.en || "";
        ex1_ja = data.example_1.ja || "";
      } else {
        ex1_en = data.example_1;
      }
    }

    let ex2_en = "", ex2_ja = "";
    if (data.example_2) {
      if (typeof data.example_2 === "object") {
        ex2_en = data.example_2.en || "";
        ex2_ja = data.example_2.ja || "";
      } else {
        ex2_en = data.example_2;
      }
    }

    const msg1Parts = [word, meaning];
    if (synonyms) {
      const label = entryType === "sentence" ? "別の言い回し" : "類語";
      msg1Parts.push(`${label}: ${synonyms}`);
    }
    const msg1 = msg1Parts.join("\n");

    const msg2 = ex1_en;
    const msg3 = ex1_ja;

    let msg4 = "";
    if (entryType === "sentence") {
      msg4 = memo ? `${memo}\n\n✅ ストック完了` : "✅ ストック完了";
    } else {
      const ex2Parts = [ex2_en, ex2_ja].filter(Boolean);
      msg4 = ex2Parts.length > 0 ? ex2Parts.join("\n") : "";
    }

    const parts = [msg1, msg2, msg3, msg4].filter((p) => p.trim().length > 0);
    return { answer: parts.join("<SPLIT>") };
  } catch (e) {
    return { answer: "エラーが発生しました。" };
  }
}
```

**LINE メッセージ構成**

| モード | msg1 | msg2 | msg3 | msg4 |
|--------|------|------|------|------|
| word / phrase | 単語+意味+類語 | 例文1 EN | 例文1 JA | 例文2 EN/JA |
| sentence | 英文+訳+別の言い回し | 使い方例 EN（あれば） | 使い方例 JA | memo + ストック完了 |

## 6. 動作確認

1. LINE で `apple` → entry_type=word、類語+例文2
2. LINE で `look forward to` → entry_type=phrase
3. LINE で `I'll follow up with you tomorrow.` → entry_type=sentence、別の言い回し、例文2なし
4. LINE で `明日また連絡しますって英語で？` → entry_type=sentence
5. Supabase の `entry_type` と `example_1` の `ja` を確認
6. 単語帳アプリで「例文」バッジ・「別の言い回し」表示を確認

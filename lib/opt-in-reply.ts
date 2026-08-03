export type OptInReply = "yes" | "no";

const YES_REPLIES = new Set(["はい", "yes"]);
const NO_REPLIES = new Set(["いいえ", "いえ", "no"]);

function normalizeReplyText(text: string): string {
  return text
    .trim()
    .replace(/[。．.!！?？]+$/g, "")
    .toLowerCase();
}

export function parseOptInReply(text: string): OptInReply | null {
  const normalized = normalizeReplyText(text);

  if (YES_REPLIES.has(normalized)) {
    return "yes";
  }

  if (NO_REPLIES.has(normalized)) {
    return "no";
  }

  return null;
}

export function buildOptInConfirmationMessage(reply: OptInReply): string {
  if (reply === "yes") {
    return `週末リマインドをオンにしました 📚

毎週末、今週覚えた単語の復習とテストをお知らせします。

オフにしたいときは「いいえ」と返信してください。`;
  }

  return `週末リマインドはオフにしました。

後から受け取りたくなったら「はい」と返信してください。`;
}

export function buildOptInBroadcastMessage(): string {
  return `📚 新機能のお知らせ

毎週末に、今週覚えた単語の復習＆テストリマインドをLINEでお送りする機能を追加します。

受け取りますか？
「はい」または「いいえ」で返信してください。

・はい → 毎週末にリマインドが届きます
・いいえ → 通知は送りません（あとから「はい」で再開できます）`;
}

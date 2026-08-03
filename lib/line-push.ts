import { LineBotClient } from "@line/bot-sdk";

type LineTextMessage = { type: "text"; text: string };

function getChannelAccessToken(): string {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error("Missing environment variable: LINE_CHANNEL_ACCESS_TOKEN");
  }
  return token;
}

export function createLineClient(): LineBotClient {
  return LineBotClient.fromChannelAccessToken({
    channelAccessToken: getChannelAccessToken(),
  });
}

export async function pushLineTextMessage(
  lineUserId: string,
  text: string,
  client?: LineBotClient,
): Promise<void> {
  const lineClient = client ?? createLineClient();
  const messages: LineTextMessage[] = [{ type: "text", text }];

  await lineClient.pushMessage({
    to: lineUserId,
    messages,
  });
}

export type PushBatchResult = {
  sent: number;
  failed: number;
  errors: { lineUserId: string; message: string }[];
};

export async function pushLineTextMessageBatch(
  entries: { lineUserId: string; text: string }[],
): Promise<PushBatchResult> {
  const lineClient = createLineClient();
  const result: PushBatchResult = { sent: 0, failed: 0, errors: [] };

  for (const entry of entries) {
    try {
      await pushLineTextMessage(entry.lineUserId, entry.text, lineClient);
      result.sent += 1;
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        lineUserId: entry.lineUserId,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return result;
}

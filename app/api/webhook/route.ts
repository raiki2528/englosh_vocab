import { LineBotClient, validateSignature, webhook } from "@line/bot-sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const DIFY_CHAT_MESSAGES_URL = "https://api.dify.ai/v1/chat-messages";
const SPLIT_DELIMITER = "<SPLIT>";
const LINE_REPLY_MESSAGE_MAX = 5;

type LineTextMessage = { type: "text"; text: string };

type DifyChatResponse = {
  answer?: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function isTextMessageEvent(
  event: webhook.Event,
): event is webhook.MessageEvent & { message: webhook.TextMessageContent } {
  return (
    event.type === "message" &&
    "message" in event &&
    event.message.type === "text"
  );
}

function getLineUserId(event: webhook.Event): string | undefined {
  if (!("source" in event) || !event.source) {
    return undefined;
  }

  if ("userId" in event.source && typeof event.source.userId === "string") {
    return event.source.userId;
  }

  return undefined;
}

async function fetchDifyAnswer(
  query: string,
  userId: string,
  apiKey: string,
): Promise<string> {
  const response = await fetch(DIFY_CHAT_MESSAGES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: {},
      query,
      response_mode: "blocking",
      conversation_id: "",
      user: userId,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Dify API request failed (${response.status}): ${errorBody || response.statusText}`,
    );
  }

  const data = (await response.json()) as DifyChatResponse;

  if (typeof data.answer !== "string" || data.answer.length === 0) {
    throw new Error("Dify API response did not include a valid answer");
  }

  return data.answer;
}

function buildLineTextMessages(answer: string): LineTextMessage[] {
  if (!answer.includes(SPLIT_DELIMITER)) {
    return [{ type: "text", text: answer }];
  }

  const parts = answer
    .split(SPLIT_DELIMITER)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, LINE_REPLY_MESSAGE_MAX);

  if (parts.length === 0) {
    return [{ type: "text", text: answer }];
  }

  return parts.map((text) => ({ type: "text", text }));
}

export async function POST(request: NextRequest) {
  try {
    const channelSecret = getRequiredEnv("LINE_CHANNEL_SECRET");
    const channelAccessToken = getRequiredEnv("LINE_CHANNEL_ACCESS_TOKEN");
    const difyApiKey = getRequiredEnv("DIFY_API_KEY");

    const signature = request.headers.get("x-line-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const body = await request.text();

    if (!validateSignature(body, channelSecret, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let payload: webhook.CallbackRequest;
    try {
      payload = JSON.parse(body) as webhook.CallbackRequest;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!Array.isArray(payload.events) || payload.events.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const lineClient = LineBotClient.fromChannelAccessToken({
      channelAccessToken,
    });

    for (const event of payload.events) {
      if (!isTextMessageEvent(event)) {
        continue;
      }

      const replyToken = event.replyToken;
      const userId = getLineUserId(event);
      const userMessage = event.message.text;

      if (!replyToken || !userId) {
        console.warn("Skipping text message: missing replyToken or userId", {
          eventId: "webhookEventId" in event ? event.webhookEventId : undefined,
        });
        continue;
      }

      try {
        const answer = await fetchDifyAnswer(userMessage, userId, difyApiKey);

        await lineClient.replyMessage({
          replyToken,
          messages: buildLineTextMessages(answer),
        });
      } catch (error) {
        console.error("Failed to process LINE text message:", error);

        try {
          await lineClient.replyMessage({
            replyToken,
            messages: [
              {
                type: "text",
                text: "申し訳ありません。処理中にエラーが発生しました。しばらくしてからもう一度お試しください。",
              },
            ],
          });
        } catch (replyError) {
          console.error("Failed to send error reply to LINE:", replyError);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook handler error:", error);

    if (
      error instanceof Error &&
      error.message.startsWith("Missing environment variable:")
    ) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

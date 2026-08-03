import {
  authorizeAdmin,
  unauthorizedAdminResponse,
} from "@/lib/admin-auth";
import { pushLineTextMessageBatch } from "@/lib/line-push";
import { buildOptInBroadcastMessage } from "@/lib/opt-in-reply";
import { fetchDistinctLineUserIdsFromVocab } from "@/lib/reminder-preferences";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (!authorizeAdmin(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const lineUserIds = await fetchDistinctLineUserIdsFromVocab();

    if (lineUserIds.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "送信対象のユーザーがいません",
        sent: 0,
        failed: 0,
      });
    }

    const text = buildOptInBroadcastMessage();
    const entries = lineUserIds.map((lineUserId) => ({ lineUserId, text }));
    const result = await pushLineTextMessageBatch(entries);

    return NextResponse.json({
      ok: true,
      totalTargets: lineUserIds.length,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Opt-in broadcast failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

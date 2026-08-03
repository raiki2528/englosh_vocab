import {
  authorizeCron,
  unauthorizedCronResponse,
} from "@/lib/admin-auth";
import { pushLineTextMessage } from "@/lib/line-push";
import { fetchOptedInUserIds } from "@/lib/reminder-preferences";
import {
  buildWeeklyReminderMessage,
  fetchWeeklyVocabulary,
} from "@/lib/weekly-reminder";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return unauthorizedCronResponse();
  }

  try {
    const userIds = await fetchOptedInUserIds();
    let sent = 0;
    let skipped = 0;
    let failed = 0;
    const errors: { lineUserId: string; message: string }[] = [];

    for (const lineUserId of userIds) {
      try {
        const items = await fetchWeeklyVocabulary(lineUserId);

        if (items.length === 0) {
          skipped += 1;
          continue;
        }

        const message = buildWeeklyReminderMessage(lineUserId, items);
        await pushLineTextMessage(lineUserId, message);
        sent += 1;
      } catch (error) {
        failed += 1;
        errors.push({
          lineUserId,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      totalOptedIn: userIds.length,
      sent,
      skipped,
      failed,
      errors,
    });
  } catch (error) {
    console.error("Weekly reminder cron failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

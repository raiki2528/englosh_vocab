import {
  authorizeCron,
  unauthorizedCronResponse,
} from "@/lib/admin-auth";
import { getWeeklyLeaderboard } from "@/lib/leaderboard";
import { pushLineTextMessage } from "@/lib/line-push";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { buildWeeklyRankingMessage } from "@/lib/weekly-ranking-message";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type ParticipantRow = {
  line_user_id: string;
  public_id: string;
};

export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return unauthorizedCronResponse();
  }

  try {
    const previousWeekReference = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const entries = await getWeeklyLeaderboard(previousWeekReference);
    const { data, error } = await createSupabaseServiceClient()
      .from("leaderboard_profiles")
      .select("line_user_id, public_id");

    if (error) {
      throw new Error(`Failed to fetch ranking participants: ${error.message}`);
    }

    const participants = (data ?? []) as ParticipantRow[];
    const entryByPublicId = new Map(
      entries.map((entry) => [entry.publicId, entry]),
    );
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const participant of participants) {
      const ownEntry = entryByPublicId.get(participant.public_id);
      if (!ownEntry) {
        skipped += 1;
        continue;
      }

      try {
        await pushLineTextMessage(
          participant.line_user_id,
          buildWeeklyRankingMessage(
            participant.line_user_id,
            entries,
            ownEntry,
          ),
        );
        sent += 1;
      } catch (pushError) {
        failed += 1;
        console.error("Weekly ranking LINE push failed:", {
          publicId: participant.public_id,
          message:
            pushError instanceof Error ? pushError.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      participants: participants.length,
      sent,
      skipped,
      failed,
    });
  } catch (error) {
    console.error("Weekly ranking cron failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

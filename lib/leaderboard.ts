import "server-only";

import type {
  FriendsDashboard,
  LeaderboardEntry,
} from "@/lib/friends-types";
import { getJstWeek } from "@/lib/jst-week";
import {
  AVATAR_BUCKET,
  getMemberProfile,
} from "@/lib/member-profiles";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type LeaderboardRow = {
  public_id: string;
  display_name: string;
  avatar_path: string | null;
  weekly_target: number;
  weekly_word_count: number;
  rank: number;
};

function finiteNonnegativeInteger(value: unknown, field: string): number {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error(`Invalid ${field} returned by leaderboard RPC`);
  }
  return number;
}

function parseRow(value: unknown): LeaderboardRow {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid row returned by leaderboard RPC");
  }
  const row = value as Record<string, unknown>;
  if (
    typeof row.public_id !== "string" ||
    typeof row.display_name !== "string" ||
    (row.avatar_path !== null && typeof row.avatar_path !== "string")
  ) {
    throw new Error("Invalid profile returned by leaderboard RPC");
  }
  return {
    public_id: row.public_id,
    display_name: row.display_name,
    avatar_path: row.avatar_path,
    weekly_target: finiteNonnegativeInteger(
      row.weekly_target,
      "weekly target",
    ),
    weekly_word_count: finiteNonnegativeInteger(
      row.weekly_word_count,
      "weekly word count",
    ),
    rank: finiteNonnegativeInteger(row.rank, "rank"),
  };
}

export async function getWeeklyLeaderboard(
  reference = new Date(),
): Promise<LeaderboardEntry[]> {
  if (Number.isNaN(reference.getTime())) {
    throw new Error("Invalid reference date");
  }
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("get_jst_weekly_leaderboard", {
    reference_time: reference.toISOString(),
  });
  if (error) throw new Error(`Failed to fetch leaderboard: ${error.message}`);

  const rawRows: unknown[] = Array.isArray(data) ? data : [];
  const rows: LeaderboardRow[] = rawRows.map(parseRow);
  const paths = rows
    .map((row) => row.avatar_path)
    .filter((path): path is string => Boolean(path));
  const signedUrls = new Map<string, string>();

  if (paths.length > 0) {
    const { data: signed, error: signedError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrls(paths, 60 * 60);
    if (signedError) {
      console.error("Failed to sign leaderboard avatars:", signedError);
    } else {
      for (const item of signed ?? []) {
        if (item.path && item.signedUrl) signedUrls.set(item.path, item.signedUrl);
      }
    }
  }

  return rows.map((row) => ({
    publicId: row.public_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_path
      ? (signedUrls.get(row.avatar_path) ?? null)
      : null,
    weeklyCount: row.weekly_word_count,
    weeklyWordTarget: row.weekly_target,
    achievementRate: Math.round(
      (row.weekly_word_count / row.weekly_target) * 100,
    ),
    rank: row.rank,
    isMe: false,
  }));
}

export async function getFriendsDashboard(
  lineUserId: string,
  reference = new Date(),
): Promise<FriendsDashboard> {
  const [profile, rankings] = await Promise.all([
    getMemberProfile(lineUserId),
    getWeeklyLeaderboard(reference),
  ]);
  const current = profile
    ? rankings.find((entry) => entry.publicId === profile.publicId)
    : undefined;
  const leaderboard = rankings.map((entry) => ({
    ...entry,
    isMe: entry.publicId === profile?.publicId,
  }));

  return {
    week: getJstWeek(reference),
    me: {
      profile,
      weeklyCount: current?.weeklyCount ?? 0,
      achievementRate: current?.achievementRate ?? null,
      rank: current?.rank ?? null,
    },
    leaderboard,
  };
}

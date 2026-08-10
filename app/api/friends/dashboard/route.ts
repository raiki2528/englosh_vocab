import { getFriendsDashboard } from "@/lib/leaderboard";
import { resolveLineUserId } from "@/lib/member-profiles";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
};

export async function GET(request: NextRequest) {
  const lineUserId = await resolveLineUserId(request);
  if (!lineUserId) {
    return NextResponse.json(
      { error: "Missing uid" },
      { status: 401, headers: NO_STORE },
    );
  }

  try {
    const dashboard = await getFriendsDashboard(lineUserId);
    return NextResponse.json(dashboard, { headers: NO_STORE });
  } catch (error) {
    console.error("Failed to get friends dashboard:", error);
    return NextResponse.json(
      { error: "ランキングの取得に失敗しました" },
      { status: 500, headers: NO_STORE },
    );
  }
}

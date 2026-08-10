import { getPublicMemberProfile } from "@/lib/member-profiles";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ publicId: string }> },
) {
  try {
    const { publicId } = await context.params;
    const profile = await getPublicMemberProfile(publicId);
    if (!profile) {
      return NextResponse.json(
        { error: "プロフィールが見つかりません" },
        { status: 404, headers: NO_STORE },
      );
    }
    return NextResponse.json({ profile }, { headers: NO_STORE });
  } catch (error) {
    console.error("Failed to get public member profile:", error);
    return NextResponse.json(
      { error: "プロフィールの取得に失敗しました" },
      { status: 500, headers: NO_STORE },
    );
  }
}

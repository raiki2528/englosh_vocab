import {
  getMemberProfile,
  ProfileValidationError,
  resolveLineUserId,
  upsertMemberProfile,
  validateMemberProfileInput,
} from "@/lib/member-profiles";
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
    const profile = await getMemberProfile(lineUserId);
    return NextResponse.json({ profile }, { headers: NO_STORE });
  } catch (error) {
    console.error("Failed to get own member profile:", error);
    return NextResponse.json(
      { error: "プロフィールの取得に失敗しました" },
      { status: 500, headers: NO_STORE },
    );
  }
}

export async function PUT(request: NextRequest) {
  const lineUserId = await resolveLineUserId(request);
  if (!lineUserId) {
    return NextResponse.json(
      { error: "Missing uid" },
      { status: 401, headers: NO_STORE },
    );
  }

  try {
    const body: unknown = await request.json();
    const existingProfile = await getMemberProfile(lineUserId);
    if (
      !existingProfile &&
      (!body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        (body as Record<string, unknown>).publicConsent !== true)
    ) {
      return NextResponse.json(
        { error: "公開プロフィールとランキング参加への同意が必要です" },
        { status: 400, headers: NO_STORE },
      );
    }
    const input = validateMemberProfileInput(body);
    const profile = await upsertMemberProfile(lineUserId, input);
    return NextResponse.json({ profile }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof ProfileValidationError || error instanceof SyntaxError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: NO_STORE },
      );
    }
    console.error("Failed to save own member profile:", error);
    return NextResponse.json(
      { error: "プロフィールの保存に失敗しました" },
      { status: 500, headers: NO_STORE },
    );
  }
}

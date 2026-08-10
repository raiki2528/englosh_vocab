import {
  AVATAR_BUCKET,
  getInternalMemberProfile,
  resolveLineUserId,
  setMemberAvatarPath,
} from "@/lib/member-profiles";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const NO_STORE = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
};

function hasExpectedSignature(bytes: Buffer, type: string): boolean {
  if (type === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (type === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      )
    );
  }
  return (
    type === "image/webp" &&
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  );
}

export async function POST(request: NextRequest) {
  const lineUserId = await resolveLineUserId(request);
  if (!lineUserId) {
    return NextResponse.json(
      { error: "Missing uid" },
      { status: 401, headers: NO_STORE },
    );
  }

  try {
    const form = await request.formData();
    const avatar = form.get("avatar");
    if (!(avatar instanceof File)) {
      return NextResponse.json(
        { error: "avatar file is required" },
        { status: 400, headers: NO_STORE },
      );
    }
    const extension = EXTENSION_BY_TYPE[avatar.type];
    if (!extension || avatar.size === 0 || avatar.size > MAX_AVATAR_BYTES) {
      return NextResponse.json(
        { error: "Avatar must be a JPEG, PNG, or WebP file up to 5 MB" },
        { status: 400, headers: NO_STORE },
      );
    }
    const bytes = Buffer.from(await avatar.arrayBuffer());
    if (!hasExpectedSignature(bytes, avatar.type)) {
      return NextResponse.json(
        { error: "Avatar file content does not match its image type" },
        { status: 400, headers: NO_STORE },
      );
    }

    const existing = await getInternalMemberProfile(lineUserId);
    if (!existing) {
      return NextResponse.json(
        { error: "プロフィールが見つかりません" },
        { status: 404, headers: NO_STORE },
      );
    }

    const path = `${existing.public_id}/${randomUUID()}.${extension}`;
    const supabase = createSupabaseServiceClient();
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, bytes, {
        contentType: avatar.type,
        upsert: false,
      });
    if (uploadError) throw new Error(`Avatar upload failed: ${uploadError.message}`);

    try {
      const profile = await setMemberAvatarPath(lineUserId, path);
      if (existing.avatar_path) {
        const { error: removeError } = await supabase.storage
          .from(AVATAR_BUCKET)
          .remove([existing.avatar_path]);
        if (removeError) {
          console.error("Failed to remove previous member avatar:", removeError);
        }
      }
      return NextResponse.json({ profile }, { headers: NO_STORE });
    } catch (error) {
      await supabase.storage.from(AVATAR_BUCKET).remove([path]);
      throw error;
    }
  } catch (error) {
    console.error("Failed to update member avatar:", error);
    return NextResponse.json(
      { error: "アバターの更新に失敗しました" },
      { status: 500, headers: NO_STORE },
    );
  }
}

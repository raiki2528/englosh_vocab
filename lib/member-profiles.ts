import "server-only";

import type {
  EnglishQualification,
  MemberProfile,
  OverseasHistory,
} from "@/lib/friends-types";
import { LINE_USER_ID_COOKIE } from "@/lib/line-user-id";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { normalizeLineUserId } from "@/lib/vocabulary";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const AVATAR_BUCKET = "leaderboard-avatars";

export type MemberProfileInput = {
  displayName: string;
  purpose: string;
  weeklyWordTarget: number;
  qualifications: EnglishQualification[];
  overseasHistory: OverseasHistory[];
};

type ProfileRow = {
  line_user_id: string;
  public_id: string;
  display_name: string;
  purpose: string;
  weekly_target: number;
  qualifications: unknown;
  overseas_history: unknown;
  avatar_path: string | null;
  joined_at: string;
  updated_at: string;
};

function requiredString(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ProfileValidationError(`${field} is required`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new ProfileValidationError(
      `${field} must be ${maxLength} characters or fewer`,
    );
  }
  return normalized;
}

const QUALIFICATION_TYPES = new Set<EnglishQualification["type"]>([
  "TOEIC",
  "英検",
  "IELTS",
  "TOEFL",
  "その他",
]);

function qualificationsField(value: unknown): EnglishQualification[] {
  if (!Array.isArray(value) || value.length > 20) {
    throw new ProfileValidationError("qualifications must be an array");
  }
  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new ProfileValidationError("Invalid qualification");
    }
    const row = item as Record<string, unknown>;
    if (
      typeof row.type !== "string" ||
      !QUALIFICATION_TYPES.has(row.type as EnglishQualification["type"])
    ) {
      throw new ProfileValidationError("Invalid qualification type");
    }
    return {
      type: row.type as EnglishQualification["type"],
      value: requiredString(row.value, "qualification value", 100),
    };
  });
}

function overseasHistoryField(value: unknown): OverseasHistory[] {
  if (!Array.isArray(value) || value.length > 20) {
    throw new ProfileValidationError("overseasHistory must be an array");
  }
  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new ProfileValidationError("Invalid overseas history");
    }
    const row = item as Record<string, unknown>;
    return {
      country: requiredString(row.country, "country", 100),
      duration: requiredString(row.duration, "duration", 100),
    };
  });
}

export class ProfileValidationError extends Error {}

export function validateMemberProfileInput(
  value: unknown,
): MemberProfileInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ProfileValidationError("A JSON object is required");
  }
  const input = value as Record<string, unknown>;
  const weeklyWordTarget = input.weeklyWordTarget;
  if (
    typeof weeklyWordTarget !== "number" ||
    !Number.isInteger(weeklyWordTarget) ||
    weeklyWordTarget < 1 ||
    weeklyWordTarget > 1000
  ) {
    throw new ProfileValidationError(
      "weeklyWordTarget must be an integer from 1 to 1000",
    );
  }

  return {
    displayName: requiredString(input.displayName, "displayName", 40),
    purpose: requiredString(input.purpose, "purpose", 200),
    weeklyWordTarget,
    qualifications: qualificationsField(input.qualifications ?? []),
    overseasHistory: overseasHistoryField(input.overseasHistory ?? []),
  };
}

export async function resolveLineUserId(
  request: NextRequest,
): Promise<string | null> {
  const candidate =
    request.nextUrl.searchParams.get("uid") ??
    (await cookies()).get(LINE_USER_ID_COOKIE)?.value;
  if (!candidate?.trim()) return null;
  const normalized = normalizeLineUserId(candidate);
  return normalized.length <= 255 ? normalized : null;
}

async function avatarUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await createSupabaseServiceClient()
    .storage.from(AVATAR_BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error) {
    console.error("Failed to sign member avatar:", error);
    return null;
  }
  return data.signedUrl;
}

async function toPublicProfile(row: ProfileRow): Promise<MemberProfile> {
  return {
    publicId: row.public_id,
    displayName: row.display_name,
    purpose: row.purpose,
    weeklyWordTarget: row.weekly_target,
    qualifications: qualificationsField(row.qualifications),
    overseasHistory: overseasHistoryField(row.overseas_history),
    avatarUrl: await avatarUrl(row.avatar_path),
  };
}

export async function getInternalMemberProfile(
  lineUserId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await createSupabaseServiceClient()
    .from("leaderboard_profiles")
    .select("*")
    .eq("line_user_id", normalizeLineUserId(lineUserId))
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch profile: ${error.message}`);
  return (data as ProfileRow | null) ?? null;
}

export async function getMemberProfile(
  lineUserId: string,
): Promise<MemberProfile | null> {
  const row = await getInternalMemberProfile(lineUserId);
  return row ? toPublicProfile(row) : null;
}

export async function getPublicMemberProfile(
  publicId: string,
): Promise<MemberProfile | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(publicId)) {
    return null;
  }
  const { data, error } = await createSupabaseServiceClient()
    .from("leaderboard_profiles")
    .select("*")
    .eq("public_id", publicId)
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch profile: ${error.message}`);
  return data ? toPublicProfile(data as ProfileRow) : null;
}

export async function upsertMemberProfile(
  lineUserId: string,
  input: MemberProfileInput,
): Promise<MemberProfile> {
  const { data, error } = await createSupabaseServiceClient()
    .from("leaderboard_profiles")
    .upsert(
      {
        line_user_id: normalizeLineUserId(lineUserId),
        display_name: input.displayName,
        purpose: input.purpose,
        weekly_target: input.weeklyWordTarget,
        qualifications: input.qualifications,
        overseas_history: input.overseasHistory,
      },
      { onConflict: "line_user_id" },
    )
    .select("*")
    .single();
  if (error) throw new Error(`Failed to save profile: ${error.message}`);
  return toPublicProfile(data as ProfileRow);
}

export async function setMemberAvatarPath(
  lineUserId: string,
  path: string,
): Promise<MemberProfile> {
  const { data, error } = await createSupabaseServiceClient()
    .from("leaderboard_profiles")
    .update({ avatar_path: path })
    .eq("line_user_id", normalizeLineUserId(lineUserId))
    .select("*")
    .single();
  if (error) throw new Error(`Failed to update avatar: ${error.message}`);
  return toPublicProfile(data as ProfileRow);
}

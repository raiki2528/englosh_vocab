import "server-only";

import { getJstWeek, getJstWeekQueryBounds } from "@/lib/jst-week";
import type { MemberProfileDetail, StockedWord } from "@/lib/friends-types";
import { getPublicMemberProfile } from "@/lib/member-profiles";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { normalizeLineUserId } from "@/lib/vocabulary";

const VOCAB_TABLE =
  process.env.SUPABASE_VOCAB_TABLE?.trim() || "english_vocab";

type VocabRow = {
  word: string | null;
  meaning: string | null;
  created_at: string;
};

function dedupeWords(rows: VocabRow[]): StockedWord[] {
  const seen = new Set<string>();
  const words: StockedWord[] = [];

  for (const row of rows) {
    const word = row.word?.trim() ?? "";
    const meaning = row.meaning?.trim() ?? "";
    const key = word.toLowerCase();
    if (!word || seen.has(key)) continue;
    seen.add(key);
    words.push({
      word,
      meaning,
      createdAt: row.created_at,
    });
  }

  return words;
}

async function fetchVocabRows(
  lineUserId: string,
  bounds?: { startIso: string; endIso: string },
): Promise<VocabRow[]> {
  let query = createSupabaseServiceClient()
    .from(VOCAB_TABLE)
    .select("word, meaning, created_at")
    .eq("line_user_id", normalizeLineUserId(lineUserId))
    .order("created_at", { ascending: false });

  if (bounds) {
    query = query
      .gte("created_at", bounds.startIso)
      .lt("created_at", bounds.endIso);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch member vocabulary: ${error.message}`);
  }

  return (data ?? []) as VocabRow[];
}

export async function getMemberProfileDetail(
  publicId: string,
): Promise<MemberProfileDetail | null> {
  const profile = await getPublicMemberProfile(publicId);
  if (!profile) return null;

  const internal = await getInternalMemberProfileByPublicId(publicId);
  if (!internal) return null;

  const bounds = getJstWeekQueryBounds();
  const [weeklyRows, allRows] = await Promise.all([
    fetchVocabRows(internal.line_user_id, bounds),
    fetchVocabRows(internal.line_user_id),
  ]);

  return {
    profile,
    week: getJstWeek(),
    weeklyWords: dedupeWords(weeklyRows),
    allWords: dedupeWords(allRows),
  };
}

async function getInternalMemberProfileByPublicId(
  publicId: string,
): Promise<{ line_user_id: string } | null> {
  const { data, error } = await createSupabaseServiceClient()
    .from("leaderboard_profiles")
    .select("line_user_id")
    .eq("public_id", publicId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch profile owner: ${error.message}`);
  }

  return data as { line_user_id: string } | null;
}

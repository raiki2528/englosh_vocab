import { buildVocabAppUrl } from "@/lib/app-url";
import { getThisWeekRange } from "@/lib/quiz-filters";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  normalizeLineUserId,
  normalizeVocabularyRow,
  type VocabularyItem,
} from "@/lib/vocabulary";

const VOCAB_TABLE =
  process.env.SUPABASE_VOCAB_TABLE?.trim() || "english_vocab";

const MAX_WORDS_IN_MESSAGE = 15;

function isWithinDateRange(isoDate: string, range: { start: string; end: string }): boolean {
  const start = new Date(`${range.start}T00:00:00`);
  const end = new Date(`${range.end}T23:59:59`);
  const created = new Date(isoDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || Number.isNaN(created.getTime())) {
    return false;
  }

  return created >= start && created <= end;
}

export async function fetchWeeklyVocabulary(
  lineUserId: string,
): Promise<VocabularyItem[]> {
  const normalizedUid = normalizeLineUserId(lineUserId);
  const supabase = createSupabaseServerClient();
  const range = getThisWeekRange();

  const { data, error } = await supabase
    .from(VOCAB_TABLE)
    .select("*")
    .eq("line_user_id", normalizedUid)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`今週の単語取得に失敗しました: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => normalizeVocabularyRow(row as Record<string, unknown>))
    .filter((item) => isWithinDateRange(item.createdAt, range));
}

function formatWordLine(item: VocabularyItem): string {
  const meaning = item.meaning.trim();
  if (meaning.length > 0) {
    return `・${item.word} — ${meaning}`;
  }
  return `・${item.word}`;
}

export function buildWeeklyReminderMessage(
  lineUserId: string,
  items: VocabularyItem[],
): string {
  const count = items.length;
  const shown = items.slice(0, MAX_WORDS_IN_MESSAGE);
  const wordLines = shown.map(formatWordLine).join("\n");
  const overflow =
    count > MAX_WORDS_IN_MESSAGE
      ? `\n…他 ${count - MAX_WORDS_IN_MESSAGE} 語`
      : "";
  const quizUrl = buildVocabAppUrl(lineUserId, { tab: "quiz", range: "week" });

  return `📚 今週の復習タイム！

今週覚えた単語（${count}語）:
${wordLines}${overflow}

復習クイズを受けてみよう 👇
${quizUrl}`;
}

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeLineUserId } from "@/lib/vocabulary";

const REMINDER_TABLE = "reminder_preferences";

export async function setReminderPreference(
  lineUserId: string,
  enabled: boolean,
): Promise<void> {
  const normalizedUid = normalizeLineUserId(lineUserId);
  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from(REMINDER_TABLE).upsert(
    {
      line_user_id: normalizedUid,
      reminder_enabled: enabled,
      opted_in_at: enabled ? now : null,
      opted_out_at: enabled ? null : now,
      updated_at: now,
    },
    { onConflict: "line_user_id" },
  );

  if (error) {
    if (error.code === "PGRST205") {
      throw new Error(
        `テーブル "${REMINDER_TABLE}" が Supabase に存在しません。SQL Editor で supabase/reminder-preferences.sql を実行してください。`,
      );
    }
    throw new Error(`リマインド設定の保存に失敗しました: ${error.message}`);
  }
}

export async function fetchOptedInUserIds(): Promise<string[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from(REMINDER_TABLE)
    .select("line_user_id")
    .eq("reminder_enabled", true);

  if (error) {
    if (error.code === "PGRST205") {
      throw new Error(
        `テーブル "${REMINDER_TABLE}" が Supabase に存在しません。SQL Editor で supabase/reminder-preferences.sql を実行してください。`,
      );
    }
    throw new Error(`リマインド設定の取得に失敗しました: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => normalizeLineUserId(String(row.line_user_id ?? "")))
    .filter((id) => id.length > 0);
}

export async function fetchDistinctLineUserIdsFromVocab(): Promise<string[]> {
  const vocabTable =
    process.env.SUPABASE_VOCAB_TABLE?.trim() || "english_vocab";
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from(vocabTable)
    .select("line_user_id")
    .not("line_user_id", "is", null);

  if (error) {
    throw new Error(`ユーザー一覧の取得に失敗しました: ${error.message}`);
  }

  const ids = new Set<string>();
  for (const row of data ?? []) {
    const id = normalizeLineUserId(String(row.line_user_id ?? ""));
    if (id.length > 0) {
      ids.add(id);
    }
  }

  return [...ids];
}

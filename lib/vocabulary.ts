import { createSupabaseServerClient } from "@/lib/supabase/server";

export type VocabularyItem = {
  id: string;
  createdAt: string;
  word: string;
  meaning: string;
  example1: string;
  example2: string;
  memo: string;
};

const VOCAB_TABLE =
  process.env.SUPABASE_VOCAB_TABLE?.trim() || "english_vocab";

function pickString(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === "number") {
      return String(value);
    }
  }
  return "";
}

function parseExampleField(value: unknown): {
  en: string;
  ja: string;
  note: string;
} {
  if (value == null) {
    return { en: "", ja: "", note: "" };
  }

  let source: Record<string, unknown> | null = null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return { en: "", ja: "", note: "" };
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        source = parsed as Record<string, unknown>;
      } else {
        return { en: trimmed, ja: "", note: "" };
      }
    } catch {
      return { en: trimmed, ja: "", note: "" };
    }
  } else if (typeof value === "object" && !Array.isArray(value)) {
    source = value as Record<string, unknown>;
  }

  if (!source) {
    return { en: "", ja: "", note: "" };
  }

  return {
    en: pickString(source, ["en", "english", "example_en", "text"]),
    ja: pickString(source, ["ja", "japanese", "example_ja", "translation"]),
    note: pickString(source, ["note", "explanation", "comment"]),
  };
}

export function normalizeVocabularyRow(
  row: Record<string, unknown>,
): VocabularyItem {
  const example1 = parseExampleField(row.example_1 ?? row.example1);
  const example2 = parseExampleField(row.example_2 ?? row.example2);

  return {
    id: pickString(row, ["id"]),
    createdAt: pickString(row, ["created_at", "createdAt"]),
    word: pickString(row, ["word", "expression", "phrase"]),
    meaning: pickString(row, ["meaning", "meaning_ja", "translation"]),
    example1:
      example1.en ||
      pickString(row, ["example_1", "example_1_en", "example1_en"]),
    example2:
      example2.en ||
      pickString(row, ["example_2", "example_2_en", "example2_en"]),
    memo: pickString(row, ["memo", "note", "notes", "comment"]),
  };
}

export async function fetchVocabulary(): Promise<VocabularyItem[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from(VOCAB_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST205") {
      throw new Error(
        `テーブル "${VOCAB_TABLE}" が Supabase に存在しません。SQL Editor でテーブルを作成するか、.env.local の SUPABASE_VOCAB_TABLE を実際のテーブル名に合わせてください。`,
      );
    }
    throw new Error(`単語データの取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map((row) =>
    normalizeVocabularyRow(row as Record<string, unknown>),
  );
}

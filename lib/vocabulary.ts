import { inferEntryType, type EntryType } from "@/lib/entry-type";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type { EntryType };

export type VocabularyItem = {
  id: string;
  createdAt: string;
  entryType: EntryType;
  word: string;
  meaning: string;
  synonyms: string;
  example1: string;
  example1Ja: string;
  example2: string;
  example2Ja: string;
  memo: string;
};

const VOCAB_TABLE =
  process.env.SUPABASE_VOCAB_TABLE?.trim() || "english_vocab";

export function normalizeLineUserId(lineUserId: string): string {
  return lineUserId.trim().replace(/^["']+|["']+$/g, "");
}

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

function isJsonExampleString(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("{") && trimmed.endsWith("}");
}

function parseExampleField(value: unknown): {
  en: string;
  ja: string;
  note: string;
  parsedAsJson: boolean;
} {
  if (value == null) {
    return { en: "", ja: "", note: "", parsedAsJson: false };
  }

  let source: Record<string, unknown> | null = null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return { en: "", ja: "", note: "", parsedAsJson: false };
    }

    if (isJsonExampleString(trimmed)) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          source = parsed as Record<string, unknown>;
        }
      } catch {
        return { en: "", ja: "", note: "", parsedAsJson: true };
      }
    } else {
      return { en: trimmed, ja: "", note: "", parsedAsJson: false };
    }
  } else if (typeof value === "object" && !Array.isArray(value)) {
    source = value as Record<string, unknown>;
  }

  if (!source) {
    return { en: "", ja: "", note: "", parsedAsJson: false };
  }

  return {
    en: pickString(source, ["en", "english", "example_en", "text"]),
    ja: pickString(source, ["ja", "japanese", "example_ja", "translation"]),
    note: pickString(source, ["note", "explanation", "comment"]),
    parsedAsJson: true,
  };
}

function resolveExampleText(
  parsed: { en: string; parsedAsJson: boolean },
  rawValue: unknown,
  legacyKeys: string[],
  row: Record<string, unknown>,
): string {
  if (parsed.en) {
    return parsed.en;
  }

  if (typeof rawValue === "string" && !parsed.parsedAsJson) {
    return rawValue.trim();
  }

  return pickString(row, legacyKeys);
}

export function normalizeVocabularyRow(
  row: Record<string, unknown>,
): VocabularyItem {
  const rawExample1 = row.example_1 ?? row.example1;
  const rawExample2 = row.example_2 ?? row.example2;
  const example1 = parseExampleField(rawExample1);
  const example2 = parseExampleField(rawExample2);
  const word = pickString(row, ["word", "expression", "phrase"]);

  const memo =
    pickString(row, ["memo", "notes", "comment"]) ||
    example1.note ||
    example2.note;

  return {
    id: pickString(row, ["id"]),
    createdAt: pickString(row, ["created_at", "createdAt"]),
    entryType: inferEntryType(row.entry_type ?? row.entryType, word),
    word,
    meaning: pickString(row, ["meaning", "meaning_ja", "translation"]),
    synonyms: pickString(row, ["synonyms", "similar_words", "related_words"]),
    example1: resolveExampleText(example1, rawExample1, ["example_1_en", "example1_en"], row),
    example1Ja: example1.ja,
    example2: resolveExampleText(example2, rawExample2, ["example_2_en", "example2_en"], row),
    example2Ja: example2.ja,
    memo,
  };
}

function throwIfRowsExistButNotForUser(
  sample: { line_user_id: string | null }[],
  normalizedUid: string,
): void {
  const allNull = sample.every((row) => !row.line_user_id?.trim());

  if (allNull) {
    throw new Error(
      "単語は登録されていますが line_user_id が空のままです。Supabase で supabase/backfill-line-user-id.sql を実行するか、LINE で新しく単語を送り直してください。",
    );
  }

  throw new Error(
    `このURLのユーザーID（${normalizedUid.slice(0, 10)}…）に一致する単語がありません。LINEのウェルカムメッセージに載っている「あなた専用の単語帳」リンクから開き直してください。`,
  );
}

export async function fetchVocabulary(
  lineUserId: string,
): Promise<VocabularyItem[]> {
  const normalizedUid = normalizeLineUserId(lineUserId);
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from(VOCAB_TABLE)
    .select("*")
    .eq("line_user_id", normalizedUid)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST205") {
      throw new Error(
        `テーブル "${VOCAB_TABLE}" が Supabase に存在しません。SQL Editor でテーブルを作成するか、.env.local の SUPABASE_VOCAB_TABLE を実際のテーブル名に合わせてください。`,
      );
    }
    throw new Error(`単語データの取得に失敗しました: ${error.message}`);
  }

  const items = (data ?? []).map((row) =>
    normalizeVocabularyRow(row as Record<string, unknown>),
  );

  if (items.length === 0) {
    const { data: sample, error: sampleError } = await supabase
      .from(VOCAB_TABLE)
      .select("id, line_user_id")
      .order("created_at", { ascending: false })
      .limit(10);

    if (sampleError) {
      throw new Error(`単語データの取得に失敗しました: ${sampleError.message}`);
    }

    if (sample && sample.length > 0) {
      throwIfRowsExistButNotForUser(
        sample as { line_user_id: string | null }[],
        normalizedUid,
      );
    }
  }

  return items;
}

export type EntryType = "word" | "phrase" | "sentence";

export function normalizeEntryType(value: unknown): EntryType {
  if (value === "phrase" || value === "sentence") {
    return value;
  }
  return "word";
}

export function inferEntryType(stored: unknown, word: string): EntryType {
  const explicit = normalizeEntryType(stored);
  if (explicit !== "word") {
    return explicit;
  }

  const trimmed = word.trim();
  if (!trimmed.includes(" ")) {
    return "word";
  }

  const wordCount = trimmed.split(/\s+/).length;
  if (/[.!?？！。]$/.test(trimmed) || wordCount >= 5) {
    return "sentence";
  }

  return "phrase";
}

export function getEntryTypeLabel(type: EntryType): string {
  switch (type) {
    case "sentence":
      return "例文";
    case "phrase":
      return "フレーズ";
    default:
      return "単語";
  }
}

export function getSynonymsLabel(type: EntryType): string {
  return type === "sentence" ? "別の言い回し" : "類語";
}

export function shouldShowExample2(item: {
  entryType: EntryType;
  example2: string;
  example2Ja: string;
}): boolean {
  if (item.entryType === "sentence") {
    return false;
  }

  return Boolean(item.example2 || item.example2Ja);
}

export function shouldShowExample1(item: {
  entryType: EntryType;
  word: string;
  example1: string;
  example1Ja: string;
}): boolean {
  if (item.entryType === "sentence") {
    const example = item.example1.trim().toLowerCase();
    const word = item.word.trim().toLowerCase();
    return example.length > 0 && example !== word;
  }

  return Boolean(item.example1 || item.example1Ja);
}

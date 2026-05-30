import type { VocabularyItem } from "@/lib/vocabulary";
import type { ProgressStore } from "@/lib/word-progress";
import { getMistakeCount } from "@/lib/word-progress";

export type QuizMode =
  | "all"
  | "mistake-1-3"
  | "mistake-4plus"
  | "mistake-0"
  | "this-week"
  | "this-month";

export type QuizModeOption = {
  id: QuizMode;
  label: string;
  description: string;
};

export const QUIZ_MODES: QuizModeOption[] = [
  {
    id: "all",
    label: "全単語",
    description: "登録されている単語からランダム",
  },
  {
    id: "mistake-1-3",
    label: "× 1〜3",
    description: "罰が1〜3個の単語だけ",
  },
  {
    id: "mistake-4plus",
    label: "× 4以上",
    description: "苦手な単語だけ",
  },
  {
    id: "mistake-0",
    label: "× 0",
    description: "まだ罰がついていない単語",
  },
  {
    id: "this-week",
    label: "今週",
    description: "今週追加した単語",
  },
  {
    id: "this-month",
    label: "今月",
    description: "今月追加した単語",
  },
];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isOnOrAfter(isoDate: string, boundary: Date): boolean {
  if (!isoDate) return false;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed >= boundary;
}

export function filterQuizItems(
  items: VocabularyItem[],
  mode: QuizMode,
  progress: ProgressStore,
): VocabularyItem[] {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  return items.filter((item) => {
    const mistakes = getMistakeCount(progress, item.id);

    switch (mode) {
      case "all":
        return true;
      case "mistake-1-3":
        return mistakes >= 1 && mistakes <= 3;
      case "mistake-4plus":
        return mistakes >= 4;
      case "mistake-0":
        return mistakes === 0;
      case "this-week":
        return isOnOrAfter(item.createdAt, weekStart);
      case "this-month":
        return isOnOrAfter(item.createdAt, monthStart);
      default:
        return true;
    }
  });
}

export function shuffleItems<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function isThisWeek(isoDate: string): boolean {
  if (!isoDate) return false;
  return isOnOrAfter(isoDate, startOfWeek(new Date()));
}

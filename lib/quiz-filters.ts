import type { VocabularyItem } from "@/lib/vocabulary";
import type { ProgressStore } from "@/lib/word-progress";
import { getMistakeCount } from "@/lib/word-progress";

export type QuizMode = "all" | "mistake-1-3";

export type DateRange = {
  start: string;
  end: string;
};

export type QuizFilterOptions = {
  mode: QuizMode;
  dateRange?: DateRange;
};

export const QUIZ_MODES: { id: QuizMode; label: string }[] = [
  { id: "all", label: "全単語" },
  { id: "mistake-1-3", label: "× 1〜3" },
];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateInput(value: string, endOfDay = false): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function getThisWeekRange(): DateRange {
  const now = new Date();
  return {
    start: toDateInputValue(startOfWeek(now)),
    end: toDateInputValue(endOfWeek(now)),
  };
}

export function getThisMonthRange(): DateRange {
  const now = new Date();
  return {
    start: toDateInputValue(startOfMonth(now)),
    end: toDateInputValue(endOfMonth(now)),
  };
}

function isWithinDateRange(isoDate: string, range: DateRange): boolean {
  if (!range.start || !range.end) return true;

  const start = parseDateInput(range.start);
  const end = parseDateInput(range.end, true);
  const created = new Date(isoDate);

  if (!start || !end || Number.isNaN(created.getTime())) return false;
  if (start > end) return created >= end && created <= start;
  return created >= start && created <= end;
}

export function filterQuizItems(
  items: VocabularyItem[],
  options: QuizFilterOptions,
  progress: ProgressStore,
): VocabularyItem[] {
  const { mode, dateRange } = options;

  return items.filter((item) => {
    const mistakes = getMistakeCount(progress, item.id);

    if (mode === "mistake-1-3" && (mistakes < 1 || mistakes > 3)) {
      return false;
    }

    if (dateRange?.start && dateRange?.end) {
      return isWithinDateRange(item.createdAt, dateRange);
    }

    return true;
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
  const range = getThisWeekRange();
  return isWithinDateRange(isoDate, range);
}

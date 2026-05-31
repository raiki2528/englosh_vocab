"use client";

import type { VocabularyItem } from "@/lib/vocabulary";
import { isThisWeek } from "@/lib/quiz-filters";
import type { ProgressStore } from "@/lib/word-progress";
import { getMistakeCount } from "@/lib/word-progress";
import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

type SortKey = "newest" | "mistakes";

type VocabListProps = {
  items: VocabularyItem[];
  progress: ProgressStore;
  onSelectWord: (index: number) => void;
  onResetProgress: (wordId: string) => void;
};

function mistakeBadgeClass(count: number): string {
  if (count === 0) return "bg-gray-100 text-gray-500";
  if (count <= 2) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

function formatDate(isoDate: string): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });
}

export function VocabList({
  items,
  progress,
  onSelectWord,
  onResetProgress,
}: VocabListProps) {
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  const sortedItems = useMemo(() => {
    const copy = items.map((item, index) => ({ item, index }));
    copy.sort((a, b) => {
      if (sortKey === "newest") {
        return (
          new Date(b.item.createdAt).getTime() -
          new Date(a.item.createdAt).getTime()
        );
      }
      if (sortKey === "mistakes") {
        const diff =
          getMistakeCount(progress, b.item.id) -
          getMistakeCount(progress, a.item.id);
        if (diff !== 0) return diff;
        return (
          new Date(b.item.createdAt).getTime() -
          new Date(a.item.createdAt).getTime()
        );
      }
      return 0;
    });
    return copy;
  }, [items, progress, sortKey]);

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <p className="text-center text-sm text-gray-500">
          単語がまだ登録されていません
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-gray-200 bg-gray-50 px-4 py-4">
        <h1 className="text-lg font-semibold text-gray-900">単語一覧</h1>
        <p className="mt-1 text-xs text-gray-500">{items.length} 語</p>
        <div className="mt-3 flex gap-2">
          {(
            [
              { key: "newest", label: "新しい順" },
              { key: "mistakes", label: "×多い順" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortKey(key)}
              className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                sortKey === key
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-600 ring-1 ring-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {sortedItems.map(({ item, index }) => {
          const mistakes = getMistakeCount(progress, item.id);
          const showWeekBadge = isThisWeek(item.createdAt);

          return (
            <li key={item.id} className="flex items-stretch bg-white">
              <button
                type="button"
                onClick={() => onSelectWord(index)}
                className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-4 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-medium text-gray-900">{item.word}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${mistakeBadgeClass(mistakes)}`}
                  >
                    ×{mistakes}
                  </span>
                </div>
                {item.meaning ? (
                  <span className="truncate text-sm text-gray-500">
                    {item.meaning}
                  </span>
                ) : null}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {formatDate(item.createdAt) ? (
                    <span>{formatDate(item.createdAt)}</span>
                  ) : null}
                  {showWeekBadge ? (
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-600">
                      今週
                    </span>
                  ) : null}
                </div>
              </button>
              {mistakes > 0 ? (
                <button
                  type="button"
                  onClick={() => onResetProgress(item.id)}
                  aria-label={`${item.word} の罰をリセット`}
                  className="flex shrink-0 items-center px-3 text-gray-400 transition-colors hover:text-gray-700"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

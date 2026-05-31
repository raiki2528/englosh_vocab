"use client";

import type { DateRange, QuizMode } from "@/lib/quiz-filters";
import {
  QUIZ_MODES,
  filterQuizItems,
  getThisMonthRange,
  getThisWeekRange,
  shuffleItems,
} from "@/lib/quiz-filters";
import type { VocabularyItem } from "@/lib/vocabulary";
import type { ProgressStore } from "@/lib/word-progress";
import {
  recordQuizCorrect,
  recordQuizWrong,
} from "@/lib/word-progress";
import { useMemo, useState } from "react";

type VocabQuizProps = {
  items: VocabularyItem[];
  progress: ProgressStore;
  onProgressChange: (
    updater: ProgressStore | ((prev: ProgressStore) => ProgressStore),
  ) => void;
};

type QuizPhase = "setup" | "playing" | "result";

export function VocabQuiz({
  items,
  progress,
  onProgressChange,
}: VocabQuizProps) {
  const [phase, setPhase] = useState<QuizPhase>("setup");
  const [mode, setMode] = useState<QuizMode>("all");
  const [dateRange, setDateRange] = useState<DateRange>({ start: "", end: "" });
  const [sessionItems, setSessionItems] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const filterOptions = useMemo(
    () => ({
      mode,
      dateRange:
        dateRange.start && dateRange.end ? dateRange : undefined,
    }),
    [mode, dateRange],
  );

  const filteredCount = useMemo(
    () => filterQuizItems(items, filterOptions, progress).length,
    [items, filterOptions, progress],
  );

  const currentItem = sessionItems[currentIndex];

  function startQuiz() {
    const filtered = shuffleItems(
      filterQuizItems(items, filterOptions, progress),
    );
    if (filtered.length === 0) return;

    setSessionItems(filtered);
    setCurrentIndex(0);
    setShowAnswer(false);
    setCorrectCount(0);
    setWrongCount(0);
    setPhase("playing");
  }

  function handleCorrect() {
    if (!currentItem) return;
    onProgressChange((store) => recordQuizCorrect(store, currentItem.id));
    setCorrectCount((c) => c + 1);
    goNext();
  }

  function handleWrong() {
    if (!currentItem) return;
    onProgressChange((store) => recordQuizWrong(store, currentItem.id));
    setWrongCount((c) => c + 1);
    setShowAnswer(true);
  }

  function goNext() {
    setShowAnswer(false);
    if (currentIndex >= sessionItems.length - 1) {
      setPhase("result");
      return;
    }
    setCurrentIndex((i) => i + 1);
  }

  function resetToSetup() {
    setPhase("setup");
    setSessionItems([]);
    setCurrentIndex(0);
    setShowAnswer(false);
  }

  function applyWeekRange() {
    setDateRange(getThisWeekRange());
  }

  function applyMonthRange() {
    setDateRange(getThisMonthRange());
  }

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <p className="text-center text-sm text-gray-500">
          テストする単語がありません
        </p>
      </div>
    );
  }

  if (phase === "setup") {
    return (
      <div className="flex h-full flex-col overflow-y-auto px-4 py-8">
        <div className="flex flex-wrap justify-center gap-2">
          {QUIZ_MODES.map((option) => {
            const isActive = mode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setMode(option.id)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-700 ring-1 ring-gray-200"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <section className="mt-8">
          <div className="flex items-end gap-3">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs text-gray-400">開始</span>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="w-full rounded-xl border-0 bg-white px-3 py-2.5 text-sm text-gray-900 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </label>
            <span className="pb-2.5 text-sm text-gray-300">〜</span>
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs text-gray-400">終了</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="w-full rounded-xl border-0 bg-white px-3 py-2.5 text-sm text-gray-900 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </label>
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={applyWeekRange}
              className="text-xs text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline"
            >
              今週
            </button>
            <button
              type="button"
              onClick={applyMonthRange}
              className="text-xs text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline"
            >
              今月
            </button>
            {dateRange.start || dateRange.end ? (
              <button
                type="button"
                onClick={() => setDateRange({ start: "", end: "" })}
                className="text-xs text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline"
              >
                クリア
              </button>
            ) : null}
          </div>

          {dateRange.start && dateRange.end ? (
            <p className="mt-2 text-center text-xs text-gray-400">
              {filteredCount} 語
            </p>
          ) : (
            <p className="mt-2 text-center text-xs text-gray-300">
              期間を指定しない場合は全期間
            </p>
          )}
        </section>

        <div className="mt-auto pt-10">
          <p className="mb-3 text-center text-xs text-gray-400">
            {filteredCount} 語
          </p>
          <button
            type="button"
            disabled={filteredCount === 0}
            onClick={startQuiz}
            className="w-full rounded-2xl bg-gray-900 py-4 text-sm font-medium text-white transition-opacity disabled:opacity-30"
          >
            開始
          </button>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const total = sessionItems.length;
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center px-6">
        <p className="text-5xl font-bold text-gray-900">
          {correctCount}
          <span className="text-2xl font-normal text-gray-400"> / {total}</span>
        </p>
        <button
          type="button"
          onClick={resetToSetup}
          className="mt-10 w-full max-w-xs rounded-2xl bg-gray-900 py-4 text-sm font-medium text-white"
        >
          もう一度
        </button>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] px-4 py-4">
      <p className="py-2 text-center text-xs text-gray-300">
        {currentIndex + 1} / {sessionItems.length}
      </p>

      <div className="flex min-h-0 items-center justify-center px-2">
        <div className="w-full max-w-sm text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {currentItem?.word}
          </h2>
          {showAnswer && currentItem?.meaning ? (
            <p className="mt-6 animate-[fadeIn_0.2s_ease-out] text-lg text-gray-600">
              {currentItem.meaning}
            </p>
          ) : null}
        </div>
      </div>

      <div className="pb-2 pt-4">
        {showAnswer ? (
          <button
            type="button"
            onClick={goNext}
            className="w-full rounded-2xl bg-gray-900 py-4 text-sm font-medium text-white"
          >
            次へ
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCorrect}
              aria-label="わかった"
              className="rounded-2xl bg-white py-6 text-3xl ring-1 ring-gray-200 transition-colors active:bg-gray-50"
            >
              ⭕️
            </button>
            <button
              type="button"
              onClick={handleWrong}
              aria-label="わからない"
              className="rounded-2xl bg-white py-6 text-3xl ring-1 ring-gray-200 transition-colors active:bg-gray-50"
            >
              ❌
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

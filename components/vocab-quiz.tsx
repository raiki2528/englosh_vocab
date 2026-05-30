"use client";

import type { QuizMode } from "@/lib/quiz-filters";
import { QUIZ_MODES, filterQuizItems, shuffleItems } from "@/lib/quiz-filters";
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

const QUESTION_COUNTS = [10, 20] as const;

export function VocabQuiz({
  items,
  progress,
  onProgressChange,
}: VocabQuizProps) {
  const [phase, setPhase] = useState<QuizPhase>("setup");
  const [mode, setMode] = useState<QuizMode>("all");
  const [questionCount, setQuestionCount] = useState<number | "all">(10);
  const [sessionItems, setSessionItems] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const filteredCount = useMemo(
    () => filterQuizItems(items, mode, progress).length,
    [items, mode, progress],
  );

  const currentItem = sessionItems[currentIndex];

  function startQuiz() {
    const filtered = shuffleItems(filterQuizItems(items, mode, progress));
    const count =
      questionCount === "all"
        ? filtered.length
        : Math.min(questionCount, filtered.length);

    if (count === 0) return;

    setSessionItems(filtered.slice(0, count));
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
      <div className="flex h-full flex-col overflow-y-auto px-4 py-6">
        <h1 className="text-lg font-semibold text-gray-900">小テスト</h1>
        <p className="mt-1 text-sm text-gray-500">
          英単語の意味がわかったら ⭕️、わからなければ ❌
        </p>

        <section className="mt-6">
          <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400">
            モード
          </h2>
          <div className="mt-3 space-y-2">
            {QUIZ_MODES.map((option) => {
              const count = filterQuizItems(items, option.id, progress).length;
              const isActive = mode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={count === 0}
                  onClick={() => setMode(option.id)}
                  className={`w-full rounded-2xl px-4 py-3 text-left transition-colors ${
                    isActive
                      ? "bg-gray-800 text-white"
                      : "bg-white text-gray-900 ring-1 ring-gray-200 disabled:opacity-40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{option.label}</span>
                    <span
                      className={`text-xs ${isActive ? "text-gray-300" : "text-gray-400"}`}
                    >
                      {count} 語
                    </span>
                  </div>
                  <p
                    className={`mt-0.5 text-xs ${isActive ? "text-gray-300" : "text-gray-500"}`}
                  >
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400">
            問題数
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUESTION_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                disabled={filteredCount < count}
                onClick={() => setQuestionCount(count)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  questionCount === count
                    ? "bg-gray-800 text-white"
                    : "bg-white text-gray-700 ring-1 ring-gray-200 disabled:opacity-40"
                }`}
              >
                {count} 問
              </button>
            ))}
            <button
              type="button"
              disabled={filteredCount === 0}
              onClick={() => setQuestionCount("all")}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                questionCount === "all"
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 disabled:opacity-40"
              }`}
            >
              全部 ({filteredCount})
            </button>
          </div>
        </section>

        <button
          type="button"
          disabled={filteredCount === 0}
          onClick={startQuiz}
          className="mt-8 w-full rounded-2xl bg-gray-900 py-4 text-sm font-medium text-white transition-opacity disabled:opacity-40"
        >
          テスト開始
        </button>
      </div>
    );
  }

  if (phase === "result") {
    const total = sessionItems.length;
    return (
      <div className="flex h-full flex-col items-center justify-center px-6">
        <p className="text-sm text-gray-500">結果</p>
        <p className="mt-2 text-4xl font-bold text-gray-900">
          {correctCount} / {total}
        </p>
        <p className="mt-2 text-sm text-gray-600">
          ⭕️ {correctCount}　❌ {wrongCount}
        </p>
        <p className="mt-4 text-center text-xs leading-relaxed text-gray-400">
          ⭕️ を3回連続で当てると、その単語の罰（×）がリセットされます
        </p>
        <button
          type="button"
          onClick={resetToSetup}
          className="mt-8 rounded-2xl bg-gray-900 px-8 py-3 text-sm font-medium text-white"
        >
          もう一度
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-4 py-6">
      <div className="text-center text-xs text-gray-400">
        {currentIndex + 1} / {sessionItems.length}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full rounded-3xl bg-white px-8 py-16 text-center shadow-sm">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {currentItem?.word}
          </h2>
          {showAnswer && currentItem?.meaning ? (
            <p className="mt-6 animate-[fadeIn_0.2s_ease-out] text-lg text-gray-700">
              {currentItem.meaning}
            </p>
          ) : null}
        </div>
      </div>

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
            className="rounded-2xl bg-emerald-50 py-5 text-lg font-medium text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100"
          >
            ⭕️ わかった
          </button>
          <button
            type="button"
            onClick={handleWrong}
            className="rounded-2xl bg-red-50 py-5 text-lg font-medium text-red-700 ring-1 ring-red-200 transition-colors hover:bg-red-100"
          >
            ❌ わからない
          </button>
        </div>
      )}
    </div>
  );
}

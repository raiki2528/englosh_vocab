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

export function VocabQuiz({
  items,
  progress,
  onProgressChange,
}: VocabQuizProps) {
  const [phase, setPhase] = useState<QuizPhase>("setup");
  const [mode, setMode] = useState<QuizMode>("all");
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
      <div className="flex h-full flex-col px-4 py-8">
        <div className="flex flex-wrap justify-center gap-2">
          {QUIZ_MODES.map((option) => {
            const count = filterQuizItems(items, option.id, progress).length;
            const isActive = mode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={count === 0}
                onClick={() => setMode(option.id)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-700 ring-1 ring-gray-200 disabled:opacity-30"
                }`}
              >
                {option.label}
                <span className={`ml-1.5 text-xs ${isActive ? "text-gray-400" : "text-gray-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-10">
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
      <div className="flex h-full flex-col items-center justify-center px-6">
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
    <div className="flex h-full flex-col px-4 py-6">
      <div className="text-center text-xs text-gray-300">
        {currentIndex + 1} / {sessionItems.length}
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center">
        <div className="w-full px-4 text-center">
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
  );
}

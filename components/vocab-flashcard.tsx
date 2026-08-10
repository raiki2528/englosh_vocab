"use client";

import { PronunciationButton } from "@/components/pronunciation-button";
import { VocabDetail } from "@/components/vocab-content";
import type { VocabularyItem } from "@/lib/vocabulary";
import { ChevronLeft, ChevronRight, Hand } from "lucide-react";
import { useCallback, useRef, useState } from "react";

function TapHint() {
  return (
    <div className="flex flex-col items-center">
      <Hand
        className="h-14 w-14 text-gray-200"
        strokeWidth={1.25}
        aria-hidden
      />
      <p className="mt-3 text-center text-sm text-gray-300">タップして表示</p>
    </div>
  );
}

function WordHeading({ word }: { word: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-8">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {word}
      </h1>
      <PronunciationButton word={word} />
    </div>
  );
}

type VocabFlashcardProps = {
  items: VocabularyItem[];
  index: number;
  onIndexChange: (index: number) => void;
};

export function VocabFlashcard({
  items,
  index,
  onIndexChange,
}: VocabFlashcardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const item = items[index];
  const total = items.length;

  const goPrev = useCallback(() => {
    setIsRevealed(false);
    onIndexChange(index > 0 ? index - 1 : index);
  }, [index, onIndexChange]);

  const goNext = useCallback(() => {
    setIsRevealed(false);
    onIndexChange(index < total - 1 ? index + 1 : index);
  }, [index, onIndexChange, total]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(delta) < 56) return;
    if (delta < 0) goNext();
    else goPrev();
  };

  const toggleReveal = () => {
    setIsRevealed((value) => !value);
  };

  if (!item) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-3 py-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          aria-label="前の単語"
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-r-lg bg-white/70 p-2 text-gray-400 backdrop-blur-sm transition enabled:hover:text-gray-700 disabled:opacity-30"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          type="button"
          onClick={goNext}
          disabled={index >= total - 1}
          aria-label="次の単語"
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-l-lg bg-white/70 p-2 text-gray-400 backdrop-blur-sm transition enabled:hover:text-gray-700 disabled:opacity-30"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        <div
          role="button"
          tabIndex={0}
          aria-label={isRevealed ? "カードの答えを隠す" : "カードの答えを表示"}
          onClick={toggleReveal}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleReveal();
            }
          }}
          className={`relative flex w-full max-h-[min(70vh,560px)] min-h-[min(60vh,480px)] flex-col overflow-hidden rounded-3xl bg-white text-center shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 ${
            isRevealed ? "items-stretch" : "items-center justify-center"
          }`}
        >
          {!isRevealed ? (
            <>
              <WordHeading word={item.word} />
              <div className="absolute inset-x-0 bottom-12 flex justify-center">
                <TapHint />
              </div>
            </>
          ) : (
            <div className="w-full animate-[fadeIn_0.25s_ease-out] overflow-y-auto px-8 py-10 text-left">
              <WordHeading word={item.word} />

              <VocabDetail
                item={item}
                memoLabel="説明"
                className="mt-6 animate-[fadeIn_0.25s_ease-out]"
              />
            </div>
          )}
        </div>
      </div>

      <footer className="shrink-0 px-6 pb-2 pt-1 text-center text-xs text-gray-400">
        {index + 1} / {total}
      </footer>
    </div>
  );
}

"use client";

import type { VocabularyItem } from "@/lib/vocabulary";
import { ChevronLeft, ChevronRight, Hand } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={index} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function TapHint() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 pb-16 pt-10">
      <Hand
        className="h-16 w-16 text-gray-200"
        strokeWidth={1.25}
        aria-hidden
      />
      <p className="mt-4 text-sm text-gray-300">タップして表示</p>
    </div>
  );
}

type VocabFlashcardProps = {
  items: VocabularyItem[];
};

export function VocabFlashcard({ items }: VocabFlashcardProps) {
  const [index, setIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const item = items[index];
  const total = items.length;

  const goPrev = useCallback(() => {
    setIndex((current) => (current > 0 ? current - 1 : current));
  }, []);

  const goNext = useCallback(() => {
    setIndex((current) => (current < total - 1 ? current + 1 : current));
  }, [total]);

  useEffect(() => {
    setIsRevealed(false);
  }, [index]);

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

  if (!item) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-6">
        <p className="text-center text-sm leading-relaxed text-gray-500">
          表示できる単語がありません。
          <br />
          テーブルにデータがあるのにこの画面になる場合、RLS（Row Level
          Security）で anon からの読み取りが拒否されている可能性があります。
          <br />
          <code className="mt-2 inline-block text-xs text-gray-600">
            supabase/rls-allow-public-read.sql
          </code>
          を Supabase の SQL Editor で実行してください。
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <div className="flex justify-center pt-4">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        <div
          className="relative flex flex-1 flex-col px-3 pt-6"
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

          <button
            type="button"
            onClick={() => setIsRevealed((value) => !value)}
            className="flex flex-1 flex-col overflow-hidden rounded-3xl bg-white text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          >
            {!isRevealed ? (
              <>
                <div className="flex flex-1 items-center justify-center px-8 py-16">
                  <h1 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    {item.word}
                  </h1>
                </div>
                <TapHint />
              </>
            ) : (
              <div className="animate-[fadeIn_0.25s_ease-out] px-8 py-10">
                <h1 className="text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  {item.word}
                </h1>

                {item.meaning ? (
                  <p className="mt-6 text-center text-lg leading-relaxed text-gray-900">
                    {item.meaning}
                  </p>
                ) : null}

                <div className="mt-10 space-y-8 text-[15px] leading-7 text-gray-800">
                  {item.example1 ? (
                    <div>
                      <p className="mb-2 text-xs font-medium text-gray-400">
                        例文 1
                      </p>
                      <p>
                        <RichText text={item.example1} />
                      </p>
                    </div>
                  ) : null}

                  {item.example2 ? (
                    <div>
                      <p className="mb-2 text-xs font-medium text-gray-400">
                        例文 2
                      </p>
                      <p>
                        <RichText text={item.example2} />
                      </p>
                    </div>
                  ) : null}
                </div>

                {item.memo ? (
                  <div className="mt-8 rounded-2xl bg-gray-100 px-5 py-4 text-sm leading-7 text-gray-700">
                    <p className="mb-2 text-xs font-medium text-gray-400">
                      memo
                    </p>
                    {item.memo}
                  </div>
                ) : null}
              </div>
            )}
          </button>
        </div>

        <footer className="px-6 pb-8 pt-2 text-center text-xs text-gray-400">
          {index + 1} / {total}
        </footer>
      </div>
    </div>
  );
}

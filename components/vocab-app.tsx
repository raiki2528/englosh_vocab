"use client";

import { BottomNav, type AppTab } from "@/components/bottom-nav";
import { VocabFlashcard } from "@/components/vocab-flashcard";
import { VocabList } from "@/components/vocab-list";
import { VocabQuiz } from "@/components/vocab-quiz";
import type { VocabularyItem } from "@/lib/vocabulary";
import {
  loadProgress,
  resetWordProgress,
  saveProgress,
  type ProgressStore,
} from "@/lib/word-progress";
import { useCallback, useEffect, useState } from "react";

type VocabAppProps = {
  items: VocabularyItem[];
  lineUserId: string;
};

export function VocabApp({ items, lineUserId }: VocabAppProps) {
  const [activeTab, setActiveTab] = useState<AppTab>("card");
  const [cardIndex, setCardIndex] = useState(0);
  const [progress, setProgress] = useState<ProgressStore>({});

  useEffect(() => {
    setProgress(loadProgress(lineUserId));
  }, [lineUserId]);

  const updateProgress = useCallback(
    (updater: ProgressStore | ((prev: ProgressStore) => ProgressStore)) => {
      setProgress((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        saveProgress(next, lineUserId);
        return next;
      });
    },
    [lineUserId],
  );

  const handleSelectWord = useCallback((index: number) => {
    setCardIndex(index);
    setActiveTab("card");
  }, []);

  const handleResetProgress = useCallback(
    (wordId: string) => {
      updateProgress((prev) => resetWordProgress(prev, wordId));
    },
    [updateProgress],
  );

  if (items.length === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-6">
        <p className="text-center text-sm leading-relaxed text-gray-500">
          表示できる単語がありません。
          <br />
          LINE で英単語を送ると、あなた専用の単語帳に追加されます。
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <main
        className="mx-auto flex h-dvh w-full max-w-md min-h-0 flex-1 flex-col overflow-hidden"
        style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
      >
        {activeTab === "list" ? (
          <VocabList
            items={items}
            progress={progress}
            onSelectWord={handleSelectWord}
            onResetProgress={handleResetProgress}
          />
        ) : null}

        {activeTab === "card" ? (
          <VocabFlashcard
            items={items}
            index={cardIndex}
            onIndexChange={setCardIndex}
          />
        ) : null}

        {activeTab === "quiz" ? (
          <VocabQuiz
            items={items}
            progress={progress}
            onProgressChange={updateProgress}
          />
        ) : null}
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}

"use client";

import { BottomNav, type AppTab } from "@/components/bottom-nav";
import { VocabFlashcard } from "@/components/vocab-flashcard";
import { VocabList } from "@/components/vocab-list";
import { VocabQuiz } from "@/components/vocab-quiz";
import { deleteVocabularyItem } from "@/lib/delete-vocabulary";
import { saveLineUserId } from "@/lib/line-user-id";
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

export function VocabApp({ items: initialItems, lineUserId }: VocabAppProps) {
  const [items, setItems] = useState(initialItems);
  const [activeTab, setActiveTab] = useState<AppTab>("card");
  const [cardIndex, setCardIndex] = useState(0);
  const [progress, setProgress] = useState<ProgressStore>({});
  const [deletingWordId, setDeletingWordId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    saveLineUserId(lineUserId);
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

  const handleDeleteWord = useCallback(
    async (wordId: string) => {
      setDeleteError(null);
      setDeletingWordId(wordId);

      try {
        await deleteVocabularyItem(wordId, lineUserId);

        setItems((prev) => {
          const deletedIndex = prev.findIndex((item) => item.id === wordId);
          const next = prev.filter((item) => item.id !== wordId);

          setCardIndex((currentIndex) => {
            if (next.length === 0) return 0;
            if (deletedIndex < 0) return Math.min(currentIndex, next.length - 1);
            if (deletedIndex < currentIndex) return currentIndex - 1;
            if (currentIndex >= next.length) return next.length - 1;
            return currentIndex;
          });

          return next;
        });

        updateProgress((prev) => {
          const next = { ...prev };
          delete next[wordId];
          return next;
        });
      } catch (error) {
        setDeleteError(
          error instanceof Error ? error.message : "単語の削除に失敗しました",
        );
      } finally {
        setDeletingWordId(null);
      }
    },
    [lineUserId, updateProgress],
  );

  if (items.length === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-6">
        <p className="text-center text-sm leading-relaxed text-gray-500">
          表示できる単語がありません。
          <br />
          LINE で英単語を送ると、あなた専用の単語帳に追加されます。
          <br />
          <span className="mt-2 block text-xs text-gray-400">
            ホーム画面に追加した場合は、LINEのウェルカムメッセージ内のリンクから開き直してください（URLに
            ?uid= が必要です）。
          </span>
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
          <div className="flex min-h-0 flex-1 flex-col">
            {deleteError ? (
              <div className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-2 text-center text-xs text-red-600">
                {deleteError}
              </div>
            ) : null}
            <VocabList
              items={items}
              progress={progress}
              onSelectWord={handleSelectWord}
              onResetProgress={handleResetProgress}
              onDeleteWord={handleDeleteWord}
              deletingWordId={deletingWordId}
            />
          </div>
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

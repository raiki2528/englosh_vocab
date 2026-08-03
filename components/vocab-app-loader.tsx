"use client";

import type { AppTab } from "@/components/bottom-nav";
import { VocabApp } from "@/components/vocab-app";
import { VocabAppSkeleton } from "@/components/vocab-app-skeleton";
import type { VocabularyItem } from "@/lib/vocabulary";
import { useEffect, useState } from "react";

type LoadState = "loading" | "ready" | "error";

type VocabAppLoaderProps = {
  lineUserId: string;
  initialTab?: AppTab;
  initialQuizRange?: "week";
};

export function VocabAppLoader({
  lineUserId,
  initialTab,
  initialQuizRange,
}: VocabAppLoaderProps) {
  const [state, setState] = useState<LoadState>("loading");
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");
      setErrorMessage("");

      try {
        const params = new URLSearchParams({ uid: lineUserId });
        const response = await fetch(`/api/vocabulary?${params.toString()}`, {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as {
          items?: VocabularyItem[];
          error?: string;
        } | null;

        if (cancelled) return;

        if (!response.ok || !data?.items) {
          setErrorMessage(data?.error ?? "単語データの取得に失敗しました");
          setState("error");
          return;
        }

        setItems(data.items);
        setState("ready");
      } catch {
        if (!cancelled) {
          setErrorMessage("単語データの取得に失敗しました");
          setState("error");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [lineUserId]);

  if (state === "loading") {
    return <VocabAppSkeleton />;
  }

  if (state === "error") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-6">
        <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-900">
            データを読み込めませんでした
          </p>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <VocabApp
      items={items}
      lineUserId={lineUserId}
      initialTab={initialTab}
      initialQuizRange={initialQuizRange}
    />
  );
}

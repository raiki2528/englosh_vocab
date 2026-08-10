"use client";

import {
  getSpeechSupport,
  speakEnglishWord,
} from "@/lib/speech-synthesis";
import { Volume2 } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

export function PronunciationButton({ word }: { word: string }) {
  const subscribe = useCallback(() => () => {}, []);
  const isSupported = useSyncExternalStore(
    subscribe,
    () => getSpeechSupport() === "supported",
    () => true,
  );

  return (
    <span className="inline-flex shrink-0 flex-col items-center">
      <button
        type="button"
        aria-label={`${word} の発音を聴く`}
        title={
          isSupported
            ? "発音を聴く"
            : "発音はiOSでの利用を想定しています。他の端末では利用できない場合があります。"
        }
        disabled={!isSupported}
        onClick={(event) => {
          event.stopPropagation();
          speakEnglishWord(word);
        }}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition active:scale-95 enabled:hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-35"
      >
        <Volume2 className="h-5 w-5" aria-hidden />
      </button>
      {!isSupported ? (
        <span className="mt-1 whitespace-nowrap text-[9px] font-normal text-gray-400">
          iOS向け
        </span>
      ) : null}
    </span>
  );
}

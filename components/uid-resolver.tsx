"use client";

import { loadLineUserId } from "@/lib/line-user-id";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function MissingUidMessage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-6">
      <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium leading-relaxed text-gray-900">
          エラー：LINEのメッセージに記載された専用URLからアクセスしてください
        </p>
        <p className="mt-3 text-xs leading-relaxed text-gray-500">
          初回はLINEのリンクから Safari で開いてください。一度開いたあとは、ホーム画面のアイコンから開けます。
        </p>
      </div>
    </div>
  );
}

export function UidResolver() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "missing">("checking");

  useEffect(() => {
    const stored = loadLineUserId();
    if (stored) {
      router.replace(`/?uid=${encodeURIComponent(stored)}`);
      return;
    }
    const timeout = window.setTimeout(() => setStatus("missing"), 0);
    return () => window.clearTimeout(timeout);
  }, [router]);

  if (status === "checking") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-6">
        <p className="text-sm text-gray-500">読み込み中…</p>
      </div>
    );
  }

  return <MissingUidMessage />;
}

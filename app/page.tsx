import { VocabApp } from "@/components/vocab-app";
import { fetchVocabulary } from "@/lib/vocabulary";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ uid?: string }>;
};

function MissingUidMessage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-6">
      <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium leading-relaxed text-gray-900">
          エラー：LINEのメッセージに記載された専用URLからアクセスしてください
        </p>
      </div>
    </div>
  );
}

export default async function Home({ searchParams }: HomeProps) {
  const { uid } = await searchParams;

  if (!uid?.trim()) {
    return <MissingUidMessage />;
  }

  const lineUserId = uid.trim();

  try {
    const items = await fetchVocabulary(lineUserId);
    return <VocabApp items={items} lineUserId={lineUserId} />;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "不明なエラーが発生しました。";

    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-6">
        <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-900">
            データを読み込めませんでした
          </p>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">{message}</p>
        </div>
      </div>
    );
  }
}

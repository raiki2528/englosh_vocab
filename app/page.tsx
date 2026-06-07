import { UidResolver } from "@/components/uid-resolver";
import { VocabApp } from "@/components/vocab-app";
import { LINE_USER_ID_COOKIE } from "@/lib/line-user-id";
import { fetchVocabulary } from "@/lib/vocabulary";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ uid?: string }>;
};

function normalizeUid(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']+|["']+$/g, "");
}

export default async function Home({ searchParams }: HomeProps) {
  const { uid } = await searchParams;
  const cookieStore = await cookies();
  const cookieUid = cookieStore.get(LINE_USER_ID_COOKIE)?.value;

  const lineUserId = normalizeUid(uid) || normalizeUid(cookieUid);

  if (!lineUserId) {
    return <UidResolver />;
  }

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

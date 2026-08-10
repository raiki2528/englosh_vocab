import { UidResolver } from "@/components/uid-resolver";
import { VocabAppLoader } from "@/components/vocab-app-loader";
import type { AppTab } from "@/components/bottom-nav";
import { LINE_USER_ID_COOKIE } from "@/lib/line-user-id";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ uid?: string; tab?: string; range?: string }>;
};

function normalizeUid(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']+|["']+$/g, "");
}

function parseInitialTab(value: string | undefined): AppTab | undefined {
  if (
    value === "list" ||
    value === "card" ||
    value === "quiz" ||
    value === "friends"
  ) {
    return value;
  }
  return undefined;
}

function parseInitialQuizRange(
  value: string | undefined,
): "week" | undefined {
  return value === "week" ? "week" : undefined;
}

export default async function Home({ searchParams }: HomeProps) {
  const { uid, tab, range } = await searchParams;
  const cookieStore = await cookies();
  const cookieUid = cookieStore.get(LINE_USER_ID_COOKIE)?.value;

  const lineUserId = normalizeUid(uid) || normalizeUid(cookieUid);

  if (!lineUserId) {
    return <UidResolver />;
  }

  return (
    <VocabAppLoader
      lineUserId={lineUserId}
      initialTab={parseInitialTab(tab)}
      initialQuizRange={parseInitialQuizRange(range)}
    />
  );
}

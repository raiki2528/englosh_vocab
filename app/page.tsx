import { UidResolver } from "@/components/uid-resolver";
import { VocabAppLoader } from "@/components/vocab-app-loader";
import { LINE_USER_ID_COOKIE } from "@/lib/line-user-id";
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

  return <VocabAppLoader lineUserId={lineUserId} />;
}

import { LINE_USER_ID_COOKIE } from "@/lib/line-user-id";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchVocabulary, normalizeLineUserId } from "@/lib/vocabulary";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const VOCAB_TABLE =
  process.env.SUPABASE_VOCAB_TABLE?.trim() || "english_vocab";

async function resolveLineUserId(
  request: NextRequest,
): Promise<string | null> {
  const fromQuery = request.nextUrl.searchParams.get("uid");
  if (fromQuery?.trim()) {
    return normalizeLineUserId(fromQuery);
  }

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LINE_USER_ID_COOKIE)?.value;
  if (fromCookie?.trim()) {
    return normalizeLineUserId(fromCookie);
  }

  return null;
}

export async function GET(request: NextRequest) {
  const lineUserId = await resolveLineUserId(request);

  if (!lineUserId) {
    return NextResponse.json({ error: "Missing uid" }, { status: 401 });
  }

  try {
    const items = await fetchVocabulary(lineUserId);
    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "単語データの取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")?.trim();
  const lineUserId = await resolveLineUserId(request);

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (!lineUserId) {
    return NextResponse.json({ error: "Missing uid" }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from(VOCAB_TABLE)
    .delete()
    .eq("id", id)
    .eq("line_user_id", lineUserId)
    .select("id");

  if (error) {
    console.error("Failed to delete vocabulary:", error);
    return NextResponse.json(
      { error: "削除に失敗しました" },
      { status: 500 },
    );
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "単語が見つかりません" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}

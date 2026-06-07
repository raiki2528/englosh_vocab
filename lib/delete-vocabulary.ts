export async function deleteVocabularyItem(
  id: string,
  lineUserId: string,
): Promise<void> {
  const params = new URLSearchParams({
    id,
    uid: lineUserId,
  });

  const response = await fetch(`/api/vocabulary?${params.toString()}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "単語の削除に失敗しました");
  }
}

export const LINE_USER_ID_COOKIE = "english_vocab_uid";
const LINE_USER_ID_STORAGE_KEY = "english-vocab-line-user-id";

export function saveLineUserId(lineUserId: string): void {
  if (typeof window === "undefined") return;
  const normalized = lineUserId.trim();
  if (!normalized) return;
  localStorage.setItem(LINE_USER_ID_STORAGE_KEY, normalized);
}

export function loadLineUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LINE_USER_ID_STORAGE_KEY);
    if (!raw?.trim()) return null;
    return raw.trim();
  } catch {
    return null;
  }
}

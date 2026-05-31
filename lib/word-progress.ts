export type WordProgress = {
  mistakeCount: number;
  consecutiveCorrect: number;
};

export type ProgressStore = Record<string, WordProgress>;

const STORAGE_KEY_PREFIX = "english-vocab-progress";
const RESET_STREAK = 3;

function storageKey(lineUserId: string): string {
  return `${STORAGE_KEY_PREFIX}-${lineUserId}`;
}

function defaultProgress(): WordProgress {
  return { mistakeCount: 0, consecutiveCorrect: 0 };
}

export function loadProgress(lineUserId: string): ProgressStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey(lineUserId));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as ProgressStore;
  } catch {
    return {};
  }
}

export function saveProgress(store: ProgressStore, lineUserId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(lineUserId), JSON.stringify(store));
}

export function getWordProgress(
  store: ProgressStore,
  wordId: string,
): WordProgress {
  return store[wordId] ?? defaultProgress();
}

export function getMistakeCount(store: ProgressStore, wordId: string): number {
  return getWordProgress(store, wordId).mistakeCount;
}

export function recordQuizCorrect(
  store: ProgressStore,
  wordId: string,
): ProgressStore {
  const current = getWordProgress(store, wordId);
  const consecutiveCorrect = current.consecutiveCorrect + 1;

  if (consecutiveCorrect >= RESET_STREAK) {
    return {
      ...store,
      [wordId]: { mistakeCount: 0, consecutiveCorrect: 0 },
    };
  }

  return {
    ...store,
    [wordId]: {
      mistakeCount: current.mistakeCount,
      consecutiveCorrect,
    },
  };
}

export function recordQuizWrong(
  store: ProgressStore,
  wordId: string,
): ProgressStore {
  const current = getWordProgress(store, wordId);
  return {
    ...store,
    [wordId]: {
      mistakeCount: current.mistakeCount + 1,
      consecutiveCorrect: 0,
    },
  };
}

export function resetWordProgress(
  store: ProgressStore,
  wordId: string,
): ProgressStore {
  return {
    ...store,
    [wordId]: defaultProgress(),
  };
}

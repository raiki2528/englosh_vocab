const DEFAULT_APP_URL = "https://englosh-vocab.vercel.app";

export function getAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_URL;
  const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, "");
}

export function buildVocabAppUrl(
  lineUserId: string,
  options?: { tab?: "quiz" | "friends"; range?: "week" },
): string {
  const params = new URLSearchParams({ uid: lineUserId });
  if (options?.tab) {
    params.set("tab", options.tab);
  }
  if (options?.range === "week") {
    params.set("range", "week");
  }
  return `${getAppBaseUrl()}/?${params.toString()}`;
}

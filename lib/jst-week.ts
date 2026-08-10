const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type JstWeek = {
  start: string;
  end: string;
};

function formatJstDate(timestamp: number): string {
  return new Date(timestamp + JST_OFFSET_MS).toISOString().slice(0, 10);
}

export function getJstWeek(reference = new Date()): JstWeek {
  if (Number.isNaN(reference.getTime())) {
    throw new Error("Invalid reference date");
  }

  const jst = new Date(reference.getTime() + JST_OFFSET_MS);
  const dayFromMonday = (jst.getUTCDay() + 6) % 7;
  const start =
    Date.UTC(
      jst.getUTCFullYear(),
      jst.getUTCMonth(),
      jst.getUTCDate() - dayFromMonday,
    ) - JST_OFFSET_MS;

  return {
    start: formatJstDate(start),
    end: formatJstDate(start + WEEK_MS - 1),
  };
}

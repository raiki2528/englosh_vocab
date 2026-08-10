import { buildVocabAppUrl } from "@/lib/app-url";

export type RankingMessageEntry = {
  displayName: string;
  rank: number;
  weeklyCount: number;
  weeklyWordTarget: number;
};

export function buildWeeklyRankingMessage(
  lineUserId: string,
  entries: RankingMessageEntry[],
  ownEntry: RankingMessageEntry,
): string {
  const winners = entries.filter((entry) => entry.rank === 1);
  const winnerText = winners.length
    ? winners
        .map((winner) => `${winner.displayName}さん（${winner.weeklyCount}語）`)
        .join("、")
    : "該当者なし";
  const achievementRate =
    ownEntry.weeklyWordTarget > 0
      ? Math.round(
          (ownEntry.weeklyCount / ownEntry.weeklyWordTarget) * 100,
        )
      : 0;

  return `先週の英単語ランキングが決まりました！

1位：${winnerText}

あなたは ${ownEntry.rank}位・${ownEntry.weeklyCount}語
目標達成率：${achievementRate}%

今週も一緒に続けよう！
ランキングを見る：
${buildVocabAppUrl(lineUserId, { tab: "friends" })}`;
}

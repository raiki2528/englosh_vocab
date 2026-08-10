"use client";

import { MemberAvatar } from "@/components/member-avatar";
import { ProfileForm } from "@/components/profile-form";
import type {
  FriendsDashboard,
  LeaderboardEntry,
  MemberProfileDetail,
} from "@/lib/friends-types";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  RefreshCw,
  Trophy,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type View =
  | { kind: "dashboard" }
  | { kind: "edit" }
  | { kind: "member"; publicId: string };

export function FriendsTab({ lineUserId }: { lineUserId: string }) {
  const [dashboard, setDashboard] = useState<FriendsDashboard | null>(null);
  const [view, setView] = useState<View>({ kind: "dashboard" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ uid: lineUserId });
      const response = await fetch(`/api/friends/dashboard?${params}`, {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | (FriendsDashboard & { error?: string })
        | null;
      if (!response.ok || !data) {
        throw new Error(data?.error ?? "友達データを読み込めませんでした。");
      }
      setDashboard(data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "友達データを読み込めませんでした。",
      );
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [lineUserId]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadDashboard(true);
      }
    }, 30_000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void loadDashboard(true);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadDashboard]);

  if (view.kind === "edit") {
    return (
      <ProfileForm
        lineUserId={lineUserId}
        profile={dashboard?.me.profile ?? null}
        onBack={() => setView({ kind: "dashboard" })}
        onSaved={() => {
          setView({ kind: "dashboard" });
          void loadDashboard();
        }}
      />
    );
  }

  if (view.kind === "member") {
    return (
      <MemberProfilePanel
        publicId={view.publicId}
        isMe={dashboard?.me.profile?.publicId === view.publicId}
        onBack={() => setView({ kind: "dashboard" })}
        onEdit={() => setView({ kind: "edit" })}
      />
    );
  }

  if (loading) return <FriendsLoading />;

  if (error && !dashboard) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <RefreshCw className="h-4 w-4" /> 再読み込み
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard?.me.profile) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-sm rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <UserPlus className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-xl font-semibold text-gray-900">
            友達と一緒に続けよう
          </h1>
          <p className="mt-3 text-sm leading-7 text-gray-500">
            プロフィールを作ると、今週の目標とみんなのランキングを確認できます。
          </p>
          <button
            type="button"
            onClick={() => setView({ kind: "edit" })}
            className="mt-7 w-full rounded-2xl bg-gray-900 py-4 text-sm font-medium text-white"
          >
            プロフィールを作成
          </button>
        </div>
      </div>
    );
  }

  const ownEntry = dashboard.leaderboard.find((entry) => entry.isMe);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-gray-50">
      <header className="shrink-0 border-b border-gray-200 bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">友達</h1>
            <p className="mt-1 text-xs text-gray-400">
              {formatWeek(dashboard.week.start, dashboard.week.end)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView({ kind: "edit" })}
            className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600"
          >
            <Pencil className="h-3.5 w-3.5" /> 編集
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
        <div className="mx-auto max-w-sm space-y-4">
          {error ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
              更新に失敗しました。前回の情報を表示しています。
            </p>
          ) : null}
          <WeeklyProgress
            count={dashboard.me.weeklyCount}
            target={dashboard.me.profile.weeklyWordTarget}
            rate={dashboard.me.achievementRate ?? 0}
            rank={dashboard.me.rank}
          />
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">今週のランキング</h2>
                <p className="mt-1 text-xs text-gray-400">
                  重複を除いたストック数
                </p>
              </div>
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            {dashboard.leaderboard.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {dashboard.leaderboard.map((entry) => (
                  <LeaderboardRow
                    key={entry.publicId}
                    entry={entry}
                    onClick={() =>
                      setView({ kind: "member", publicId: entry.publicId })
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-gray-400">
                参加者はまだいません
              </p>
            )}
          </section>
        </div>
      </div>

      {ownEntry ? (
        <button
          type="button"
          onClick={() => setView({ kind: "member", publicId: ownEntry.publicId })}
          className="absolute inset-x-4 bottom-3 flex items-center justify-between rounded-2xl border border-blue-100 bg-white/95 px-4 py-3 text-left shadow-lg backdrop-blur"
        >
          <span className="text-xs text-gray-400">あなたの順位</span>
          <span className="font-semibold text-gray-900">
            {ownEntry.rank}位・{ownEntry.weeklyCount}語
          </span>
        </button>
      ) : null}
    </div>
  );
}

function WeeklyProgress({
  count,
  target,
  rate,
  rank,
}: {
  count: number;
  target: number;
  rate: number;
  rank: number | null;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400">今週の進捗</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {count}
            <span className="ml-1 text-sm font-normal text-gray-400">
              / {target}語
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold text-blue-600">{rate}%</p>
          <p className="mt-1 text-xs text-gray-400">
            {rank ? `${rank}位` : "集計中"}
          </p>
        </div>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-500 transition-[width] duration-500"
          style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-gray-400">
        {count >= target
          ? `目標達成！ ${count - target}語上回っています`
          : `あと${target - count}語で今週の目標達成`}
      </p>
    </section>
  );
}

function LeaderboardRow({
  entry,
  onClick,
}: {
  entry: LeaderboardEntry;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left ${
        entry.isMe ? "bg-blue-50/70" : "bg-white"
      }`}
    >
      <span className="w-7 shrink-0 text-center text-sm font-bold text-gray-500">
        {entry.rank}
      </span>
      <MemberAvatar name={entry.displayName} url={entry.avatarUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">
          {entry.displayName}
          {entry.isMe ? (
            <span className="ml-2 text-xs font-normal text-blue-600">あなた</span>
          ) : null}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          目標 {entry.weeklyWordTarget}語・達成率 {entry.achievementRate}%
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold text-gray-900">
        {entry.weeklyCount}語
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
    </button>
  );
}

function MemberProfilePanel({
  publicId,
  isMe,
  onBack,
  onEdit,
}: {
  publicId: string;
  isMe: boolean;
  onBack: () => void;
  onEdit: () => void;
}) {
  const [detail, setDetail] = useState<MemberProfileDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/friends/profile/${encodeURIComponent(publicId)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => null)) as
          | (MemberProfileDetail & { error?: string })
          | null;
        if (!response.ok || !data?.profile) {
          throw new Error(data?.error ?? "プロフィールを読み込めませんでした。");
        }
        return data;
      })
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "プロフィールを読み込めませんでした。",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [publicId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="戻る"
          className="rounded-full p-2 text-gray-500"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="font-semibold text-gray-900">プロフィール</h1>
        {isMe ? (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full p-2 text-gray-500"
            aria-label="プロフィールを編集"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : (
          <span className="w-9" />
        )}
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {error ? (
          <p className="rounded-2xl bg-white p-5 text-center text-sm text-red-600">
            {error}
          </p>
        ) : !detail ? (
          <FriendsLoading />
        ) : (
          <div className="mx-auto max-w-sm space-y-4">
            <section className="rounded-3xl bg-white p-6 text-center shadow-sm">
              <div className="flex justify-center">
                <MemberAvatar
                  name={detail.profile.displayName}
                  url={detail.profile.avatarUrl}
                  size="lg"
                />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                {detail.profile.displayName}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                週の目標 {detail.profile.weeklyWordTarget}語
              </p>
            </section>
            <StockedWordsSection
              title={`今週ストックした単語（${formatWeek(detail.week.start, detail.week.end)}）`}
              words={detail.weeklyWords}
              emptyLabel="今週はまだ単語がありません"
            />
            <StockedWordsSection
              title={`これまでにストックした単語（${detail.allWords.length}語）`}
              words={detail.allWords}
              emptyLabel="まだ単語がありません"
            />
            <ProfileSection title="英語を勉強する目的">
              <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                {detail.profile.purpose}
              </p>
            </ProfileSection>
            <ProfileSection title="英語資格">
              {detail.profile.qualifications.length ? (
                <div className="flex flex-wrap gap-2">
                  {detail.profile.qualifications.map((item, index) => (
                    <span
                      key={`${item.type}-${index}`}
                      className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
                    >
                      {item.type} {item.value}
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyProfileValue />
              )}
            </ProfileSection>
            <ProfileSection title="海外歴">
              {detail.profile.overseasHistory.length ? (
                <div className="space-y-2">
                  {detail.profile.overseasHistory.map((item, index) => (
                    <p key={`${item.country}-${index}`} className="text-sm text-gray-700">
                      {item.country}・{item.duration}
                    </p>
                  ))}
                </div>
              ) : (
                <EmptyProfileValue />
              )}
            </ProfileSection>
          </div>
        )}
      </div>
    </div>
  );
}

function StockedWordsSection({
  title,
  words,
  emptyLabel,
}: {
  title: string;
  words: MemberProfileDetail["weeklyWords"];
  emptyLabel: string;
}) {
  return (
    <ProfileSection title={title}>
      {words.length ? (
        <ul className="space-y-3">
          {words.map((item) => (
            <li
              key={`${item.word}-${item.createdAt}`}
              className="rounded-xl bg-gray-50 px-4 py-3"
            >
              <p className="font-medium text-gray-900">{item.word}</p>
              {item.meaning ? (
                <p className="mt-1 text-sm leading-6 text-gray-500">
                  {item.meaning}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400">{emptyLabel}</p>
      )}
    </ProfileSection>
  );
}

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-xs font-medium text-gray-400">{title}</h3>
      {children}
    </section>
  );
}

function EmptyProfileValue() {
  return <p className="text-sm text-gray-400">登録なし</p>;
}

function FriendsLoading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <RefreshCw className="h-6 w-6 animate-spin text-gray-300" aria-label="読み込み中" />
    </div>
  );
}

function formatWeek(start: string, end: string): string {
  const format = (value: string) => {
    const [, month = "", day = ""] = value.split("-");
    return `${Number(month)}/${Number(day)}`;
  };
  return `${format(start)}〜${format(end)}（月〜日）`;
}

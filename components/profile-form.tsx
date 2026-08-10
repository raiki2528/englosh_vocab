"use client";

import { MemberAvatar } from "@/components/member-avatar";
import type {
  EnglishQualification,
  MemberProfile,
  OverseasHistory,
} from "@/lib/friends-types";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

const QUALIFICATION_TYPES: EnglishQualification["type"][] = [
  "TOEIC",
  "英検",
  "IELTS",
  "TOEFL",
  "その他",
];

type ProfileFormProps = {
  lineUserId: string;
  profile: MemberProfile | null;
  onBack: () => void;
  onSaved: () => void;
};

export function ProfileForm({
  lineUserId,
  profile,
  onBack,
  onSaved,
}: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [purpose, setPurpose] = useState(profile?.purpose ?? "");
  const [weeklyWordTarget, setWeeklyWordTarget] = useState(
    String(profile?.weeklyWordTarget ?? 5),
  );
  const [qualifications, setQualifications] = useState<
    EnglishQualification[]
  >(profile?.qualifications ?? []);
  const [overseasHistory, setOverseasHistory] = useState<OverseasHistory[]>(
    profile?.overseasHistory ?? [],
  );
  const [avatar, setAvatar] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(Boolean(profile));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const avatarPreview = useMemo(
    () => (avatar ? URL.createObjectURL(avatar) : profile?.avatarUrl ?? null),
    [avatar, profile?.avatarUrl],
  );

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const target = Number(weeklyWordTarget);
    if (!displayName.trim() || !purpose.trim() || !Number.isInteger(target) || target < 1) {
      setError("ニックネーム、学習目的、1以上の週目標を入力してください。");
      return;
    }
    if (!profile && !agreed) {
      setError("公開プロフィールとランキング参加への同意が必要です。");
      return;
    }
    if (avatar && avatar.size > 5 * 1024 * 1024) {
      setError("写真は5MB以下にしてください。");
      return;
    }

    setSaving(true);
    try {
      const params = new URLSearchParams({ uid: lineUserId });
      const response = await fetch(`/api/friends/profile?${params}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          purpose: purpose.trim(),
          weeklyWordTarget: target,
          qualifications: qualifications.filter(
            (item) => item.value.trim().length > 0,
          ),
          overseasHistory: overseasHistory.filter(
            (item) => item.country.trim() && item.duration.trim(),
          ),
          publicConsent: profile ? undefined : agreed,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(data?.error ?? "プロフィールを保存できませんでした。");
      }

      if (avatar) {
        const formData = new FormData();
        formData.set("avatar", avatar);
        const uploadResponse = await fetch(
          `/api/friends/profile/avatar?${params}`,
          { method: "POST", body: formData },
        );
        const uploadData = (await uploadResponse.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (!uploadResponse.ok) {
          throw new Error(uploadData?.error ?? "写真を保存できませんでした。");
        }
      }

      onSaved();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "プロフィールを保存できませんでした。",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      <header className="flex items-center border-b border-gray-200 bg-white px-3 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="戻る"
          className="rounded-full p-2 text-gray-500"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="ml-2 font-semibold text-gray-900">
          {profile ? "プロフィール編集" : "プロフィール作成"}
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto max-w-sm space-y-6">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <MemberAvatar
                name={displayName || "あなた"}
                url={avatarPreview}
                size="lg"
              />
              <label className="text-sm font-medium text-gray-700">
                写真を選ぶ
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setAvatar(event.target.files?.[0] ?? null)}
                  className="mt-2 block w-full text-xs text-gray-500 file:mr-3 file:rounded-full file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-medium"
                />
                <span className="mt-1 block text-xs font-normal text-gray-400">
                  任意・JPEG/PNG/WebP・最大5MB
                </span>
              </label>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
            <TextField
              label="ニックネーム（必須）"
              value={displayName}
              onChange={setDisplayName}
              maxLength={30}
            />
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                英語を勉強する目的（必須）
              </span>
              <textarea
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                maxLength={200}
                rows={4}
                className="mt-2 w-full resize-none rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none ring-1 ring-gray-200 focus:ring-gray-400"
                placeholder="仕事で海外の同僚と自然に話せるようになりたい"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                1週間のストック目標（必須）
              </span>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={weeklyWordTarget}
                  onChange={(event) => setWeeklyWordTarget(event.target.value)}
                  className="w-28 rounded-xl bg-gray-50 px-3 py-3 text-sm outline-none ring-1 ring-gray-200 focus:ring-gray-400"
                />
                <span className="text-sm text-gray-500">語 / 週</span>
              </div>
            </label>
          </section>

          <RepeatingQualifications
            items={qualifications}
            onChange={setQualifications}
          />
          <RepeatingOverseas items={overseasHistory} onChange={setOverseasHistory} />

          {!profile ? (
            <label className="flex gap-3 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0"
              />
              <span>
                プロフィールが参加者に公開され、週間ランキングと月曜のLINE通知に参加することに同意します。参加後は非公開にできません。
              </span>
            </label>
          ) : null}

          {error ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-gray-900 py-4 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "保存中…" : profile ? "変更を保存" : "参加してプロフィールを公開"}
          </button>
        </div>
      </form>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none ring-1 ring-gray-200 focus:ring-gray-400"
      />
    </label>
  );
}

function SectionTitle({
  children,
  onAdd,
}: {
  children: React.ReactNode;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-gray-900">{children}</h2>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1 text-xs font-medium text-gray-500"
      >
        <Plus className="h-4 w-4" /> 追加
      </button>
    </div>
  );
}

function RepeatingQualifications({
  items,
  onChange,
}: {
  items: EnglishQualification[];
  onChange: (items: EnglishQualification[]) => void;
}) {
  return (
    <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
      <SectionTitle
        onAdd={() => onChange([...items, { type: "TOEIC", value: "" }])}
      >
        英語資格（任意）
      </SectionTitle>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400">TOEICや英検などを追加できます</p>
      ) : null}
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <select
            value={item.type}
            onChange={(event) => {
              const next = [...items];
              next[index] = {
                ...item,
                type: event.target.value as EnglishQualification["type"],
              };
              onChange(next);
            }}
            className="w-28 rounded-xl bg-gray-50 px-2 text-sm ring-1 ring-gray-200"
          >
            {QUALIFICATION_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          <input
            value={item.value}
            onChange={(event) => {
              const next = [...items];
              next[index] = { ...item, value: event.target.value };
              onChange(next);
            }}
            placeholder="850 / 準1級"
            className="min-w-0 flex-1 rounded-xl bg-gray-50 px-3 py-3 text-sm ring-1 ring-gray-200"
          />
          <RemoveButton onClick={() => onChange(items.filter((_, i) => i !== index))} />
        </div>
      ))}
    </section>
  );
}

function RepeatingOverseas({
  items,
  onChange,
}: {
  items: OverseasHistory[];
  onChange: (items: OverseasHistory[]) => void;
}) {
  return (
    <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
      <SectionTitle
        onAdd={() => onChange([...items, { country: "", duration: "" }])}
      >
        海外歴（任意）
      </SectionTitle>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400">国と滞在期間を追加できます</p>
      ) : null}
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <input
            value={item.country}
            onChange={(event) => {
              const next = [...items];
              next[index] = { ...item, country: event.target.value };
              onChange(next);
            }}
            placeholder="アメリカ"
            className="min-w-0 flex-1 rounded-xl bg-gray-50 px-3 py-3 text-sm ring-1 ring-gray-200"
          />
          <input
            value={item.duration}
            onChange={(event) => {
              const next = [...items];
              next[index] = { ...item, duration: event.target.value };
              onChange(next);
            }}
            placeholder="2年"
            className="w-24 rounded-xl bg-gray-50 px-3 py-3 text-sm ring-1 ring-gray-200"
          />
          <RemoveButton onClick={() => onChange(items.filter((_, i) => i !== index))} />
        </div>
      ))}
    </section>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="削除"
      className="rounded-xl p-2 text-gray-400"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

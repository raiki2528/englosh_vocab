"use client";

import { ClipboardCheck, Layers, List } from "lucide-react";

export type AppTab = "list" | "card" | "quiz";

type BottomNavProps = {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
};

const TABS: { id: AppTab; label: string; icon: typeof List }[] = [
  { id: "list", label: "一覧", icon: List },
  { id: "card", label: "カード", icon: Layers },
  { id: "quiz", label: "テスト", icon: ClipboardCheck },
];

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="メインナビゲーション"
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors ${
                isActive
                  ? "font-medium text-gray-900"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? "text-gray-900" : "text-gray-400"}`}
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

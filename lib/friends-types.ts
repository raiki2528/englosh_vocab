export type EnglishQualification = {
  type: "TOEIC" | "英検" | "IELTS" | "TOEFL" | "その他";
  value: string;
};

export type OverseasHistory = {
  country: string;
  duration: string;
};

export type StockedWord = {
  word: string;
  meaning: string;
  createdAt: string;
};

export type MemberProfileDetail = {
  profile: MemberProfile;
  week: {
    start: string;
    end: string;
  };
  weeklyWords: StockedWord[];
  allWords: StockedWord[];
};

export type MemberProfile = {
  publicId: string;
  displayName: string;
  purpose: string;
  weeklyWordTarget: number;
  avatarUrl: string | null;
  qualifications: EnglishQualification[];
  overseasHistory: OverseasHistory[];
};

export type LeaderboardEntry = {
  publicId: string;
  displayName: string;
  avatarUrl: string | null;
  weeklyCount: number;
  weeklyWordTarget: number;
  achievementRate: number;
  rank: number;
  isMe: boolean;
};

export type FriendsDashboard = {
  week: {
    start: string;
    end: string;
  };
  me: {
    profile: MemberProfile | null;
    weeklyCount: number;
    achievementRate: number | null;
    rank: number | null;
  };
  leaderboard: LeaderboardEntry[];
};

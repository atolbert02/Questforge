export interface TrackerConfig {
  projectTitle: string;
  tagline: string;
  characterName: string;
  duration: string;
  theme: {
    accent: string;
    secondary: string;
  };
  levels: Level[];
  phases: Phase[];
  skills: Skill[];
  quests: Quest[];
  achievements: Achievement[];
}

export interface Level {
  min: number;
  title: string;
}

export interface Phase {
  id: number;
  label: string;
  dates: string;
  color: string;
  tagline: string;
}

export interface Skill {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export type QuestType = "learn" | "build" | "create" | "research" | "practice" | "document";

export interface Quest {
  id: string;
  phase: number;
  type: QuestType;
  boss: boolean;
  name: string;
  desc: string;
  xp: number;
  skills: Record<string, number>;
}

export type AchievementConditionType =
  | "quest"
  | "boss_count"
  | "phase_clear"
  | "quest_count"
  | "first_quest";

export interface Achievement {
  id: string;
  icon: string;
  name: string;
  desc: string;
  condition: {
    type: AchievementConditionType;
    value: string | number;
  };
}

export interface TrackerProgress {
  completed: string[];
  streak: number;
  lastDate: string;
}

export interface StoredTracker {
  config: TrackerConfig;
  progress: TrackerProgress;
  createdAt: string;
}

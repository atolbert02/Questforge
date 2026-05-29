import { Achievement, TrackerConfig, TrackerProgress } from "./types";

export function evaluateAchievements(
  achievements: Achievement[],
  quests: TrackerConfig["quests"],
  progress: TrackerProgress
): Set<string> {
  const completedSet = new Set(progress.completed);
  const bossesCompleted = quests.filter((q) => q.boss && completedSet.has(q.id)).length;
  const totalCompleted = progress.completed.length;

  const unlocked = new Set<string>();

  for (const ach of achievements) {
    const { type, value } = ach.condition;

    if (type === "quest" && completedSet.has(value as string)) unlocked.add(ach.id);
    else if (type === "first_quest" && totalCompleted >= 1) unlocked.add(ach.id);
    else if (type === "boss_count" && bossesCompleted >= (value as number)) unlocked.add(ach.id);
    else if (type === "quest_count" && totalCompleted >= (value as number)) unlocked.add(ach.id);
    else if (type === "phase_clear") {
      const phaseId = value as number;
      const phaseQuests = quests.filter((q) => q.phase === phaseId);
      if (phaseQuests.length > 0 && phaseQuests.every((q) => completedSet.has(q.id))) {
        unlocked.add(ach.id);
      }
    }
  }

  return unlocked;
}

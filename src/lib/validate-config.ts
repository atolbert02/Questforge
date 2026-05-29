import { TrackerConfig } from "./types";

export function validateConfig(obj: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const c = obj as TrackerConfig;

  if (!c?.projectTitle) errors.push("Missing projectTitle");
  if (!Array.isArray(c?.phases) || c.phases.length < 2) errors.push("Need at least 2 phases");
  if (!Array.isArray(c?.quests) || c.quests.length < 5) errors.push("Need at least 5 quests");
  if (!Array.isArray(c?.skills) || c.skills.length < 1) errors.push("Need at least 1 skill");
  if (!Array.isArray(c?.levels) || c.levels.length < 3) errors.push("Need at least 3 levels");
  if (!Array.isArray(c?.achievements) || c.achievements.length < 3)
    errors.push("Need at least 3 achievements");

  const ids = c?.quests?.map((q) => q.id) ?? [];
  if (new Set(ids).size !== ids.length) errors.push("Duplicate quest IDs");

  return { valid: errors.length === 0, errors };
}

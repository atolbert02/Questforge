import { NextRequest, NextResponse } from "next/server";
import { buildAchievementsPrompt, AchievementContext } from "@/lib/prompts-phased";
import { callClaude, parseJSON } from "@/lib/claude";
import { Achievement, AchievementConditionType } from "@/lib/types";

export const maxDuration = 60;

const VALID_CONDITIONS: AchievementConditionType[] = [
  "quest",
  "boss_count",
  "phase_clear",
  "quest_count",
  "first_quest",
];

export async function POST(req: NextRequest) {
  try {
    const ctx = (await req.json()) as AchievementContext;

    if (!Array.isArray(ctx.quests) || ctx.quests.length === 0 || !Array.isArray(ctx.phases)) {
      return NextResponse.json({ error: "Missing quest/phase context." }, { status: 400 });
    }

    const raw = await callClaude(buildAchievementsPrompt(ctx), 2500);
    const parsed = parseJSON<Achievement[]>(raw);

    if (!parsed.ok || !Array.isArray(parsed.data)) {
      console.error("Achievements parse failed:", parsed.ok ? "not an array" : parsed.raw.slice(0, 400));
      // Achievements are non-critical: return an empty set rather than failing the whole tracker.
      return NextResponse.json({ achievements: [] });
    }

    const questIds = new Set(ctx.quests.map((q) => q.id));
    const phaseIds = new Set(ctx.phases.map((p) => p.id));
    const bossCount = ctx.quests.filter((q) => q.boss).length;
    const questCount = ctx.quests.length;

    // Keep only achievements whose conditions reference things that actually exist.
    const valid: Achievement[] = [];
    let n = 1;
    for (const a of parsed.data) {
      const type = a?.condition?.type;
      const value = a?.condition?.value;
      if (!VALID_CONDITIONS.includes(type)) continue;

      let ok = false;
      if (type === "quest") ok = typeof value === "string" && questIds.has(value);
      else if (type === "phase_clear") ok = typeof value === "number" && phaseIds.has(value);
      else if (type === "boss_count") ok = typeof value === "number" && value >= 1 && value <= Math.max(bossCount, 1);
      else if (type === "quest_count") ok = typeof value === "number" && value >= 1 && value <= questCount;
      else if (type === "first_quest") ok = true;

      if (!ok) continue;

      valid.push({
        id: `a${String(n).padStart(2, "0")}`,
        icon: String(a.icon ?? "🏅"),
        name: String(a.name ?? `Achievement ${n}`),
        desc: String(a.desc ?? ""),
        condition: { type, value: type === "first_quest" ? 1 : value },
      });
      n++;
    }

    // Always guarantee a baseline so the Achievements tab is never empty.
    if (valid.length === 0) {
      valid.push({
        id: "a01",
        icon: "🌱",
        name: "First Steps",
        desc: "Complete your first quest.",
        condition: { type: "first_quest", value: 1 },
      });
    }

    return NextResponse.json({ achievements: valid });
  } catch (err) {
    console.error("Achievements error:", err);
    return NextResponse.json({ achievements: [] });
  }
}

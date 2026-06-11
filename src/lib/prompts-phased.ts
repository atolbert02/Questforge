// Prompt builders for PHASED tracker generation.
// Each builder produces a focused prompt that returns only a slice of the
// full TrackerConfig, so each API call stays well under the 60s limit.
//
// Pipeline:
//   1. buildSkeletonPrompt  -> projectTitle, tagline, characterName, duration,
//                              theme, levels, skills, phases (NO quests)
//   2. buildPhasePrompt     -> Quest[] for ONE phase (run in parallel per phase)
//   3. buildAchievementsPrompt -> Achievement[] (after quest IDs are known)

const MAX_TEXT = 80000;

function truncate(text: string): string {
  return text.length > MAX_TEXT
    ? text.slice(0, MAX_TEXT) + "\n\n[Document truncated for processing]"
    : text;
}

/* ------------------------------------------------------------------ */
/* 1. SKELETON                                                         */
/* ------------------------------------------------------------------ */

export function buildSkeletonPrompt(projectText: string, userName: string): string {
  const truncated = truncate(projectText);

  return `You are an expert project analyst and gamification designer. A user named "${userName}" has uploaded their long-term project plan. Analyze it and design the SKELETON of a personalized gamified tracker. You are NOT generating quests in this step — only the high-level structure.

=== PROJECT PLAN START ===
${truncated}
=== PROJECT PLAN END ===

Be creative and thematic: level titles should reflect the project domain, phases should map to the real arc of the project, and skills should match the actual disciplines involved.

STRICT RULES:
- Return ONLY a valid JSON object. No markdown fences, no explanation, no preamble. Just raw JSON.
- characterName must be "${userName}".
- Create 4–6 phases representing the major stages of the project, in chronological order.
- Phase IDs are 0-indexed integers (0,1,2,...). Use the theme accent as the Phase 0 color; every other phase color must be a visually distinct hex value.
- Create 4–6 skills relevant to the real disciplines in the project. Skill IDs must be camelCase with no spaces (e.g. "writingCraft", "musicalTheory").
- Create 8–10 levels with thematic titles, ordered by ascending "min" XP threshold starting at 0. Plan thresholds assuming the whole project is worth roughly 3000–6000 total XP.
- Do NOT include a "quests" or "achievements" field. Those are generated separately.

Return this exact JSON structure:
{
  "projectTitle": "string",
  "tagline": "string",
  "characterName": "${userName}",
  "duration": "string",
  "theme": { "accent": "#hexcolor", "secondary": "#hexcolor" },
  "levels": [ { "min": 0, "title": "string" } ],
  "phases": [ { "id": 0, "label": "PHASE NAME", "dates": "string", "color": "#hex", "tagline": "string" } ],
  "skills": [ { "id": "camelCaseId", "label": "Display Name", "icon": "emoji", "color": "#hex" } ]
}`;
}

/* ------------------------------------------------------------------ */
/* 2. ONE PHASE OF QUESTS                                              */
/* ------------------------------------------------------------------ */

export interface PhaseContext {
  phaseId: number;
  phaseLabel: string;
  phaseTagline: string;
  phaseDates: string;
  projectTitle: string;
  projectSummary: string; // tagline or short description for cohesion
  skillIds: string[];     // valid skill IDs the quests may award XP to
}

export function buildPhasePrompt(ctx: PhaseContext, projectText: string): string {
  const truncated = truncate(projectText);
  const skillList = ctx.skillIds.join(", ");

  return `You are a gamification designer generating the quests for ONE phase of a larger project tracker. Stay tightly focused on this single phase.

=== PROJECT PLAN (for reference) ===
${truncated}
=== END PROJECT PLAN ===

PROJECT: "${ctx.projectTitle}" — ${ctx.projectSummary}

THIS PHASE:
- Phase ID: ${ctx.phaseId}
- Label: ${ctx.phaseLabel}
- Goal: ${ctx.phaseTagline}
- Timeframe: ${ctx.phaseDates}

VALID SKILL IDS (you may ONLY award XP to these exact ids): ${skillList}

STRICT RULES:
- Return ONLY a valid JSON array of quest objects. No markdown fences, no explanation, no preamble. Just the raw JSON array, e.g. [ {...}, {...} ].
- Generate 5–10 quests that belong to THIS phase only.
- Every quest "phase" field MUST equal ${ctx.phaseId}.
- Quest IDs MUST follow the pattern "p${ctx.phaseId}q1", "p${ctx.phaseId}q2", "p${ctx.phaseId}q3", ... incrementing from 1, with no gaps.
- Mark 1–2 quests in this phase as "boss": true — the major milestone moments. All others "boss": false.
- "type" must be one of: "learn", "build", "create", "research", "practice", "document".
- XP scale: simple task 15–35, medium 40–90, hard 100–200, boss battle 150–300. Use a final-boss-sized 400–600 ONLY if this is clearly the project's final phase and the quest is its culminating achievement.
- "skills" is an object mapping one or more of the VALID SKILL IDS above to an XP number, e.g. { "${ctx.skillIds[0] ?? "skillId"}": 10 }. Never invent skill IDs that are not in the list.
- Quest descriptions must be specific and actionable (2–3 sentences), not generic filler.

Return a JSON array of objects with exactly this shape:
[
  {
    "id": "p${ctx.phaseId}q1",
    "phase": ${ctx.phaseId},
    "type": "learn",
    "boss": false,
    "name": "Quest Name",
    "desc": "Specific actionable description.",
    "xp": 30,
    "skills": { "skillId": 10 }
  }
]`;
}

/* ------------------------------------------------------------------ */
/* 3. ACHIEVEMENTS                                                     */
/* ------------------------------------------------------------------ */

export interface AchievementContext {
  projectTitle: string;
  // Compact view of quests so the model can reference real IDs.
  quests: { id: string; phase: number; boss: boolean; name: string }[];
  phases: { id: number; label: string }[];
}

export function buildAchievementsPrompt(ctx: AchievementContext): string {
  const bossIds = ctx.quests.filter((q) => q.boss).map((q) => q.id);
  const phaseList = ctx.phases.map((p) => `${p.id} (${p.label})`).join(", ");
  const questCount = ctx.quests.length;

  // Provide a compact roster so the model uses only real quest IDs.
  const roster = ctx.quests
    .map((q) => `${q.id}${q.boss ? "*" : ""} — ${q.name}`)
    .join("\n");

  return `You are designing the achievements for a gamified project tracker titled "${ctx.projectTitle}".

QUEST ROSTER (id* means it is a boss quest):
${roster}

PHASE IDS: ${phaseList}
TOTAL QUESTS: ${questCount}
BOSS QUEST IDS: ${bossIds.join(", ") || "(none)"}

STRICT RULES:
- Return ONLY a valid JSON array of achievement objects. No markdown fences, no explanation, no preamble. Just the raw JSON array.
- Create 10–15 achievements using a MIX of all five condition types described below.
- Each achievement "id" must be unique: "a01", "a02", ... "a15".
- "icon" is a single emoji. "name" is short and thematic. "desc" explains how to earn it.
- The "condition.value" rules by type:
  - "quest"      -> value is a quest ID string that EXISTS in the roster above (great for boss quests).
  - "boss_count" -> value is an integer between 1 and ${Math.max(bossIds.length, 1)}.
  - "quest_count"-> value is an integer between 1 and ${questCount}.
  - "phase_clear"-> value is a phase id integer that EXISTS in PHASE IDS above.
  - "first_quest"-> value is 1 (unlocks on completing any first quest).
- Never reference a quest ID or phase ID that is not listed above.
- Include at least one "first_quest", at least one "phase_clear" for the final phase, and at least one "quest" tied to the project's culminating boss quest.

Return a JSON array of objects with exactly this shape:
[
  {
    "id": "a01",
    "icon": "🔬",
    "name": "Achievement Name",
    "desc": "How to earn this.",
    "condition": { "type": "quest", "value": "p0q1" }
  }
]`;
}

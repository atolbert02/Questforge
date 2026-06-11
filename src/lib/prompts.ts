export function buildSkeletonPrompt(projectText: string, userName: string): string {
  const truncated =
    projectText.length > 15000
      ? projectText.slice(0, 15000) + "\n\n[Document truncated for processing]"
      : projectText;

  return `You are an expert gamification designer. Analyze this project plan and generate the structural scaffold for a gamified quest tracker.

Return ONLY raw JSON — no markdown fences, no explanation. Just the JSON object.

Required structure:
{
  "projectTitle": "string",
  "tagline": "string",
  "characterName": "${userName}",
  "duration": "string",
  "theme": { "accent": "#hexcolor", "secondary": "#hexcolor" },
  "levels": [ { "min": 0, "title": "string" } ],
  "phases": [ { "id": 0, "label": "PHASE NAME", "dates": "string", "color": "#hex", "tagline": "string" } ],
  "skills": [ { "id": "camelCaseId", "label": "Display Name", "icon": "emoji", "color": "#hex" } ]
}

Rules:
- characterName must be "${userName}"
- Create 4–5 phases representing major project stages
- Create 3–4 skills relevant to the project disciplines
- Create 7–9 levels with thematic titles matching the project domain
- Phase colors must be visually distinct hex values
- Skill IDs must be camelCase with no spaces

=== PROJECT PLAN ===
${truncated}`;
}

export function buildQuestsPrompt(
  projectText: string,
  phases: { id: number; label: string; tagline: string }[],
  skills: { id: string; label: string }[]
): string {
  const truncated =
    projectText.length > 10000
      ? projectText.slice(0, 10000) + "\n\n[Document truncated]"
      : projectText;

  return `You are an expert gamification designer. Generate all quests for a project tracker.

Return ONLY a raw JSON array of quest objects — no markdown, no explanation. Just the array.

Each quest:
{
  "id": "p{phaseId}q{index}",
  "phase": phaseId,
  "type": "learn" | "build" | "side",
  "boss": false,
  "name": "Quest Name",
  "desc": "Specific actionable description.",
  "xp": 30,
  "skills": { "skillId": 10 }
}

Rules:
- Quest IDs must follow the pattern "p{phaseId}q{index}" e.g. "p0q1", "p0q2", "p1q1"
- Create 5–7 quests per phase, marking exactly 1 as boss:true (the phase's major milestone)
- Boss quests use type "build" and higher XP (150–300)
- XP scale: simple 15–35, medium 40–90, hard 100–200, boss 150–300, final boss 400–600
- Use ONLY these skill IDs: ${skills.map((s) => `"${s.id}"`).join(", ")}
- Quest descriptions must be specific and actionable, not generic filler

Phases to generate quests for:
${phases.map((p) => `Phase ${p.id}: ${p.label} — ${p.tagline}`).join("\n")}

=== PROJECT PLAN ===
${truncated}`;
}

export function buildAchievementsPrompt(
  questIds: string[],
  bossQuestIds: string[],
  phaseCount: number
): string {
  return `Generate achievements for a gamified project tracker.

Return ONLY a raw JSON array of achievement objects — no markdown, no explanation. Just the array.

Each achievement:
{
  "id": "a01",
  "icon": "emoji",
  "name": "Achievement Name",
  "desc": "How to earn this.",
  "condition": { "type": "quest" | "boss_count" | "quest_count" | "phase_clear", "value": ... }
}

Condition rules:
- type "quest": value is a quest ID string (marks completing a specific quest)
- type "boss_count": value is a number (total boss quests completed)
- type "quest_count": value is a number (total quests completed)
- type "phase_clear": value is a phase id number (0-${phaseCount - 1})

Available quest IDs: ${questIds.join(", ")}
Boss quest IDs: ${bossQuestIds.join(", ")}
Phase IDs: 0 through ${phaseCount - 1}

Create 8–12 achievements using a creative mix of all condition types. Make the names and descriptions feel exciting and celebratory.`;
}

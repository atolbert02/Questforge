export function buildGenerationPrompt(projectText: string, userName: string): string {
  const truncated =
    projectText.length > 15000
      ? projectText.slice(0, 15000) + "\n\n[Document truncated for processing]"
      : projectText;

  return `You are an expert project analyst and gamification designer. A user named "${userName}" has uploaded their long-term project plan. Analyze it and transform it into a complete, personalized gamified task tracker.

=== PROJECT PLAN START ===
${truncated}
=== PROJECT PLAN END ===

Create a gamified tracker based on this plan. Be creative and thematic — quest names should feel exciting, level titles should reflect the project domain, and achievements should celebrate real milestones.

STRICT RULES:
- Return ONLY a valid JSON object. No markdown fences, no explanation, no preamble. Just the raw JSON.
- The characterName should be "${userName}"
- Create 3–4 phases representing major project stages
- Each phase should have 4–6 quests
- Mark 1 quest per phase as boss:true — the major milestone moment
- XP scale: simple task 15–35 XP, medium task 40–90 XP, hard task 100–200 XP, boss battle 150–300 XP, final boss 400–600 XP
- Create 3–4 skills relevant to the actual disciplines in the project
- Create 6–8 achievements, using a mix of all condition types
- Create 6–8 levels with thematic titles (e.g. for a music project: "Listener" → "Session Player" → "Composer" → "Producer" → "Artist")
- Phase colors must be visually distinct hex values — use the theme accent as the Phase 0 color
- Quest descriptions must be specific and actionable, not generic filler
- Quest IDs must follow the pattern "p{phaseId}q{index}" e.g. "p0q1", "p0q2", "p1q1"
- Skill IDs must be camelCase with no spaces e.g. "writingCraft", "musicalTheory"
- Achievement condition values: for type "quest" use the questId string; for "boss_count"/"quest_count" use a number; for "phase_clear" use the phase id number

Return this exact JSON structure:
{
  "projectTitle": "string",
  "tagline": "string",
  "characterName": "${userName}",
  "duration": "string",
  "theme": {
    "accent": "#hexcolor",
    "secondary": "#hexcolor"
  },
  "levels": [
    { "min": 0, "title": "string" }
  ],
  "phases": [
    { "id": 0, "label": "PHASE NAME", "dates": "string", "color": "#hex", "tagline": "string" }
  ],
  "skills": [
    { "id": "camelCaseId", "label": "Display Name", "icon": "emoji", "color": "#hex" }
  ],
  "quests": [
    {
      "id": "p0q1",
      "phase": 0,
      "type": "learn",
      "boss": false,
      "name": "Quest Name",
      "desc": "Specific actionable description.",
      "xp": 30,
      "skills": { "skillId": 10 }
    }
  ],
  "achievements": [
    {
      "id": "a01",
      "icon": "emoji",
      "name": "Achievement Name",
      "desc": "How to earn this.",
      "condition": { "type": "quest", "value": "p0q1" }
    }
  ]
}`;
}

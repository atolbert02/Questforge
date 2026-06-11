import { NextRequest, NextResponse } from "next/server";
import { buildPhasePrompt, PhaseContext } from "@/lib/prompts-phased";
import { callClaude, parseJSON } from "@/lib/claude";
import { Quest, QuestType } from "@/lib/types";

export const maxDuration = 60;

const VALID_TYPES: QuestType[] = ["learn", "build", "create", "research", "practice", "document"];

interface PhaseBody extends PhaseContext {
  projectText: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PhaseBody;

    if (
      body.phaseId === undefined ||
      !body.phaseLabel ||
      !Array.isArray(body.skillIds) ||
      body.skillIds.length === 0
    ) {
      return NextResponse.json({ error: "Missing phase context." }, { status: 400 });
    }

    const ctx: PhaseContext = {
      phaseId: body.phaseId,
      phaseLabel: body.phaseLabel,
      phaseTagline: body.phaseTagline,
      phaseDates: body.phaseDates,
      projectTitle: body.projectTitle,
      projectSummary: body.projectSummary,
      skillIds: body.skillIds,
    };

    const raw = await callClaude(buildPhasePrompt(ctx, body.projectText || ""), 3000);
    const parsed = parseJSON<Quest[]>(raw);

    if (!parsed.ok || !Array.isArray(parsed.data)) {
      console.error(`Phase ${body.phaseId} parse failed:`, parsed.ok ? "not an array" : parsed.raw.slice(0, 400));
      return NextResponse.json({ error: `Phase ${body.phaseId} generation failed.` }, { status: 500 });
    }

    const skillSet = new Set(body.skillIds);

    // Sanitize: force correct phase, normalize IDs, drop invalid skills/types.
    const quests: Quest[] = parsed.data.map((q, i) => {
      const cleanedSkills: Record<string, number> = {};
      if (q.skills && typeof q.skills === "object") {
        for (const [k, v] of Object.entries(q.skills)) {
          if (skillSet.has(k) && typeof v === "number") cleanedSkills[k] = v;
        }
      }
      // Guarantee at least one valid skill award so the skill tree isn't empty.
      if (Object.keys(cleanedSkills).length === 0) {
        cleanedSkills[body.skillIds[0]] = 10;
      }
      return {
        id: `p${body.phaseId}q${i + 1}`,
        phase: body.phaseId,
        type: VALID_TYPES.includes(q.type) ? q.type : "build",
        boss: Boolean(q.boss),
        name: String(q.name ?? `Quest ${i + 1}`),
        desc: String(q.desc ?? ""),
        xp: typeof q.xp === "number" && q.xp > 0 ? Math.round(q.xp) : 30,
        skills: cleanedSkills,
      };
    });

    if (quests.length === 0) {
      return NextResponse.json({ error: `Phase ${body.phaseId} produced no quests.` }, { status: 500 });
    }

    return NextResponse.json({ phaseId: body.phaseId, quests });
  } catch (err) {
    console.error("Phase error:", err);
    return NextResponse.json({ error: "Something went wrong generating a phase." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/parse-file";
import { buildSkeletonPrompt } from "@/lib/prompts-phased";
import { callClaude, parseJSON } from "@/lib/claude";

export const maxDuration = 60;

interface Skeleton {
  projectTitle: string;
  tagline: string;
  characterName: string;
  duration: string;
  theme: { accent: string; secondary: string };
  levels: { min: number; title: string }[];
  phases: { id: number; label: string; dates: string; color: string; tagline: string }[];
  skills: { id: string; label: string; icon: string; color: string }[];
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const pastedText = formData.get("text") as string | null;
    const userName = (formData.get("name") as string) || "Explorer";

    let projectText = "";
    if (file && file.size > 0) {
      projectText = await parseFile(file);
    } else if (pastedText?.trim()) {
      projectText = pastedText.trim();
    }

    if (!projectText) {
      return NextResponse.json(
        { error: "Please upload a file or paste your project plan." },
        { status: 400 }
      );
    }
    if (projectText.length < 100) {
      return NextResponse.json(
        { error: "Your project plan seems too short. Add more detail for better results." },
        { status: 400 }
      );
    }

    const raw = await callClaude(buildSkeletonPrompt(projectText, userName), 2000);
    const parsed = parseJSON<Skeleton>(raw);

    if (!parsed.ok) {
      console.error("Skeleton parse failed:", parsed.raw.slice(0, 500));
      return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 500 });
    }

    const s = parsed.data;
    // Minimal shape check before the client fans out on phases.
    if (
      !s.projectTitle ||
      !Array.isArray(s.phases) || s.phases.length < 2 ||
      !Array.isArray(s.skills) || s.skills.length < 1 ||
      !Array.isArray(s.levels) || s.levels.length < 3
    ) {
      console.error("Skeleton incomplete:", JSON.stringify(s).slice(0, 500));
      return NextResponse.json({ error: "Generated tracker was incomplete. Please try again." }, { status: 500 });
    }

    // Return the skeleton AND the (possibly truncated) project text so the client
    // can pass it back into the per-phase calls without re-uploading the file.
    return NextResponse.json({ skeleton: s, projectText });
  } catch (err) {
    console.error("Skeleton error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

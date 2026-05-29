import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/parse-file";
import { buildGenerationPrompt } from "@/lib/prompts";
import { validateConfig } from "@/lib/validate-config";

export const maxDuration = 60;

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

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20251022",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: buildGenerationPrompt(projectText, userName),
        },
      ],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const cleaned = rawText.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();

    let config;
    try {
      config = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Claude response:", rawText.slice(0, 500));
      return NextResponse.json(
        { error: "Generation failed. Please try again." },
        { status: 500 }
      );
    }

    const validation = validateConfig(config);
    if (!validation.valid) {
      console.error("Invalid config:", validation.errors);
      return NextResponse.json(
        { error: "Generated tracker was incomplete. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ tracker: config });
  } catch (err) {
    console.error("Generation error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

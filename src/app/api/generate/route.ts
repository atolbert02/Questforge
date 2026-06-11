import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/parse-file";
import {
  buildSkeletonPrompt,
  buildQuestsPrompt,
  buildAchievementsPrompt,
} from "@/lib/prompts";

export const maxDuration = 60;

function extractJSON(text: string): string {
  // Try object first, then array
  const objStart = text.indexOf("{");
  const objEnd = text.lastIndexOf("}");
  const arrStart = text.indexOf("[");
  const arrEnd = text.lastIndexOf("]");

  if (objStart !== -1 && objEnd !== -1 && (arrStart === -1 || objStart < arrStart)) {
    return text.slice(objStart, objEnd + 1);
  }
  if (arrStart !== -1 && arrEnd !== -1) {
    return text.slice(arrStart, arrEnd + 1);
  }
  return text.trim();
}

async function streamPrompt(prompt: string): Promise<Response> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const claudeStream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of claudeStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing API key." },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const step = (formData.get("step") as string) || "skeleton";

    if (step === "skeleton") {
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

      // Stream skeleton + projectText so client can use text in subsequent steps
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const claudeStream = client.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [{ role: "user", content: buildSkeletonPrompt(projectText, userName) }],
      });

      const encoder = new TextEncoder();
      const body = new ReadableStream({
        async start(controller) {
          try {
            let accumulated = "";
            for await (const chunk of claudeStream) {
              if (
                chunk.type === "content_block_delta" &&
                chunk.delta.type === "text_delta"
              ) {
                accumulated += chunk.delta.text;
                controller.enqueue(encoder.encode(chunk.delta.text));
              }
            }
            // Append the project text as a sentinel so client can use it in step 2
            const sentinel = `\n__PROJECT_TEXT__${JSON.stringify(projectText)}__END__`;
            controller.enqueue(encoder.encode(sentinel));
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      });

      return new Response(body, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (step === "quests") {
      const projectText = (formData.get("text") as string) || "";
      const phasesRaw = (formData.get("phases") as string) || "[]";
      const skillsRaw = (formData.get("skills") as string) || "[]";
      const phases = JSON.parse(phasesRaw);
      const skills = JSON.parse(skillsRaw);
      return streamPrompt(buildQuestsPrompt(projectText, phases, skills));
    }

    if (step === "achievements") {
      const questIdsRaw = (formData.get("questIds") as string) || "[]";
      const bossQuestIdsRaw = (formData.get("bossQuestIds") as string) || "[]";
      const phaseCount = parseInt(formData.get("phaseCount") as string, 10) || 4;
      return streamPrompt(
        buildAchievementsPrompt(
          JSON.parse(questIdsRaw),
          JSON.parse(bossQuestIdsRaw),
          phaseCount
        )
      );
    }

    return NextResponse.json({ error: "Unknown step." }, { status: 400 });
  } catch (err) {
    console.error("Generation error:", err);
    const message =
      process.env.NODE_ENV === "development"
        ? String(err)
        : "Something went wrong. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

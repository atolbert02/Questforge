import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/parse-file";
import { buildGenerationPrompt } from "@/lib/prompts";
import { validateConfig } from "@/lib/validate-config";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Server misconfiguration: missing API key." }, { status: 500 });
  }

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

    const claudeStream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: buildGenerationPrompt(projectText, userName),
        },
      ],
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
  } catch (err) {
    console.error("Generation error:", err);
    const message = process.env.NODE_ENV === "development"
      ? String(err)
      : "Something went wrong. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

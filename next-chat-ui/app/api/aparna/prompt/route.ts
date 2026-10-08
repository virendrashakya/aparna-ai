import { NextResponse } from "next/server";
import {
  buildAparnaGeneration,
  type PromptInput,
} from "@/lib/aparnaPrompt";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as PromptInput;

    if (!body?.outfit_id) {
      return NextResponse.json(
        { error: "outfit_id is required." },
        { status: 400 }
      );
    }

    const generation =
      await buildAparnaGeneration(body);

    return NextResponse.json({
      status: "ready",
      prompt: generation.prompt,
      scene: generation.scene,
      wardrobe: generation.garment,
      wearing_intent:
        generation.wearingIntent,
      metadata: generation.metadata,
    });
  } catch (error) {
    console.error(
      "APARNA PROMPT ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Prompt generation failed.",
      },
      { status: 500 }
    );
  }
}

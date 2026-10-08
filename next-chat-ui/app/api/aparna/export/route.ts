import { NextResponse } from "next/server";
import {
  buildAparnaExport,
  type PromptInput,
} from "@/lib/aparnaPrompt";

export const runtime = "nodejs";

function getInput(
  request: Request
): PromptInput {
  const url = new URL(request.url);

  return {
    time:
      url.searchParams.get("time") ||
      "Evening",
    mood:
      url.searchParams.get("mood") ||
      "Confident",
    outfit_id:
      url.searchParams.get("outfit_id") ||
      "",
    wearing_intent_id:
      url.searchParams.get(
        "wearing_intent_id"
      ) || "default",
    location:
      url.searchParams.get("location") ||
      "Living room",
    shot:
      url.searchParams.get("shot") ||
      "Full body",
    content_type:
      url.searchParams.get(
        "content_type"
      ) || "reel_cover",
    reel_style:
      url.searchParams.get("reel_style") ||
      "indian_glam_thirst_trap",
    photography_style:
      url.searchParams.get(
        "photography_style"
      ) || "candid_realism",
    thirst_level: Number(
      url.searchParams.get(
        "thirst_level"
      ) || "4"
    ),
  };
}

export async function GET(request: Request) {
  try {
    const input = getInput(request);

    if (!input.outfit_id) {
      return NextResponse.json(
        { error: "outfit_id is required." },
        { status: 400 }
      );
    }

    const markdown =
      await buildAparnaExport(input);

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type":
          "text/markdown; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="aparna-generation.md"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "APARNA EXPORT ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Export failed.",
      },
      { status: 500 }
    );
  }
}

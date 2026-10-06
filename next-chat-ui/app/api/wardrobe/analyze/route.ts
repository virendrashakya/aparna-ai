import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";
export const maxDuration = 180;

const WORKSPACE =
  process.env.APARNA_WORKSPACE ||
  path.resolve(process.cwd(), "..");

const OPENCLAW_BIN =
  process.env.OPENCLAW_BIN || "openclaw";

const OPENCLAW_AGENT =
  process.env.OPENCLAW_AGENT || "aparna";

const UPLOAD_DIRECTORY = path.join(
  WORKSPACE,
  "wardrobe",
  "_uploads"
);

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
]);

function extensionForMimeType(mimeType: string) {
  if (mimeType === "image/png") {
    return ".png";
  }

  return ".jpg";
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue below.
  }

  const fenced = trimmed.match(
    /```(?:json)?\s*([\s\S]*?)\s*```/i
  );

  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      // Continue below.
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (
    firstBrace >= 0 &&
    lastBrace > firstBrace
  ) {
    try {
      return JSON.parse(
        trimmed.slice(
          firstBrace,
          lastBrace + 1
        )
      );
    } catch {
      // Continue below.
    }
  }

  throw new Error(
    "OpenClaw returned invalid garment analysis JSON."
  );
}

function normalizeAnalysis(value: any) {
  const garment =
    value?.garment &&
    typeof value.garment === "object"
      ? value.garment
      : {};

  const wearingIntent =
    value?.wearing_intent &&
    typeof value.wearing_intent === "object"
      ? value.wearing_intent
      : {};

  const stringOrNull = (input: unknown) =>
    typeof input === "string" &&
    input.trim()
      ? input.trim()
      : null;

  const stringArray = (input: unknown) =>
    Array.isArray(input)
      ? input
          .filter(
            (item): item is string =>
              typeof item === "string"
          )
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  return {
    confidence:
      typeof value?.confidence === "number"
        ? Math.max(
            0,
            Math.min(1, value.confidence)
          )
        : null,

    garment: {
      type:
        stringOrNull(garment.type) ||
        "clothing",

      subtype:
        stringOrNull(garment.subtype),

      name:
        stringOrNull(garment.name) ||
        "Untitled garment",

      color:
        stringOrNull(garment.color),

      secondary_colors:
        stringArray(
          garment.secondary_colors
        ),

      material:
        stringOrNull(garment.material),

      pattern:
        stringOrNull(garment.pattern),

      construction:
        stringArray(
          garment.construction
        ),

      fit:
        stringOrNull(garment.fit),

      length:
        stringOrNull(garment.length),

      neckline:
        stringOrNull(garment.neckline),

      sleeves:
        stringOrNull(garment.sleeves),

      straps:
        stringOrNull(garment.straps),

      details:
        stringArray(garment.details),
    },

    wearing_intent: {
      name:
        stringOrNull(
          wearingIntent.name
        ) ||
        "Reference styling",

      description:
        stringOrNull(
          wearingIntent.description
        ),

      waist_position:
        stringOrNull(
          wearingIntent.waist_position
        ),

      garment_position:
        stringOrNull(
          wearingIntent.garment_position
        ),

      fit:
        stringOrNull(
          wearingIntent.fit
        ),

      silhouette:
        stringOrNull(
          wearingIntent.silhouette
        ),

      neckline_position:
        stringOrNull(
          wearingIntent.neckline_position
        ),

      sleeve_position:
        stringOrNull(
          wearingIntent.sleeve_position
        ),

      tuck:
        stringOrNull(
          wearingIntent.tuck
        ),

      drape:
        stringOrNull(
          wearingIntent.drape
        ),

      layering:
        stringOrNull(
          wearingIntent.layering
        ),

      fastening:
        stringOrNull(
          wearingIntent.fastening
        ),

      exposure_intent:
        stringOrNull(
          wearingIntent.exposure_intent
        ),

      preserve:
        stringArray(
          wearingIntent.preserve
        ),

      constraints:
        stringArray(
          wearingIntent.constraints
        ),

      accessories:
        stringArray(
          wearingIntent.accessories
        ),
    },

    notes:
      stringArray(value?.notes),
  };
}

function extractOpenClawText(response: any): string {
  const payloads =
    response?.result?.payloads ??
    response?.result?.result?.payloads ??
    [];

  if (!Array.isArray(payloads)) {
    return "";
  }

  return payloads
    .map((payload: any) =>
      typeof payload?.text === "string"
        ? payload.text
        : ""
    )
    .filter(Boolean)
    .join("\n")
    .trim();
}

function extractErrorText(
  stdout: string,
  stderr: string
) {
  const combined =
    `${stdout}\n${stderr}`.trim();

  if (!combined) {
    return "OpenClaw wardrobe analysis failed.";
  }

  return combined.slice(-4000);
}

export async function POST(request: Request) {
  let absolutePath = "";

  try {
    const formData =
      await request.formData();

    const file =
      formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error:
            "Please upload an outfit image.",
        },
        { status: 400 }
      );
    }

    const mimeType =
      file.type.toLowerCase();

    if (!ALLOWED_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          error:
            "Only JPG, JPEG and PNG images are supported.",
        },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          error:
            "The uploaded image is empty.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            "The image must be 20MB or smaller.",
        },
        { status: 400 }
      );
    }

    /*
     * Save the uploaded image BEFORE invoking OpenClaw.
     *
     * OpenClaw can then inspect the real local image through
     * its workspace/image tools instead of us sending the
     * image directly to an external API.
     */
    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    const uploadId =
      crypto.randomUUID();

    await fs.mkdir(
      UPLOAD_DIRECTORY,
      {
        recursive: true,
      }
    );

    const extension =
      extensionForMimeType(
        mimeType
      );

    const filename =
      `${uploadId}${extension}`;

    absolutePath =
      path.join(
        UPLOAD_DIRECTORY,
        filename
      );

    await fs.writeFile(
      absolutePath,
      buffer
    );

    const relativePath =
      path
        .relative(
          WORKSPACE,
          absolutePath
        )
        .split(path.sep)
        .join("/");

    /*
     * IMPORTANT:
     *
     * We deliberately do NOT call xAI directly here.
     *
     * OpenClaw already has Aparna's configured model,
     * credentials and image tools.
     *
     * The uploaded image lives inside the Aparna workspace,
     * so the agent can inspect it with its available image/file
     * tools.
     */
    const prompt = `
You are Aparna's wardrobe vision analyzer.

This is a wardrobe ingestion task.

You must inspect the uploaded image located at:

${absolutePath}

Use your available workspace/file/image tools to OPEN AND VISUALLY INSPECT this image before answering.

Do NOT guess from the filename.

============================================================
TASK
============================================================

Analyze the uploaded fashion/outfit photograph.

Your job is NOT to identify the person.

Your job is to identify:

1. WHAT GARMENT OR GARMENTS ARE PRESENT.
2. HOW THE GARMENT IS ACTUALLY BEING WORN.
3. WHICH PHYSICAL STYLING DETAILS MUST BE PRESERVED when another person wears the same garment.

This image is a:

WARDROBE + WEARING-STYLE REFERENCE

The most important distinction is:

GARMENT IDENTITY
versus
WEARING INTENT.

The wardrobe item describes WHAT the clothing is.

The wearing_intent describes HOW that clothing is positioned and worn in this specific reference.

============================================================
WEARING INTENT
============================================================

Be precise about physical relationships.

Observe and record things such as:

- high waist
- natural waist
- low waist
- sitting on hips
- tucked
- untucked
- partially tucked
- cropped
- oversized
- fitted
- body-skimming
- loose
- wrapped
- draped
- layered
- neckline position
- sleeve position
- strap placement
- garment length
- silhouette
- fastening
- visible layering
- relationship between coordinated garments

For Indian clothing also inspect:

- saree pallu position
- saree pleat arrangement
- saree waist placement
- blouse relationship to saree
- dupatta position
- lehenga waist placement
- blouse/choli relationship
- kurta/bottom relationship

If the reference intentionally shows a particular way of wearing the garment, preserve that information.

For example:

If the skirt is visibly worn below the natural waist and sits on the hips, record:

- waist_position
- garment_position
- silhouette
- preserve rules
- constraints

Do NOT convert that into a generic "skirt" description.

The wearing intent is specifically what will later control image and video generation.

============================================================
IMPORTANT RULES
============================================================

Do not identify the person.

Do not describe the person's identity.

Do not infer body measurements.

Do not treat the person's face, hair, body, skin tone, pose or background as wardrobe properties.

Do not invent details that cannot be observed.

Do not replace observed styling with a generic/default way of wearing the garment.

The garment itself and the way it is worn are the important information.

If multiple garments are clearly visible:

- identify the PRIMARY garment as the main garment
- mention coordinated garments/accessories in notes

============================================================
OUTPUT
============================================================

Return ONLY valid JSON.

No markdown.

No explanation before or after the JSON.

Use exactly this structure:

{
  "confidence": 0.0,
  "garment": {
    "type": "",
    "subtype": "",
    "name": "",
    "color": "",
    "secondary_colors": [],
    "material": "",
    "pattern": "",
    "construction": [],
    "fit": "",
    "length": "",
    "neckline": "",
    "sleeves": "",
    "straps": "",
    "details": []
  },
  "wearing_intent": {
    "name": "",
    "description": "",
    "waist_position": "",
    "garment_position": "",
    "fit": "",
    "silhouette": "",
    "neckline_position": "",
    "sleeve_position": "",
    "tuck": "",
    "drape": "",
    "layering": "",
    "fastening": "",
    "exposure_intent": "",
    "preserve": [],
    "constraints": [],
    "accessories": []
  },
  "notes": []
}

============================================================
QUALITY REQUIREMENT
============================================================

The wearing_intent must describe:

HOW THIS GARMENT IS WORN IN THIS IMAGE.

Do not simply repeat the garment description.

The wearing intent should contain actionable physical information that another image/video generation system can follow.

Examples of useful preserve rules:

- "preserve low waist placement"
- "preserve garment sitting on hips"
- "preserve fitted silhouette"
- "preserve visible relationship between blouse and saree"
- "preserve pallu over left shoulder"
- "preserve front tuck"
- "preserve cropped top length"
- "preserve sleeve pushed above elbow"

Examples of useful constraints:

- "do not raise waist to natural waist"
- "do not make the garment high-waisted"
- "do not change the drape"
- "do not remove visible layering"
- "do not lengthen the garment"
- "do not convert fitted styling into loose styling"

Only include such rules when supported by what you actually observe.

Return JSON only.
`;

    const sessionId =
      `wardrobe-analysis-${uploadId}`;

    console.log(
      "================================="
    );
    console.log(
      "APARNA WARDROBE ANALYSIS"
    );
    console.log(
      "================================="
    );
    console.log({
      agent: OPENCLAW_AGENT,
      sessionId,
      image: absolutePath,
    });

    const { stdout, stderr } =
      await execFileAsync(
        OPENCLAW_BIN,
        [
          "agent",
          "--agent",
          OPENCLAW_AGENT,
          "--session-id",
          sessionId,
          "--message",
          prompt,
          "--json",
        ],
        {
          cwd: WORKSPACE,
          timeout: 150000,
          maxBuffer:
            10 * 1024 * 1024,
          env: {
            ...process.env,
          },
        }
      );

    if (stderr?.trim()) {
      console.log(
        "OpenClaw stderr:",
        stderr
      );
    }

    let openClawResponse: any;

    try {
      openClawResponse =
        JSON.parse(stdout);
    } catch {
      console.error(
        "OpenClaw returned non-JSON stdout:",
        stdout
      );

      throw new Error(
        "OpenClaw returned an invalid response."
      );
    }

    if (
      openClawResponse?.status &&
      openClawResponse.status !== "ok"
    ) {
      throw new Error(
        extractErrorText(
          stdout,
          stderr
        )
      );
    }

    const modelText =
      extractOpenClawText(
        openClawResponse
      );

    if (!modelText) {
      throw new Error(
        "OpenClaw returned no wardrobe analysis."
      );
    }

    const parsed =
      normalizeAnalysis(
        extractJson(modelText)
      );

    return NextResponse.json({
      status: "analyzed",

      upload: {
        id: uploadId,
        filename,
        local_path: relativePath,
        absolute_path: absolutePath,
        mime_type: mimeType,
        size: file.size,
      },

      analysis: parsed,

      engine: {
        provider: "openclaw",
        agent: OPENCLAW_AGENT,
      },
    });
  } catch (error) {
    console.error(
      "WARDROBE ANALYSIS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to analyze wardrobe image.",
      },
      { status: 500 }
    );
  }
}
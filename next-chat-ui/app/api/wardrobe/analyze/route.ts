import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";
export const maxDuration = 120;

const WORKSPACE =
  process.env.APARNA_WORKSPACE ||
  path.resolve(process.cwd(), "..");

const UPLOAD_DIRECTORY = path.join(
  WORKSPACE,
  "wardrobe",
  "_uploads"
);

const XAI_API_URL =
  "https://api.x.ai/v1/responses";

const XAI_MODEL =
  process.env.WARDROBE_VISION_MODEL ||
  "grok-4.7";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
]);

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
      // Ignore.
    }
  }

  throw new Error(
    "The vision model returned invalid garment analysis."
  );
}

function extensionForMimeType(
  mimeType: string
) {
  if (mimeType === "image/png") {
    return ".png";
  }

  return ".jpg";
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
    typeof input === "string" && input.trim()
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

function extractResponseText(
  response: any
): string {
  if (
    typeof response?.output_text ===
    "string"
  ) {
    return response.output_text;
  }

  const output = Array.isArray(
    response?.output
  )
    ? response.output
    : [];

  const parts: string[] = [];

  for (const item of output) {
    if (
      typeof item?.text === "string"
    ) {
      parts.push(item.text);
    }

    if (Array.isArray(item?.content)) {
      for (const content of item.content) {
        if (
          typeof content?.text === "string"
        ) {
          parts.push(content.text);
        }
      }
    }
  }

  return parts.join("\n").trim();
}

export async function POST(
  request: Request
) {
  try {
    const apiKey =
      process.env.XAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "XAI_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

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

    if (
      !ALLOWED_TYPES.has(
        file.type.toLowerCase()
      )
    ) {
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

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    const mimeType =
      file.type.toLowerCase();

    const dataUrl =
      `data:${mimeType};base64,${buffer.toString(
        "base64"
      )}`;

    const prompt = `
You are Aparna's wardrobe vision analyzer.

Analyze the uploaded fashion/outfit photograph.

Your job is NOT to identify the person.

Your job is to identify:

1. WHAT GARMENT OR GARMENTS ARE PRESENT.
2. HOW THE GARMENT IS ACTUALLY BEING WORN.
3. WHICH PHYSICAL STYLING DETAILS MUST be preserved when another person wears the same garment.

This image is a WARDROBE + WEARING-STYLE REFERENCE.

Be precise about physical relationships.

For example, distinguish between:

- high waist
- natural waist
- low waist
- sitting on hips
- tucked
- untucked
- cropped
- oversized
- fitted
- body-skimming
- loose
- draped
- wrapped
- layered
- partially tucked
- neckline position
- sleeve position
- strap placement
- saree pallu position
- saree pleat arrangement
- blouse relationship to saree
- visible layering
- fastening
- silhouette
- garment length

Do not invent details that cannot be observed.

Do not describe the person's identity.

Do not infer body measurements.

Do not preserve the person's face, hair, body, skin, pose or background as wardrobe properties.

The garment itself and the way it is worn are the important information.

If multiple garments are clearly visible, identify the PRIMARY garment as the main garment and mention coordinated garments/accessories in notes.

Return ONLY valid JSON.

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

IMPORTANT:

The wearing_intent must describe HOW THIS GARMENT IS WORN IN THIS IMAGE.

Do not replace observed styling with a generic/default way of wearing the garment.

If the garment is intentionally low-waisted, record that.

If it is tucked in a particular way, record that.

If a saree is draped in a particular way, record that.

If a blouse or top is visibly positioned relative to another garment, record that relationship.

The resulting wearing_intent will later be passed to an image and video generation system.
`;

    const response =
      await fetch(
        XAI_API_URL,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${apiKey}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            model: XAI_MODEL,
            store: false,
            input: [
              {
                role: "user",
                content: [
                  {
                    type: "input_image",
                    image_url:
                      dataUrl,
                    detail: "high",
                  },
                  {
                    type: "input_text",
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

    const responseText =
      await response.text();

    let responseJson: any;

    try {
      responseJson =
        JSON.parse(responseText);
    } catch {
      throw new Error(
        `xAI returned invalid JSON (${response.status}).`
      );
    }

    if (!response.ok) {
      console.error(
        "xAI wardrobe analysis error:",
        responseJson
      );

      return NextResponse.json(
        {
          error:
            responseJson?.error?.message ||
            "Unable to analyze the wardrobe image.",
        },
        {
          status:
            response.status >= 400 &&
            response.status < 600
              ? response.status
              : 500,
        }
      );
    }

    const modelText =
      extractResponseText(
        responseJson
      );

    if (!modelText) {
      throw new Error(
        "The vision model returned no analysis."
      );
    }

    const parsed =
      normalizeAnalysis(
        extractJson(modelText)
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

    const absolutePath =
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

    return NextResponse.json({
      status: "analyzed",

      upload: {
        id: uploadId,
        filename,
        local_path: relativePath,
        mime_type: mimeType,
        size: file.size,
      },

      analysis: parsed,
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
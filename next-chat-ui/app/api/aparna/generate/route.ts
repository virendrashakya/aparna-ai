import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execFileAsync = promisify(execFile);

const OPENCLAW_BIN =
  process.env.OPENCLAW_BIN || "openclaw";

const OPENCLAW_AGENT =
  process.env.OPENCLAW_AGENT || "aparna";

const SESSION_ID =
  process.env.OPENCLAW_SESSION_ID ||
  "aparna-image-generation";

const VALID_CONTENT_TYPES = [
  "photo",
  "reel_cover",
  "reel_frame",
];

const VALID_REEL_STYLES = [
  "indian_glam_thirst_trap",
  "mirror_glam",
  "saree_glam",
  "bodycon_glam",
  "night_out_glam",
  "resort_glam",
];

const VALID_PHOTOGRAPHY_STYLES = [
  "candid_realism",
  "intimate_editorial",
  "desi_fusion_editorial",
  "smartphone_lifestyle",
  "window_light_natural",
  "direct_flash_editorial",
  "perspective_social",
];

function normalizeThirstLevel(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return 4;
  }

  const number = Number(value);

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 5
  ) {
    return null;
  }

  return number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      time,
      mood,
      outfit_id,
      wearing_intent_id,
      location,
      shot,
    } = body;

    const contentType =
      typeof body.content_type === "string" &&
      VALID_CONTENT_TYPES.includes(
        body.content_type
      )
        ? body.content_type
        : "photo";

    const reelStyle =
      typeof body.reel_style === "string" &&
      VALID_REEL_STYLES.includes(
        body.reel_style
      )
        ? body.reel_style
        : "indian_glam_thirst_trap";

    const photographyStyle =
      typeof body.photography_style === "string" &&
      VALID_PHOTOGRAPHY_STYLES.includes(
        body.photography_style
      )
        ? body.photography_style
        : "candid_realism";

    const thirstLevel =
      normalizeThirstLevel(
        body.thirst_level
      );

    if (
      !time ||
      !mood ||
      !outfit_id ||
      !location ||
      !shot
    ) {
      return NextResponse.json(
        {
          error:
            "Missing generation parameters",
        },
        { status: 400 }
      );
    }

    if (thirstLevel === null) {
      return NextResponse.json(
        {
          error:
            "thirst_level must be an integer from 1 to 5",
        },
        { status: 400 }
      );
    }

    console.log(
      "================================="
    );
    console.log(
      "APARNA IMAGE GENERATION"
    );
    console.log(
      "================================="
    );

    console.log({
      time,
      mood,
      outfit_id,
      location,
      shot,
      wearing_intent_id,
      photographyStyle,
      contentType,
      reelStyle,
      thirstLevel,
    });

    const isReel =
      contentType === "reel_cover" ||
      contentType === "reel_frame";

    const suppliedPrompt =
      typeof body.prompt === "string"
        ? body.prompt.trim()
        : "";

    const prompt = suppliedPrompt
      ? `You are Aparna's image-generation controller.

Use the following approved, model-independent image prompt as the primary generation instruction.

APPROVED IMAGE PROMPT
---------------------
${suppliedPrompt}
---------------------

Before generating, resolve the selected wardrobe item from data/wardrobe.json and use the canonical Aparna identity, wardrobe and location references stored in the workspace. The approved prompt is authoritative for the scene and photographic direction.

Generate exactly ONE image.

Keep the result non-explicit. Do not depict sexual activity or pornography.

Return:
{"status":"generated","description":"...","image":"..."}
`
      : `You are Aparna's image-generation controller.

Generate exactly ONE highly photorealistic photograph of Aparna using the
canonical visual identity, wardrobe and environment already stored in her
workspace.

SELECTED SCENE
- time: ${time}
- mood: ${mood}
- outfit_id: ${outfit_id}
- wearing_intent_id: ${wearing_intent_id || "default"}
- location: ${location}
- shot: ${shot}
- photography_style: ${photographyStyle}
- content_type: ${contentType}
- reel_style: ${reelStyle}
- thirst_level: ${thirstLevel}/5

SOURCE OF TRUTH
Follow skills/aparna-image/SKILL.md.
Resolve the selected outfit from data/wardrobe.json and use its canonical
visual references. Use the established Aparna identity references under
references/ and the selected location references under locations/.

Do not copy identity, face, body, hair or pose from retailer models.
The canonical wardrobe item is authoritative. The wearing intent is
authoritative for HOW the garment is worn.

IDENTITY
Same adult Aparna every time:
- preserve face, skin tone, hair identity, body proportions and age
- natural asymmetry and realistic anatomy
- realistic hands, fingers, joints and posture
- no generic AI-model face or beauty-filter skin

WARDROBE
Preserve the actual selected garment:
- color, material, silhouette, construction, neckline, sleeves/straps,
  length, seams, pattern, texture, embellishments and drape
- preserve the selected wearing intent exactly when supported
- realistic wrinkles, tension, compression, folds and contact shadows
- never invent a different garment or increase exposure beyond the
  canonical garment

PHOTOGRAPHY
The result must look like a real photograph, not an AI render.

Style: ${photographyStyle}

Do not repeat a centered standing model pose by default. Let the selected
shot, location, activity and wearing intent determine the composition.

SOCIAL / REEL
${isReel ? "This is a vertical 9:16 Reel frame/cover." : "This is a normal Instagram photograph."}
Thirst ${thirstLevel}/5 controls presentation, not garment modification.

REALISM RULES
- real human photography, natural skin texture and small imperfections
- physically plausible anatomy and posture
- believable body-to-surface contact
- realistic clothing physics
- realistic lived-in environment
- no CGI, plastic skin, mannequin anatomy, collage, split screen,
  multiple people or multiple versions

Keep it non-explicit. Do not depict sexual activity or pornography.

Return:
{"status":"generated","description":"...","image":"..."}
`;

    console.log(
      "Calling OpenClaw image generation..."
    );

    const {
      stdout,
      stderr,
    } = await execFileAsync(
      OPENCLAW_BIN,
      [
        "agent",
        "--agent",
        OPENCLAW_AGENT,
        "--session-id",
        SESSION_ID,
        "--message",
        prompt,
        "--json",
      ],
      {
        timeout: 180000,
        maxBuffer: 20 * 1024 * 1024,
      }
    );

    if (stderr) {
      console.log(
        "OpenClaw stderr:",
        stderr
      );
    }

    let openclawResponse: any;

    try {
      openclawResponse =
        JSON.parse(stdout);
    } catch {
      console.error(
        "OpenClaw returned invalid JSON:"
      );

      console.error(stdout);

      return NextResponse.json(
        {
          error:
            "OpenClaw returned an invalid response.",
        },
        { status: 500 }
      );
    }

    const payload =
      openclawResponse
        ?.result
        ?.payloads
        ?.[0];

    console.log(
      "OpenClaw payload:",
      payload
    );

    const imagePath =
      payload?.mediaUrl ||
      payload?.mediaUrls?.[0];

    if (!imagePath) {
      console.error(
        "No media URL returned by OpenClaw."
      );

      console.error(
        JSON.stringify(
          openclawResponse,
          null,
          2
        )
      );

      return NextResponse.json(
        {
          error:
            "OpenClaw generated a response but no image path was returned.",
        },
        { status: 500 }
      );
    }

    if (!fs.existsSync(imagePath)) {
      console.error(
        "Generated image does not exist:",
        imagePath
      );

      return NextResponse.json(
        {
          error:
            "OpenClaw returned an image path but the image file was not found.",
          imagePath,
        },
        { status: 500 }
      );
    }

    const generatedDirectory =
      path.join(
        process.cwd(),
        "public",
        "generated"
      );

    fs.mkdirSync(
      generatedDirectory,
      {
        recursive: true,
      }
    );

    const extension =
      path.extname(imagePath) ||
      ".png";

    const filename =
      `aparna-${Date.now()}${extension}`;

    const destination =
      path.join(
        generatedDirectory,
        filename
      );

    fs.copyFileSync(
      imagePath,
      destination
    );

    if (!fs.existsSync(destination)) {
      return NextResponse.json(
        {
          error:
            "Image was generated but could not be copied to the Next.js public directory.",
        },
        { status: 500 }
      );
    }

    const browserImageUrl =
      `/generated/${filename}`;

    return NextResponse.json({
      status: "generated",

      image: browserImageUrl,

      description:
        payload?.text ||
        "Aparna image generated successfully.",

      parameters: {
        time,
        mood,
        outfit_id,
        location,
        shot,
        photography_style: photographyStyle,
        wearing_intent_id:
          wearing_intent_id || "default",
        content_type: contentType,
        reel_style: reelStyle,
        thirst_level: thirstLevel,
      },
    });
  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "APARNA IMAGE GENERATION ERROR"
    );

    console.error(error);

    console.error(
      "================================="
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Image generation failed.",
      },
      {
        status: 500,
      }
    );
  }
}
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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      time,
      mood,
      outfit_id,
      location,
      shot,
    } = body;

    if (
      !time ||
      !mood ||
      !outfit_id ||
      !location ||
      !shot
    ) {
      return NextResponse.json(
        {
          error: "Missing generation parameters",
        },
        { status: 400 }
      );
    }

    const prompt = `
You are Aparna's image-generation controller.

Generate ONE Instagram-ready image of Aparna.

TIME:
${time}

MOOD:
${mood}

OUTFIT:
${outfit_id}

LOCATION:
${location}

SHOT:
${shot}

Read the Aparna workspace before generating.

Use:

SOUL.md
data/state.json
data/wardrobe.json
data/life.md
references/face/
references/body/
references/hair/
locations/

Maintain Aparna's established:

- identity
- face
- body proportions
- hair
- skin tone
- age
- fashion style

The selected time should influence lighting and atmosphere.

The selected mood should influence expression and pose.

The selected location should match her established environment.

The selected camera style must be respected.

Create ONE natural, photorealistic Instagram photograph.

Do not create a collage.
Do not create multiple images.
Do not change Aparna's identity.

Use the image generation tool.

After generation, return JSON:

{
  "status": "generated",
  "description": "...",
  "image": "..."
}
`;

    console.log("Calling OpenClaw...");

    const { stdout, stderr } =
      await execFileAsync(
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
      console.log("OpenClaw stderr:", stderr);
    }

    let result: any;

    try {
      result = JSON.parse(stdout);
    } catch {
      console.error("Could not parse OpenClaw JSON:");
      console.error(stdout);

      return NextResponse.json(
        {
          error: "Could not parse OpenClaw response",
        },
        { status: 500 }
      );
    }

    /*
     * OpenClaw response structure:
     *
     * result
     *   └── result
     *       └── payloads
     *           └── mediaUrl
     */

    const mediaUrl =
      result?.result?.result?.payloads?.[0]?.mediaUrl;

    const mediaUrls =
      result?.result?.result?.payloads?.[0]?.mediaUrls;

    const imagePath =
      mediaUrl ||
      mediaUrls?.[0];

    if (!imagePath) {
      console.error(
        "OpenClaw response did not contain mediaUrl"
      );

      console.error(
        JSON.stringify(result, null, 2)
      );

      return NextResponse.json(
        {
          error:
            "OpenClaw generated a response but no image path was returned.",
        },
        { status: 500 }
      );
    }

    console.log(
      "OpenClaw generated image:",
      imagePath
    );

    /*
     * Copy OpenClaw's private image into
     * Next.js public directory.
     */

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

    const filename =
      `aparna-${Date.now()}.png`;

    const destination =
      path.join(
        generatedDirectory,
        filename
      );

    fs.copyFileSync(
      imagePath,
      destination
    );

    console.log(
      "Copied image to:",
      destination
    );

    /*
     * Browser-accessible URL.
     */

    const browserImageUrl =
      `/generated/${filename}`;

    return NextResponse.json({
      status: "generated",

      image: browserImageUrl,

      description:
        result?.result?.result?.payloads?.[0]?.text ||
        "Aparna image generated successfully.",

      parameters: {
        time,
        mood,
        outfit_id,
        location,
        shot,
      },
    });

  } catch (error) {
    console.error(
      "APARNA GENERATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Image generation failed",
      },
      { status: 500 }
    );
  }
}
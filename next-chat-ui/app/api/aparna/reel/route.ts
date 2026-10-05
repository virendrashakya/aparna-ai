import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 300;

const XAI_API_KEY =
  process.env.XAI_API_KEY;

const XAI_VIDEO_MODEL =
  "grok-imagine-video-1.5";

const DEFAULT_DURATION = 8;

const VALID_DURATIONS = [
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
];

function getThirstDescription(
  thirstLevel: number
) {
  switch (thirstLevel) {
    case 1:
      return `
attractive lifestyle fashion,
natural confidence,
subtle camera awareness,
minimal posing
`;

    case 2:
      return `
glamorous fashion,
polished styling,
confident posture,
moderate camera awareness
`;

    case 3:
      return `
clearly flirtatious fashion,
playful eye contact,
confident posing,
subtle teasing attitude
`;

    case 4:
      return `
strong thirst-trap fashion,
revealing but non-explicit styling,
confident silhouette,
deliberate eye contact,
playful teasing attitude,
attention-grabbing fashion movement
`;

    case 5:
      return `
very provocative fashion,
substantially revealing but non-explicit styling,
strong silhouette,
intimate camera awareness,
confident sensual fashion posing,
deliberate attention-grabbing movement
`;

    default:
      return `
strong thirst-trap fashion,
revealing but non-explicit styling,
confident silhouette,
deliberate eye contact
`;
  }
}

function buildMotionPrompt({
  reelStyle,
  thirstLevel,
  location,
  mood,
  shot,
}: {
  reelStyle: string;
  thirstLevel: number;
  location: string;
  mood: string;
  shot: string;
}) {
  const thirst =
    getThirstDescription(
      thirstLevel
    );

  return `
Create a short vertical Instagram fashion Reel from the supplied
first-frame image.

The supplied image is the canonical first frame of Aparna Roy.

Aparna is an adult fictional Indian fashion/lifestyle creator.

REEL STYLE:
${reelStyle}

THIRST LEVEL:
${thirstLevel}/5

VISUAL DIRECTION:
${thirst}

SCENE:
${location}

MOOD:
${mood}

SHOT:
${shot}

IMPORTANT IDENTITY RULE:

The woman in the supplied image IS Aparna.

Preserve her:

- face
- facial structure
- eyes
- nose
- lips
- skin
- hair
- body identity
- age appearance
- outfit
- jewellery
- environment

Do not transform her into another woman.

Do not change the outfit.

Do not change the location.

Do not redesign the garment.

Do not alter her body proportions.

The video should feel like a real short social-media video captured
from this exact photograph.

MOTION:

Use subtle believable human movement.

Good motion includes:

- natural breathing
- slight posture adjustment
- small head movement
- natural eye movement
- subtle facial expression
- slight smile
- gentle hair movement
- small body shift
- natural fabric movement
- slight saree/dress movement
- tiny camera movement
- subtle handheld phone motion
- natural walking movement when appropriate

For a fashion/thirst-trap Reel, the movement may include:

- slowly turning toward camera
- small confident turn
- slight shift of weight
- gentle outfit movement
- looking into camera
- briefly looking away and returning eye contact
- subtle hair adjustment
- small jewellery adjustment
- natural fashion pose transition

The movement should be confident and playful.

Do not make the movement explicit.

Do not depict sexual activity.

Do not depict pornography.

Do not simulate sexual acts.

This is glamorous adult fashion content.

CAMERA:

Make it look like a real Instagram Reel captured with a modern
smartphone.

Use:

- realistic handheld movement
- subtle camera drift
- natural focus
- realistic depth
- believable motion blur
- realistic exposure
- natural lighting
- realistic shadows

Avoid:

- CGI movement
- plastic skin
- rubber body movement
- unnatural limbs
- warped hands
- morphing face
- changing clothing
- changing background
- floating jewellery
- impossible physics

LOOP:

Where possible, create a visually smooth ending that can transition
back toward the opening frame.

The Reel should feel like a deliberate 8-second fashion moment.

SOCIAL MEDIA FEEL:

This is not a movie scene.

It should feel like a real creator filmed a short Instagram Reel.

Keep the action simple.

The first frame is already strong.

Do not introduce unnecessary characters.

Do not add text.

Do not add logos.

Do not add watermarks.

Do not add a second person.

FINAL OBJECTIVE:

A highly realistic short vertical Indian glamour fashion Reel where
Aparna confidently acknowledges the camera and the outfit moves
naturally.

The result should feel:

confident,
glamorous,
flirtatious,
real,
social-media-native,
and visually attention-grabbing.

Not explicit.
Not pornographic.
Not artificial.
`;
}

async function imageToDataUri(
  imageUrl: string
) {
  /*
   * The browser gives us a local URL such as:
   *
   * /generated/aparna-123.png
   *
   * Convert that local generated image into a data URI because xAI
   * accepts base64 image input.
   */

  if (
    imageUrl.startsWith("data:image/")
  ) {
    return imageUrl;
  }

  if (
    !imageUrl.startsWith("/")
  ) {
    throw new Error(
      "Only local generated images are accepted."
    );
  }

  const absolutePath =
    path.join(
      process.cwd(),
      "public",
      imageUrl
    );

  const publicRoot =
    path.resolve(
      process.cwd(),
      "public"
    );

  const resolvedPath =
    path.resolve(
      absolutePath
    );

  if (
    !resolvedPath.startsWith(
      `${publicRoot}${path.sep}`
    )
  ) {
    throw new Error(
      "Invalid image path."
    );
  }

  const imageBuffer =
    await fs.readFile(
      resolvedPath
    );

  const extension =
    path
      .extname(
        resolvedPath
      )
      .toLowerCase();

  const mimeType =
    extension === ".jpg" ||
    extension === ".jpeg"
      ? "image/jpeg"
      : extension === ".webp"
        ? "image/webp"
        : "image/png";

  return `data:${mimeType};base64,${imageBuffer.toString(
    "base64"
  )}`;
}

async function startVideoGeneration({
  image,
  prompt,
  duration,
}: {
  image: string;
  prompt: string;
  duration: number;
}) {
  const response =
    await fetch(
      "https://api.x.ai/v1/videos/generations",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${XAI_API_KEY}`,
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          model:
            XAI_VIDEO_MODEL,

          prompt,

          image: {
            url: image,
          },

          duration,

          aspect_ratio:
            "9:16",

          resolution:
            "720p",
        }),
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        data?.message ||
        `xAI video generation failed with HTTP ${response.status}`
    );
  }

  if (!data?.request_id) {
    throw new Error(
      "xAI did not return a video request ID."
    );
  }

  return data.request_id as string;
}

async function pollVideo(
  requestId: string
) {
  const startedAt =
    Date.now();

  const timeoutMs =
    240000;

  while (
    Date.now() -
      startedAt <
    timeoutMs
  ) {
    const response =
      await fetch(
        `https://api.x.ai/v1/videos/${encodeURIComponent(
          requestId
        )}`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${XAI_API_KEY}`,
          },

          cache: "no-store",
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error?.message ||
          data?.message ||
          `xAI video polling failed with HTTP ${response.status}`
      );
    }

    if (
      data.status === "done"
    ) {
      if (!data.video?.url) {
        throw new Error(
          "xAI marked the video complete but returned no video URL."
        );
      }

      return data;
    }

    if (
      data.status === "failed" ||
      data.status === "expired"
    ) {
      throw new Error(
        data?.error?.message ||
          `Video generation ${data.status}.`
      );
    }

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          5000
        )
    );
  }

  throw new Error(
    "Video generation timed out."
  );
}

async function saveVideo(
  videoUrl: string
) {
  const response =
    await fetch(
      videoUrl,
      {
        cache: "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      `Unable to download generated video: HTTP ${response.status}`
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  const buffer =
    Buffer.from(
      arrayBuffer
    );

  const reelsDirectory =
    path.join(
      process.cwd(),
      "public",
      "generated",
      "reels"
    );

  await fs.mkdir(
    reelsDirectory,
    {
      recursive: true,
    }
  );

  const filename =
    `aparna-reel-${Date.now()}.mp4`;

  const destination =
    path.join(
      reelsDirectory,
      filename
    );

  await fs.writeFile(
    destination,
    buffer
  );

  return `/generated/reels/${filename}`;
}

export async function POST(
  request: Request
) {
  try {
    if (!XAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "XAI_API_KEY is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const body =
      await request.json();

    const image =
      typeof body?.image ===
      "string"
        ? body.image
        : "";

    const reelStyle =
      typeof body?.reel_style ===
      "string"
        ? body.reel_style
        : "indian_glam_thirst_trap";

    const thirstLevel =
      Number(
        body?.thirst_level ?? 4
      );

    const duration =
      Number(
        body?.duration ??
          DEFAULT_DURATION
      );

    const location =
      typeof body?.location ===
      "string"
        ? body.location
        : "Living room";

    const mood =
      typeof body?.mood ===
      "string"
        ? body.mood
        : "Confident";

    const shot =
      typeof body?.shot ===
      "string"
        ? body.shot
        : "Full body";

    if (!image) {
      return NextResponse.json(
        {
          error:
            "A generated Aparna image is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        thirstLevel
      ) ||
      thirstLevel < 1 ||
      thirstLevel > 5
    ) {
      return NextResponse.json(
        {
          error:
            "thirst_level must be between 1 and 5.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !VALID_DURATIONS.includes(
        duration
      )
    ) {
      return NextResponse.json(
        {
          error:
            "duration must be between 5 and 15 seconds.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "================================="
    );

    console.log(
      "APARNA REEL GENERATION"
    );

    console.log(
      "================================="
    );

    console.log({
      image,
      reelStyle,
      thirstLevel,
      duration,
      location,
      mood,
      shot,
    });

    const imageDataUri =
      await imageToDataUri(
        image
      );

    const prompt =
      buildMotionPrompt({
        reelStyle,
        thirstLevel,
        location,
        mood,
        shot,
      });

    console.log(
      "Starting xAI video generation..."
    );

    const requestId =
      await startVideoGeneration({
        image:
          imageDataUri,
        prompt,
        duration,
      });

    console.log(
      "xAI request:",
      requestId
    );

    const result =
      await pollVideo(
        requestId
      );

    console.log(
      "xAI video generated."
    );

    const videoUrl =
      await saveVideo(
        result.video.url
      );

    console.log(
      "Saved:",
      videoUrl
    );

    return NextResponse.json({
      status: "generated",

      video: videoUrl,

      request_id:
        requestId,

      parameters: {
        reel_style:
          reelStyle,

        thirst_level:
          thirstLevel,

        duration,

        aspect_ratio:
          "9:16",

        resolution:
          "720p",

        location,

        mood,

        shot,
      },
    });
  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "APARNA REEL GENERATION ERROR"
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
            : "Reel generation failed.",
      },
      {
        status: 500,
      }
    );
  }
}
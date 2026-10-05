import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const XAI_API_URL = "https://api.x.ai/v1/videos/generations";
const XAI_VIDEO_MODEL = "grok-imagine-video-1.5";

const DEFAULT_DURATION = 8;
const DEFAULT_ASPECT_RATIO = "9:16";
const DEFAULT_RESOLUTION = "720p";

type GenerateRequest = {
  prompt?: string;
  image_url?: string;
  duration?: number;
  aspect_ratio?: string;
  resolution?: string;
  generate_audio?: boolean;
};

type XaiGenerationResponse = {
  request_id?: string;
  error?: {
    message?: string;
  };
};

type XaiStatusResponse = {
  status?: "pending" | "done" | "failed" | "expired";
  video?: {
    url?: string;
    duration?: number;
  };
  error?: {
    message?: string;
  };
};

function getApiKey() {
  const key = process.env.XAI_API_KEY;

  if (!key) {
    throw new Error(
      "XAI_API_KEY is not configured. Add it to next-chat-ui/.env.local."
    );
  }

  return key;
}

function validateDuration(duration: number) {
  if (!Number.isFinite(duration)) {
    return DEFAULT_DURATION;
  }

  return Math.min(Math.max(Math.round(duration), 1), 15);
}

function validateAspectRatio(value?: string) {
  const allowed = ["16:9", "9:16", "1:1"];

  return value && allowed.includes(value)
    ? value
    : DEFAULT_ASPECT_RATIO;
}

function validateResolution(value?: string) {
  const allowed = ["480p", "720p", "1080p"];

  return value && allowed.includes(value)
    ? value
    : DEFAULT_RESOLUTION;
}

async function startGeneration(
  apiKey: string,
  body: GenerateRequest
) {
  const prompt =
    body.prompt?.trim() ||
    `
Create a realistic vertical social-media fashion Reel.

Adult Indian woman in Mumbai.
Natural human photography.
Confident fashion attitude.
Subtle natural movement.
Realistic skin, hair, hands and fabric.
Social-media-native camera movement.
No text overlays.
No logos.
No watermark.
Non-explicit fashion content.
`;

  const payload: Record<string, unknown> = {
    model: XAI_VIDEO_MODEL,
    prompt,
    duration: validateDuration(body.duration ?? DEFAULT_DURATION),
    aspect_ratio: validateAspectRatio(body.aspect_ratio),
    resolution: validateResolution(body.resolution),
    generate_audio:
      typeof body.generate_audio === "boolean"
        ? body.generate_audio
        : false,
  };

  if (body.image_url?.trim()) {
    payload.image = {
      url: body.image_url.trim(),
    };
  }

  const response = await fetch(XAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data =
    (await response.json()) as XaiGenerationResponse;

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        `xAI video generation failed with HTTP ${response.status}.`
    );
  }

  if (!data.request_id) {
    throw new Error(
      "xAI did not return a video request_id."
    );
  }

  return data.request_id;
}

async function pollGeneration(
  apiKey: string,
  requestId: string
) {
  const maxAttempts = 180;
  const intervalMs = 5000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(
      `https://api.x.ai/v1/videos/${requestId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        cache: "no-store",
      }
    );

    const data =
      (await response.json()) as XaiStatusResponse;

    if (!response.ok) {
      throw new Error(
        data?.error?.message ||
          `xAI polling failed with HTTP ${response.status}.`
      );
    }

    if (data.status === "done") {
      if (!data.video?.url) {
        throw new Error(
          "xAI reported the video as done but returned no video URL."
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

    await new Promise((resolve) =>
      setTimeout(resolve, intervalMs)
    );
  }

  throw new Error(
    "Video generation timed out while waiting for xAI."
  );
}

async function downloadVideo(
  videoUrl: string,
  requestId: string
) {
  const response = await fetch(videoUrl);

  if (!response.ok) {
    throw new Error(
      `Unable to download generated video: HTTP ${response.status}.`
    );
  }

  const arrayBuffer = await response.arrayBuffer();

  const outputDirectory = path.join(
    process.cwd(),
    "public",
    "generated",
    "reels"
  );

  await fs.mkdir(outputDirectory, {
    recursive: true,
  });

  const safeRequestId = requestId.replace(
    /[^a-zA-Z0-9_-]/g,
    ""
  );

  const filename = `aparna-reel-${safeRequestId}.mp4`;

  const outputPath = path.join(
    outputDirectory,
    filename
  );

  await fs.writeFile(
    outputPath,
    Buffer.from(arrayBuffer)
  );

  return `/generated/reels/${filename}`;
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as GenerateRequest;

    const apiKey = getApiKey();

    const requestId = await startGeneration(
      apiKey,
      body
    );

    const result = await pollGeneration(
      apiKey,
      requestId
    );

    const videoPath = await downloadVideo(
      result.video!.url!,
      requestId
    );

    return NextResponse.json({
      status: "completed",
      model: XAI_VIDEO_MODEL,
      request_id: requestId,
      video: videoPath,
      source_video_url: result.video?.url,
      duration: result.video?.duration,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown video generation error.";

    console.error(
      "Aparna Reel generation error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}
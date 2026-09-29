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
    // ============================================================
    // 1. READ UI PARAMETERS
    // ============================================================

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

    console.log("=================================");
    console.log("APARNA IMAGE GENERATION");
    console.log("=================================");

    console.log({
      time,
      mood,
      outfit_id,
      location,
      shot,
    });

    // ============================================================
    // 2. PROMPT OPENCLAW
    // ============================================================

    const prompt = `
You are Aparna's image-generation controller.

Your task is to generate ONE highly photorealistic Instagram-ready
photograph of Aparna.

USER SELECTED PARAMETERS

TIME:
${time}

MOOD:
${mood}

OUTFIT ID:
${outfit_id}

LOCATION:
${location}

CAMERA / SHOT:
${shot}


============================================================
APARNA IDENTITY
============================================================

Aparna is a fictional adult Indian woman.

She has an established visual identity.

Before generating the image, inspect the available Aparna workspace
and visual references.

Read/use:

SOUL.md
data/state.json
data/wardrobe.json
data/life.md

Visual references:

references/face/
references/body/
references/hair/

Location references:

locations/


============================================================
IDENTITY CONSISTENCY
============================================================

The generated woman MUST be Aparna.

Do NOT create a generic AI fashion model.

Preserve:

- facial structure
- facial proportions
- eyes
- eyebrows
- nose
- lips
- jawline
- cheek structure
- skin tone
- body proportions
- height impression
- hair length
- hair texture
- hair color
- overall age appearance

Do not randomly redesign her face.

Do not make her look like a different model.

Do not make her look younger or older.

Do not beautify her into a generic commercial model.

The image should feel like another photograph of the SAME PERSON
taken on another day.


============================================================
HUMAN PHOTOGRAPHY REQUIREMENT
============================================================

This is extremely important:

The final image MUST look like a photograph of a REAL HUMAN BEING.

It must NOT look AI-generated.

Prioritize believable photography over perfection.

Use:

- natural facial asymmetry
- realistic skin texture
- subtle pores
- subtle fine lines
- natural under-eye texture
- realistic lips
- natural skin variation
- tiny imperfections
- realistic hair strands
- natural flyaway hairs
- realistic body asymmetry
- natural posture
- realistic hands
- realistic fingers
- realistic joints
- physically believable anatomy


============================================================
SKIN
============================================================

Avoid:

- plastic skin
- waxy skin
- porcelain skin
- excessive smoothing
- airbrushed skin
- unrealistic skin glow
- excessive beauty retouching
- perfectly uniform skin

Skin should have:

- subtle texture
- realistic pores
- natural tonal variation
- believable highlights
- believable shadows
- small natural imperfections


============================================================
FACE
============================================================

Avoid the typical AI-generated face.

Do NOT make:

- perfectly symmetrical eyes
- overly sharp jawline
- unnaturally perfect skin
- oversized eyes
- exaggerated lips
- artificial beauty-filter appearance
- doll-like appearance

Maintain subtle natural asymmetry.

The face should look like it was captured by a real camera.


============================================================
HAIR
============================================================

Hair should look physically real.

Include:

- individual strands
- realistic density
- natural flyaways
- slightly imperfect styling
- believable shadows between hair strands
- realistic interaction with light

Avoid:

- solid plastic hair
- painted-looking hair
- perfectly separated curls
- CGI hair


============================================================
BODY AND ANATOMY
============================================================

Use realistic human anatomy.

Hands and fingers are especially important.

Make sure:

- fingers have correct anatomy
- hands have natural positioning
- arms connect naturally to shoulders
- legs have realistic proportions
- feet look natural
- joints bend naturally
- posture is physically plausible

Avoid exaggerated body proportions unless they are explicitly defined
by Aparna's established reference.

Do not create a mannequin-like body.


============================================================
CLOTHING
============================================================

The selected outfit must come from the canonical wardrobe.

Do NOT invent a completely different outfit.

Preserve the garment's:

- color
- shape
- silhouette
- material
- neckline
- sleeves
- straps
- seams
- length
- construction
- pattern
- texture

Fabric must behave realistically.

Include:

- natural wrinkles
- realistic folds
- believable tension
- realistic seams
- natural compression
- realistic shadows
- physically believable contact between clothing and body

Avoid clothing that looks painted onto the body.


============================================================
TIME
============================================================

Use the selected time to determine:

- lighting
- color temperature
- environment
- shadows
- atmosphere
- activity

Do not simply place text describing the time.

For example:

Morning:
soft daylight and natural indoor activity.

Afternoon:
brighter natural light.

Evening:
warm indoor lights mixed with fading daylight.

Night:
appropriate indoor/night lighting.

The lighting must physically match the selected time.


============================================================
MOOD
============================================================

Use the selected mood to influence:

- facial expression
- eyes
- posture
- body language
- pose
- energy

The expression should remain subtle and believable.

Do not create exaggerated influencer expressions.

Avoid:

- forced smiling
- exaggerated posing
- unnatural seduction
- mannequin poses


============================================================
LOCATION
============================================================

Use the selected location:

${location}

The environment should look physically believable.

Respect the established Aparna environment from:

locations/

If the location is her Mumbai apartment, maintain continuity
with her established apartment style.

Do not create a luxury hotel, palace or unrealistic penthouse
unless explicitly specified.


============================================================
CAMERA
============================================================

Selected shot:

${shot}

Make the image look like it was captured using a real camera
or modern smartphone.

Use realistic:

- lens characteristics
- perspective
- depth of field
- exposure
- white balance
- focus
- shadows
- reflections
- motion characteristics

The photograph can contain tiny imperfections.

It should NOT look perfectly rendered.


============================================================
PHOTOGRAPHIC REALISM
============================================================

Think:

"real photograph taken by a real person"

NOT:

"AI influencer photograph"

NOT:

"3D render"

NOT:

"CGI character"

NOT:

"video game character"

NOT:

"plastic mannequin"

NOT:

"beauty advertisement"

NOT:

"perfect stock photograph"

NOT:

"uncanny AI portrait"


Use realistic photographic characteristics:

- natural exposure
- subtle lens softness
- realistic depth of field
- realistic shadow falloff
- natural highlights
- believable reflections
- slight optical imperfections
- realistic skin response to light
- physically plausible shadows


============================================================
COMPOSITION
============================================================

Create exactly ONE photograph.

Do NOT create:

- collage
- split screen
- contact sheet
- multiple poses
- multiple versions
- before/after
- multiple people

Follow the requested shot:

${shot}


============================================================
INSTAGRAM STYLE
============================================================

The photograph should be suitable for Instagram.

It should feel like something Aparna genuinely photographed
or had a friend photograph.

Avoid overly commercial fashion-campaign aesthetics.

A casual, authentic photograph is preferred over perfection.


============================================================
FINAL QUALITY TEST
============================================================

Before returning the result, inspect the generated image.

Check:

1. Does she look like a real human?
2. Does she look like Aparna?
3. Does the face remain consistent?
4. Does the anatomy look natural?
5. Do the hands and fingers look correct?
6. Does the clothing look physically real?
7. Does the lighting match the selected time?
8. Does the environment match the location?
9. Does the expression match the mood?
10. Does the image look like a genuine photograph?

If something looks obviously artificial, regenerate or correct it
before returning the final image.

Generate ONE final image.

After generation, return:

{
  "status": "generated",
  "description": "...",
  "image": "..."
}
`;

    console.log(
      "Calling OpenClaw image generation..."
    );

    // ============================================================
    // 3. CALL OPENCLAW
    // ============================================================

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

    // ============================================================
    // 4. PARSE OPENCLAW RESPONSE
    // ============================================================

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

    // ============================================================
    // 5. EXTRACT MEDIA
    //
    // Actual OpenClaw structure:
    //
    // result
    //   └── payloads
    //       └── mediaUrl
    // ============================================================

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

    console.log(
      "Generated image path:",
      imagePath
    );

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

    // ============================================================
    // 6. VERIFY IMAGE
    // ============================================================

    if (!fs.existsSync(imagePath)) {
      console.error(
        "Generated image does not exist:"
      );

      console.error(
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

    console.log(
      "Generated image verified."
    );

    // ============================================================
    // 7. COPY TO NEXT.JS PUBLIC DIRECTORY
    // ============================================================

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

    // ============================================================
    // 8. CREATE UNIQUE FILE NAME
    // ============================================================

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

    // ============================================================
    // 9. COPY IMAGE
    // ============================================================

    fs.copyFileSync(
      imagePath,
      destination
    );

    console.log(
      "Image copied to:",
      destination
    );

    // ============================================================
    // 10. VERIFY COPY
    // ============================================================

    if (!fs.existsSync(destination)) {
      return NextResponse.json(
        {
          error:
            "Image was generated but could not be copied to the Next.js public directory.",
        },
        { status: 500 }
      );
    }

    // ============================================================
    // 11. RETURN BROWSER URL
    // ============================================================

    const browserImageUrl =
      `/generated/${filename}`;

    console.log(
      "Browser image URL:",
      browserImageUrl
    );

    console.log(
      "================================="
    );

    // ============================================================
    // 12. SEND IMAGE TO UI
    // ============================================================

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
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
      contentType,
      reelStyle,
      thirstLevel,
    });

    const isReel =
      contentType === "reel_cover" ||
      contentType === "reel_frame";

    const prompt = `
You are Aparna's image-generation controller.

Your task is to generate ONE highly photorealistic Instagram-ready
photograph of Aparna.

============================================================
USER SELECTED PARAMETERS
============================================================

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

CONTENT TYPE:
${contentType}

REEL STYLE:
${reelStyle}

THIRST LEVEL:
${thirstLevel}/5

============================================================
REEL CONTENT MODE
============================================================

${
  isReel
    ? `
This image is a frame/cover for a short-form Instagram Reel.

The Reel direction is:

INDIAN GLAM THIRST-TRAP FASHION

The content should be:

- glamorous
- confident
- revealing fashion
- flirtatious
- visually attention-grabbing
- fashion-forward
- social-media-native
- realistic

Aparna can deliberately pose for the camera.

She can have strong eye contact.

She can use confident body language.

She can wear revealing fashion when that is what the canonical
wardrobe item contains.

The composition may emphasize:

- outfit silhouette
- saree drape
- blouse design
- waistline
- back detail
- neckline
- fabric movement
- jewellery
- confident posture

The content must remain non-explicit fashion/lifestyle content.

Do NOT depict explicit sexual activity.

Do NOT create pornography.

Do NOT invent a different garment simply to make the image more
provocative.

The selected wardrobe item remains authoritative.

The image should feel like a real Instagram Reel frame captured
with a modern smartphone.

Read:

skills/reel-engine/SKILL.md

Follow its rules for:

- thirst level
- Indian glamour
- camera
- posing
- expression
- Reel composition
- variation
- realism
- originality
`
    : `
This is a normal Instagram photograph.

Do not force a Reel aesthetic.

Use the selected mood and scene naturally.
`
}

============================================================
APARNA IDENTITY
============================================================

Aparna is a fictional adult Indian woman.

She has an established visual identity.

Before generating:

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
- hair colour
- overall age appearance

Do not randomly redesign her face.

Do not make her look like a different model.

Do not make her look younger or older.

Do not beautify her into a generic commercial model.

The image should feel like another photograph of the SAME PERSON
taken on another day.

============================================================
HUMAN PHOTOGRAPHY
============================================================

The final image MUST look like a photograph of a real human being.

It must NOT look AI-generated.

Prioritize believable photography over perfection.

Use:

- natural facial asymmetry
- realistic skin texture
- subtle pores
- natural under-eye texture
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
- unrealistic glow
- excessive beauty retouching
- perfectly uniform skin

Skin should have:

- subtle texture
- realistic pores
- tonal variation
- believable highlights
- believable shadows
- small natural imperfections

============================================================
FACE
============================================================

Avoid the typical AI-generated face.

Do NOT create:

- perfectly symmetrical eyes
- oversized eyes
- exaggerated lips
- artificial beauty-filter appearance
- doll-like appearance
- unnaturally sharp jawline

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
- believable shadows
- realistic interaction with light

Avoid:

- solid plastic hair
- painted hair
- CGI hair
- perfectly separated curls

============================================================
BODY AND ANATOMY
============================================================

Use realistic human anatomy.

Hands and fingers are especially important.

Make sure:

- fingers have correct anatomy
- hands have natural positioning
- arms connect naturally
- legs have realistic proportions
- feet look natural
- joints bend naturally
- posture is physically plausible

Do not create a mannequin-like body.

Do not randomly change Aparna's established body identity.

============================================================
CLOTHING
============================================================

The selected outfit MUST come from the canonical wardrobe.

OUTFIT ID:

${outfit_id}

Do NOT invent a completely different outfit.

Preserve:

- colour
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
- embellishments
- drape

Fabric must behave realistically.

Include:

- natural wrinkles
- realistic folds
- believable tension
- realistic seams
- natural compression
- realistic shadows
- physical contact between garment and body

Avoid clothing that looks painted onto the body.

If the canonical garment is revealing, preserve its actual design.

Do not arbitrarily increase exposure.

============================================================
TIME
============================================================

Use the selected time to determine:

- lighting
- colour temperature
- environment
- shadows
- atmosphere
- activity

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

The expression should remain believable.

For high thirst levels, confidence and camera awareness can increase.

Do not create exaggerated influencer expressions.

============================================================
LOCATION
============================================================

Use:

${location}

The environment should look physically believable.

Respect established Aparna environments from:

locations/

If this is her Mumbai apartment, maintain continuity with the
established apartment.

Do not create a luxury hotel, palace or unrealistic penthouse unless
explicitly specified.

============================================================
CAMERA
============================================================

Selected shot:

${shot}

Make the image look like it was captured using a real camera or
modern smartphone.

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

The image may contain tiny photographic imperfections.

It should NOT look perfectly rendered.

============================================================
SOCIAL MEDIA COMPOSITION
============================================================

For Reel content:

- prioritize vertical 9:16 composition
- keep Aparna clearly visible
- make the first visual moment strong
- avoid unnecessary empty space
- keep important facial/outfit details inside the safe central area
- make the composition readable on a phone
- make the frame visually compelling without text

For a thirst level of ${thirstLevel}/5:

${
  thirstLevel === 1
    ? "Use attractive but mostly lifestyle-oriented fashion."
    : thirstLevel === 2
      ? "Use polished glamorous fashion with moderate camera awareness."
      : thirstLevel === 3
        ? "Use clearly flirtatious fashion, confident posing and eye contact."
        : thirstLevel === 4
          ? "Use a strong thirst-trap fashion composition with revealing styling, confident silhouette and deliberate camera attention."
          : "Use very provocative fashion styling, strong silhouette and intimate camera awareness while remaining non-explicit."
}

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

"perfect stock photograph"

Use:

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

The image should feel like something Aparna genuinely photographed
or had a friend photograph.

Avoid overly commercial fashion-campaign aesthetics.

Prefer:

- authentic
- intimate
- phone-camera feeling
- believable
- visually attractive
- confident
- modern Indian fashion

============================================================
FINAL QUALITY TEST
============================================================

Before returning the result, inspect the generated image.

Check:

1. Does she look like a real human?
2. Does she look like Aparna?
3. Does the face remain consistent?
4. Does the body identity remain consistent?
5. Does the anatomy look natural?
6. Do the hands and fingers look correct?
7. Does the clothing look physically real?
8. Does the garment match the wardrobe?
9. Does the lighting match the selected time?
10. Does the environment match the location?
11. Does the expression match the mood?
12. Does the image work for Instagram?
13. If Reel content, does it look visually compelling in 9:16?
14. Is the content revealing but non-explicit?
15. Does it look like a genuine photograph?

If something looks obviously artificial, correct or regenerate it before
returning the final image.

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
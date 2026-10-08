import fs from "fs/promises";
import path from "path";

export type PromptInput = {
  time: string;
  mood: string;
  outfit_id: string;
  wearing_intent_id?: string;
  location: string;
  shot: string;
  content_type?: string;
  reel_style?: string;
  photography_style?: string;
  thirst_level?: number;
};

type AnyRecord = Record<string, any>;

const CONTEXT_FILES = [
  "SOUL.md",
  "IDENTITY.md",
  "LIFE.md",
  "WORK.md",
  "FAMILY.md",
  "RELATIONSHIPS.md",
  "CURRENT_STATE.md",
];

function getWorkspace() {
  return (
    process.env.APARNA_WORKSPACE ||
    path.resolve(process.cwd(), "..")
  );
}

async function readOptional(filePath: string) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

async function readWardrobe() {
  const file = path.join(
    getWorkspace(),
    "data",
    "wardrobe.json"
  );

  const raw = await fs.readFile(file, "utf8");
  const parsed = JSON.parse(raw);

  return Array.isArray(parsed.items)
    ? parsed.items
    : [];
}

function compact(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function getGarment(item: AnyRecord) {
  return item.garment || {
    name: item.name,
    brand: item.brand,
    category: item.category,
    color: item.color,
    fit: item.fit,
    length: item.length,
    details: item.details,
  };
}

function getIntent(item: AnyRecord, intentId?: string) {
  if (!intentId || intentId === "default") {
    return null;
  }

  const intents = Array.isArray(item.wearing_intents)
    ? item.wearing_intents
    : [];

  return (
    intents.find(
      (intent: AnyRecord) => intent?.id === intentId
    ) || null
  );
}

function buildPrompt(
  input: PromptInput,
  garment: AnyRecord,
  intent: AnyRecord | null
) {
  const template = `Create ONE highly photorealistic photograph of Aparna Roy, an adult fictional Indian woman living in Mumbai.

CORE IDENTITY
- Preserve Aparna's established facial identity, skin tone, hair identity, age and body proportions.
- She must look like the same real person across generations.
- Do not turn her into a generic fashion model.
- Keep realistic human asymmetry, skin texture, hands, fingers, joints and anatomy.
- Identity consistency does NOT mean repeating the same expression or pose.

CURRENT MOMENT
Time: %%TIME%%
Mood: %%MOOD%%
Location: %%LOCATION%%
Shot: %%SHOT%%
Content type: %%CONTENT_TYPE%%
Reel style: %%REEL_STYLE%%

The photograph should feel like a believable moment from Aparna's actual life, not a staged AI fashion shoot. Choose natural behavior appropriate to the moment. Let the action, environment and mood determine her expression, body language and camera awareness.

EXPRESSION AND BODY LANGUAGE
Do not default to a smile, direct eye contact or a seductive expression.
Use a believable expression for the moment: relaxed, thoughtful, amused, distracted, focused, tired, curious, subtly playful, mildly irritated, content, confident, mischievous, neutral or genuinely happy.
Use natural weight distribution, imperfect posture, small facial movements and realistic interaction with the environment.
Avoid the repeated "beautiful woman standing and looking at camera" composition.

WARDROBE
The selected wardrobe item is authoritative:
%%GARMENT%%

Preserve the actual garment's color, material, silhouette, construction, neckline, sleeves or straps, length, seams, pattern, texture, embellishments and drape.
Do not invent a different garment.
Do not alter the garment to increase exposure.
Use realistic wrinkles, fabric tension, folds, compression and contact shadows.

WEARING INTENT
%%WEARING_INTENT%%

If a wearing intent is supplied, it is authoritative for HOW the garment is worn. Preserve its position, drape, tuck, layering, silhouette, exposure intent and listed constraints.

PHOTOGRAPHY
Photography style: %%PHOTOGRAPHY%%
- real camera or modern smartphone photography
- physically plausible perspective and lens behavior
- realistic exposure and depth of field
- believable shadows and reflections
- natural skin texture
- realistic fabric/environment interaction
- imperfect framing when the selected shot calls for it
- no plastic skin, CGI appearance, mannequin anatomy, collage or split screen

SOCIAL PRESENTATION
Thirst level: %%THIRST%%/5.
This controls presentation and camera energy, NOT garment modification.
Keep the result fashion-focused and non-explicit.
Reel style should influence composition, attitude and visual energy without overriding the real-life moment.

LOCATION CONTINUITY
%%LOCATION%% is part of Aparna's established Mumbai environment. Keep the environment believable, lived-in and consistent with a premium but realistic Mumbai apartment or the selected real-world setting. Do not turn an ordinary home into a palace, penthouse, hotel or generic luxury set.

COMPOSITION
Create one clear photographic moment.
Vary perspective, framing, camera awareness, expression, body language and interaction with the environment.
The subject does not need to be centered.
The subject does not need to look at the camera.
Do not repeat a previous-looking model pose unless the selected scene genuinely calls for it.

NEGATIVE CONSTRAINTS
generic AI fashion model, beauty-filter skin, waxy skin, mannequin anatomy, duplicated person, extra limbs, malformed hands, impossible joints, floating clothing, incorrect garment construction, changed garment, wrong wearing style, artificial studio background, excessive retouching, CGI, 3D render, collage, split screen, multiple versions of Aparna, sexual activity, pornography.

Output one realistic photograph in vertical 9:16 composition, suitable as an Instagram Reel cover.`;

  return template
    .replaceAll("%%TIME%%", input.time)
    .replaceAll("%%MOOD%%", input.mood)
    .replaceAll("%%LOCATION%%", input.location)
    .replaceAll("%%SHOT%%", input.shot)
    .replaceAll(
      "%%CONTENT_TYPE%%",
      input.content_type || "reel_cover"
    )
    .replaceAll(
      "%%REEL_STYLE%%",
      input.reel_style || "indian_glam_thirst_trap"
    )
    .replaceAll(
      "%%GARMENT%%",
      compact(garment)
    )
    .replaceAll(
      "%%WEARING_INTENT%%",
      intent
        ? compact(intent)
        : "Use the garment's canonical/default styling. Do not invent a special wearing configuration."
    )
    .replaceAll(
      "%%PHOTOGRAPHY%%",
      input.photography_style || "candid_realism"
    )
    .replaceAll(
      "%%THIRST%%",
      String(input.thirst_level ?? 4)
    );
}

export async function buildAparnaGeneration(input: PromptInput) {
  const workspace = getWorkspace();
  const items = await readWardrobe();

  const item = items.find(
    (entry: AnyRecord) =>
      entry?.id === input.outfit_id
  );

  if (!item) {
    throw new Error("Selected wardrobe item was not found.");
  }

  const context: Record<string, string> = {};

  for (const file of CONTEXT_FILES) {
    const content = await readOptional(
      path.join(workspace, file)
    );

    if (content) {
      context[file] = content;
    }
  }

  const garment = getGarment(item);
  const intent = getIntent(
    item,
    input.wearing_intent_id
  );

  const scene = {
    character: "Aparna Roy",
    time: input.time,
    mood: input.mood,
    activity:
      "A believable everyday moment selected from the current life state.",
    location: input.location,
    shot: input.shot,
    content_type: input.content_type || "reel_cover",
    reel_style:
      input.reel_style || "indian_glam_thirst_trap",
    photography_style:
      input.photography_style || "candid_realism",
    thirst_level: input.thirst_level ?? 4,
    outfit: {
      id: item.id,
      name: item.name || garment.name,
      garment,
    },
    wearing_intent: intent,
  };

  const prompt = buildPrompt(
    input,
    garment,
    intent
  );

  return {
    prompt,
    scene,
    garment,
    wearingIntent: intent,
    context,
    metadata: {
      generated_at: new Date().toISOString(),
      context_files: Object.keys(context),
      wardrobe_id: item.id,
      wearing_intent_id:
        input.wearing_intent_id || "default",
    },
  };
}

export async function buildAparnaExport(input: PromptInput) {
  const generation = await buildAparnaGeneration(input);

  const contextMarkdown = Object.entries(
    generation.context
  )
    .map(
      ([file, content]) =>
        "## " + file + "\n\n" + content.trim()
    )
    .join("\n\n");

  return `# APARNA GENERATION PACKAGE

Generated: %%GENERATED%%

This package is model-independent. It contains the selected scene,
canonical image-generation context, wardrobe information, wearing
intent and final image prompt.

Use the PROMPT section directly with an image model.
Use SCENE JSON when rebuilding the same request programmatically.

---

# PROMPT

%%PROMPT%%

---

# SCENE JSON

\`\`\`json
%%SCENE%%
\`\`\`

---

# SELECTED WARDROBE

\`\`\`json
%%GARMENT%%
\`\`\`

---

# WEARING INTENT

\`\`\`json
%%INTENT%%
\`\`\`

---

# CANONICAL APARNA CONTEXT

%%CONTEXT%%

---

# REFERENCE DIRECTORIES

The local Aparna repository may contain visual references under:
- references/
- locations/home_mumbai_01/
- wardrobe/

When using another image model, attach the relevant identity,
wardrobe and location references separately. The text in this package
does not contain binary image files.

---

# GENERATION METADATA

\`\`\`json
%%METADATA%%
\`\`\`
`
    .replace("%%GENERATED%%", generation.metadata.generated_at)
    .replace("%%PROMPT%%", generation.prompt.trim())
    .replace("%%SCENE%%", compact(generation.scene))
    .replace("%%GARMENT%%", compact(generation.garment))
    .replace("%%INTENT%%", compact(generation.wearingIntent))
    .replace("%%CONTEXT%%", contextMarkdown)
    .replace("%%METADATA%%", compact(generation.metadata));
}

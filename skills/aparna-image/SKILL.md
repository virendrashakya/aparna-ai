# APARNA IMAGE GENERATION SKILL

## PURPOSE

Generate one realistic photograph of Aparna using her established
visual identity, canonical wardrobe, location references, and current
life state.

The goal is:

"another real photograph of Aparna"

NOT:

"a newly generated AI woman who resembles Aparna."

---

# 1. INPUT PRIORITY

When generating an image, use information in this priority order:

1. Visual identity references
2. Canonical wardrobe references
3. Location references
4. Current state
5. Current life context
6. SOUL.md
7. Scene-specific instructions

Never replace visual references with text descriptions when a reference
image exists.

---

# 2. REQUIRED WORKSPACE DATA

Before generating an image, inspect the relevant files.

Required:

SOUL.md
data/state.json
data/wardrobe.json
data/life.md
references/
locations/

For visual identity, use:

references/face/
references/body/
references/hair/

For locations, use the relevant location directory under:

locations/

For wardrobe, use:

data/wardrobe.json

and the selected wardrobe item's local visual references.

---

# 3. VISUAL IDENTITY

Aparna is a fictional adult Indian woman with an established visual
identity.

The generated image MUST depict the same established person.

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

Do not create a generic AI fashion model.

Do not substitute another woman.

Do not intentionally make her younger or older.

Do not transform her into a commercial fashion-model identity.

---

# 4. HUMAN PHOTOGRAPHY

The output should look like a photograph of a real person.

Prioritize photographic realism over perfection.

Use:

- natural facial asymmetry
- realistic skin texture
- subtle pores
- natural tonal variation
- realistic hair strands
- natural flyaway hair
- believable anatomy
- realistic hands
- realistic fingers
- realistic joints
- physically plausible posture
- realistic fabric behavior
- natural lighting
- realistic depth of field
- realistic camera perspective

Avoid:

- plastic skin
- waxy skin
- porcelain skin
- beauty-filter appearance
- CGI appearance
- mannequin appearance
- 3D-render appearance
- perfect facial symmetry
- excessive beauty retouching
- artificial skin glow
- overly polished commercial photography

---

# 5. FACE

The face must remain consistent with Aparna's established visual
references.

Do not reconstruct her identity from generic textual descriptions
when visual references are available.

Avoid:

- oversized eyes
- exaggerated lips
- unnaturally sharp jaw
- perfect symmetry
- artificial skin
- generic influencer face
- doll-like appearance

The final face should feel like the same person photographed under
different lighting and on a different day.

---

# 6. HAIR

Preserve Aparna's established hairstyle and hair characteristics.

Hair should contain:

- individual strands
- realistic density
- natural flyaways
- believable shadows
- physically plausible interaction with light

Avoid:

- plastic-looking hair
- painted hair
- CGI hair
- perfectly separated strands
- unnaturally perfect styling

---

# 7. BODY AND ANATOMY

Use the established body reference.

Do not invent exaggerated proportions.

Hands and feet require special attention.

Check:

- finger count
- finger structure
- hand position
- wrist connection
- arm connection
- shoulder anatomy
- leg proportions
- knee structure
- ankle structure
- feet
- natural posture

Avoid mannequin-like anatomy.

---

# 8. WARDROBE

The selected outfit MUST come from the canonical wardrobe.

Resolve the outfit ID against:

data/wardrobe.json

Then resolve its visual references.

Do not invent a replacement garment.

Preserve:

- color
- silhouette
- material
- neckline
- sleeves
- straps
- seams
- buttons
- length
- construction
- pattern
- texture
- distinctive garment details

Fabric must behave physically.

Use:

- natural wrinkles
- realistic folds
- realistic tension
- believable seams
- natural compression
- realistic contact shadows

Do not make clothing look painted onto the body.

---

# 9. GARMENT SAFETY / PRODUCT REFERENCE

Retailer product images are garment references.

They are NOT identity references.

Never copy the retailer model's:

- face
- body
- hair
- pose
- identity

Use only the garment information.

If the wardrobe item contains an AI-processed garment-only reference,
prefer that reference over the original retailer model photograph.

---

# 10. CATEGORY-AWARE WARDROBE

Different garment categories require different handling.

## Dress

Preserve the complete dress:

- neckline
- bodice
- sleeves
- straps
- waist
- skirt
- hem
- construction
- decorative details

## Top

Preserve:

- neckline
- shoulders
- sleeves
- torso
- hem
- construction details

## Bottom

Preserve:

- waistband
- rise
- pockets
- seams
- legs/skirt structure
- hem

## Saree

Preserve:

- saree textile
- border
- pallu
- print
- embroidery
- drape characteristics

Do not convert a saree into a generic dress.

## Lehenga

Treat as a coordinated set:

- lehenga
- blouse/choli
- dupatta

## Salwar Suit

Treat as:

- kurta
- bottom
- dupatta

## Co-ord Set

Treat as:

- top
- matching bottom

---

# 11. LOCATION

Respect the selected location.

For Aparna's Mumbai apartment, preserve established environmental
continuity.

Do not randomly turn the apartment into:

- hotel
- palace
- penthouse
- luxury showroom
- Dubai-style apartment
- unrealistic mansion

Use the relevant location reference from:

locations/

---

# 12. TIME

Use the requested time to determine the physical lighting.

Morning:

- natural daylight
- softer shadows
- fresh indoor atmosphere

Afternoon:

- brighter daylight
- stronger natural illumination

Evening:

- fading daylight
- warm indoor lights
- mixed color temperature
- realistic dusk ambience

Night:

- appropriate artificial indoor lighting
- darker windows
- realistic exposure

Do not simply describe the time.

Make the lighting physically reflect it.

---

# 13. MOOD

Use mood to influence:

- expression
- posture
- gaze
- body language
- energy

Keep the expression believable.

Avoid:

- exaggerated influencer expressions
- forced smiling
- artificial seduction
- theatrical posing
- mannequin posing

---

# 14. CAMERA

The selected shot determines composition.

Examples:

Full body:

- entire person visible
- feet visible where appropriate
- natural camera distance
- believable perspective

Half body:

- natural crop

Portrait:

- realistic facial framing

Use realistic:

- focal length
- perspective
- depth of field
- exposure
- white balance
- focus
- shadow falloff
- optical characteristics

The photograph may contain subtle imperfections.

---

# 15. INSTAGRAM REALISM

The result should feel like something Aparna genuinely photographed or
had a friend photograph.

Prefer:

- natural framing
- realistic smartphone/camera characteristics
- slightly imperfect composition
- believable lighting
- ordinary apartment details
- natural posture

Avoid:

- fashion campaign aesthetic
- stock photography
- studio perfection
- excessive retouching
- artificial influencer aesthetic

---

# 16. EXACTLY ONE IMAGE

Generate exactly ONE photograph.

Never generate:

- collage
- contact sheet
- split screen
- multiple poses
- multiple versions
- before/after
- multiple people

unless explicitly requested.

---

# 17. IMAGE GENERATION PROCESS

Follow this process:

1. Resolve Aparna identity references.
2. Resolve selected wardrobe item.
3. Resolve garment visual references.
4. Resolve location reference.
5. Resolve time.
6. Resolve mood.
7. Resolve camera/shot.
8. Construct concise generation prompt.
9. Call the image-generation tool.
10. Inspect the result.
11. Check identity consistency.
12. Check anatomy.
13. Check wardrobe accuracy.
14. Check environment.
15. Check lighting.
16. Check photographic realism.
17. Return the accepted image.

Do not unnecessarily repeat the same generation request.

---

# 18. CONTENT MODERATION HANDLING

This section is critical.

If the image-generation provider rejects the request because of
content moderation, DO NOT repeatedly retry the same request.

Treat the moderation result as terminal for that generation attempt.

Recognize errors containing terms such as:

- content-moderated
- content moderation
- moderation
- safety
- policy violation
- safety filter
- rejected by content moderation
- imagine:content-moderated

When such an error occurs:

1. Stop the current generation attempt.
2. Do not call image generation again with the same prompt.
3. Do not repeatedly modify wording to try to bypass moderation.
4. Do not retry the same reference image repeatedly.
5. Do not wait for the task to naturally time out.
6. Return a structured failure immediately.

Use:

{
  "status": "moderated",
  "reason": "xai_content_moderation",
  "retryable": false,
  "description": "The image-generation provider rejected this generation request through its content-moderation system.",
  "image": null
}

If the provider exposes a different moderation error string, normalize
it to the same result.

The controller must NOT attempt to circumvent provider safety
controls.

---

# 19. NON-MODERATION FAILURES

For normal transient failures:

- timeout
- temporary provider failure
- network failure
- unavailable provider
- temporary server error

a retry may be appropriate according to the surrounding OpenClaw
workflow.

However:

CONTENT MODERATION != TRANSIENT FAILURE

Never treat a moderation rejection as a normal retryable error.

---

# 20. ABORT HANDLING

If the image-generation task is aborted after a provider moderation
failure, preserve the original moderation state.

Do not reinterpret the final error:

"This operation was aborted"

as the primary cause.

If an earlier provider response contains:

content-moderated

then the correct result remains:

{
  "status": "moderated",
  "reason": "xai_content_moderation",
  "retryable": false
}

The provider moderation event is the root cause.

---

# 21. QUALITY CONTROL

After successful generation inspect:

1. Is this a real-looking human photograph?
2. Is this the same Aparna?
3. Is the face consistent?
4. Is the body consistent?
5. Are the hands correct?
6. Are the fingers correct?
7. Is the anatomy plausible?
8. Is the wardrobe correct?
9. Does the garment construction match the canonical wardrobe?
10. Are the fabric folds realistic?
11. Is the location correct?
12. Does the lighting match the requested time?
13. Does the expression match the requested mood?
14. Does the image look like a genuine photograph?
15. Is there only one image?

If the image has a clear technical defect, a targeted correction may be
attempted.

Do not repeatedly regenerate an image that has been rejected by content
moderation.

---

# 22. OUTPUT

Successful generation:

{
  "status": "generated",
  "description": "...",
  "image": "..."
}

Moderated generation:

{
  "status": "moderated",
  "reason": "xai_content_moderation",
  "retryable": false,
  "description": "The image-generation provider rejected this generation request through its content-moderation system.",
  "image": null
}

Technical failure:

{
  "status": "failed",
  "reason": "provider_error",
  "retryable": true,
  "description": "...",
  "image": null
}

---

# 23. FINAL PRINCIPLE

The goal is not:

"Generate an attractive AI woman."

The goal is:

"Generate another believable photograph of Aparna wearing the
selected canonical wardrobe item in her established environment."

Identity consistency > garment accuracy > environmental continuity >
photographic realism > aesthetic perfection.
# Aparna Image Generation Skill

## Purpose

Generate photographs of Aparna as the SAME fictional adult woman across
different days, outfits, locations, moods and situations.

The objective is NOT to generate a new realistic woman every time.

The objective is to create another believable photograph of the SAME Aparna.

---

# CORE PRINCIPLE

Aparna is a persistent visual identity.

Never reconstruct her identity from text alone.

Visual references have higher priority than descriptive text.

Priority order:

1. Aparna master identity reference
2. Face references
3. Body reference
4. Hair reference
5. Wardrobe reference
6. Location reference
7. Current state
8. SOUL.md
9. User-selected scene description

Text describes the situation.

Reference images define what Aparna looks like.

---

# REQUIRED INPUTS

Before image generation, resolve:

- time
- mood
- outfit
- location
- shot/camera framing

Also load:

- data/visual_identity.json
- data/wardrobe.json
- data/state.json
- SOUL.md
- relevant location references

---

# IDENTITY REFERENCES

Read:

data/visual_identity.json

The master reference is:

references/identity/master.jpg

Face references:

references/identity/face-front.jpg
references/identity/face-45.jpg
references/identity/face-profile.jpg

Body reference:

references/identity/body.jpg

Hair reference:

references/identity/hair.jpg

These references define Aparna's persistent visual identity.

Do not redesign her face.

Do not substitute another woman.

Do not create a generic Indian fashion model.

Do not make her younger.

Do not make her older.

Do not change her facial structure.

Do not change her body identity.

Do not change her hair identity.

---

# SAME PERSON RULE

Every generated image must look like another photograph of the same person.

Natural changes are allowed:

- expression
- pose
- lighting
- camera angle
- clothing
- accessories
- environment

Identity changes are NOT allowed:

- different face
- different facial proportions
- different eyes
- different nose
- different lips
- different jaw
- different body identity
- different age appearance
- completely different hair identity

---

# WARDROBE

When an outfit is selected:

1. Read data/wardrobe.json.
2. Find the selected outfit ID.
3. Resolve its visual reference images.
4. Use those images as the garment reference.
5. Preserve the actual garment.

Do not invent a different garment when a visual reference exists.

Preserve:

- color
- material
- silhouette
- neckline
- sleeves
- straps
- length
- seams
- patterns
- construction
- texture
- hardware
- embroidery
- prints

The garment must behave like real fabric.

Use realistic:

- folds
- wrinkles
- tension
- compression
- seams
- shadows
- contact with the body

Never make clothing look painted onto the body.

---

# LOCATION

When a known Aparna location is selected:

Use the established location reference from:

locations/

Preserve the established:

- room structure
- furniture
- walls
- windows
- doors
- balcony
- kitchen layout
- bedroom layout
- general architectural identity

Do not randomly redesign Aparna's apartment.

---

# PHOTOGRAPHIC REALISM

The result must look like a real photograph of a real adult woman.

Think:

"real person photographed by a real camera"

NOT:

"AI fashion model"

NOT:

"3D render"

NOT:

"CGI character"

NOT:

"beauty advertisement"

NOT:

"perfect stock photograph"

NOT:

"plastic AI influencer"

---

# FACE REALISM

Use:

- natural facial asymmetry
- realistic skin texture
- realistic pores
- subtle skin variation
- natural lips
- realistic eyes
- natural under-eye texture
- subtle imperfections
- realistic facial shadows

Avoid:

- plastic skin
- waxy skin
- porcelain skin
- excessive smoothing
- beauty-filter skin
- perfect symmetry
- oversized eyes
- exaggerated lips
- artificial facial glow

---

# HAIR REALISM

Hair must look physically real.

Use:

- individual strands
- natural flyaways
- realistic density
- natural volume
- believable shadows
- realistic interaction with light

Avoid:

- plastic hair
- painted hair
- CGI hair
- perfectly separated artificial strands

---

# BODY REALISM

Use natural human anatomy.

Check:

- shoulders
- arms
- elbows
- wrists
- hands
- fingers
- torso
- hips
- knees
- ankles
- feet

Avoid:

- mannequin anatomy
- distorted limbs
- unnatural joints
- impossible posture
- exaggerated proportions
- floating body parts

---

# HANDS

Hands require special attention.

Before accepting the image check:

- correct number of fingers
- realistic finger length
- realistic joints
- natural hand position
- believable contact with objects
- believable connection between wrist and hand

If hands are visibly incorrect, reject the image.

---

# CAMERA REALISM

The photograph should behave like an actual camera photograph.

Use believable:

- perspective
- exposure
- white balance
- depth of field
- focus
- lens characteristics
- shadows
- reflections
- highlights

Do not make every photograph look like a commercial fashion campaign.

Some images should feel like:

- smartphone photographs
- mirror photographs
- casual indoor photographs
- photographs taken by friends
- normal lifestyle photographs

---

# LIGHTING

Lighting must match the selected time and location.

Morning:

- natural daylight
- soft shadows
- realistic indoor daylight

Afternoon:

- brighter natural light
- stronger directional light when appropriate

Evening:

- fading daylight
- warm indoor lighting
- realistic mixed lighting

Night:

- realistic interior lighting
- believable shadows
- no artificial cinematic glow unless specifically requested

---

# MOOD

Mood controls:

- expression
- eyes
- posture
- body language
- energy

Keep expressions believable.

Do not force an influencer pose.

Do not force a smile.

Do not make every image seductive.

Do not make every image glamorous.

Aparna should look like a person living her life.

---

# CONTENT REALISM

Not every photograph should be perfect.

Allow:

- slight framing imperfections
- normal posture
- ordinary expressions
- realistic background clutter
- natural hair imperfections
- normal clothing wrinkles
- realistic smartphone-camera characteristics

The goal is believable life, not perfection.

---

# IMAGE GENERATION PROCESS

Follow this sequence:

1. Load Aparna identity references.
2. Load the selected outfit reference.
3. Load the selected location reference.
4. Resolve time and mood.
5. Create the photograph using the references.
6. Inspect the generated image.
7. Check identity.
8. Check anatomy.
9. Check hands.
10. Check clothing.
11. Check lighting.
12. Check environment.
13. Check photographic realism.

---

# QUALITY CHECK

Before returning the final image, answer internally:

IDENTITY:
Does this look like the same Aparna?

FACE:
Is the facial structure consistent?

BODY:
Does the body remain consistent?

HAIR:
Does the hair identity remain consistent?

OUTFIT:
Is the selected garment correctly represented?

ANATOMY:
Are the body and hands believable?

LOCATION:
Does the environment match the selected location?

LIGHT:
Does the lighting match the selected time?

PHOTOGRAPH:
Does this look like a genuine photograph?

---

# FAILURE CONDITIONS

Reject and regenerate/edit if:

- Aparna looks like a different woman
- face identity changed significantly
- skin looks plastic
- body looks like a mannequin
- hands are visibly malformed
- clothing looks painted on
- background geometry is obviously wrong
- lighting looks artificial
- image looks like CGI
- image looks like a generic AI influencer

Prefer targeted correction/editing when possible.

Do not blindly regenerate a completely different woman.

---

# FINAL PRINCIPLE

Aparna does not get reinvented for every image.

She is one persistent fictional adult woman.

Every new image should feel like:

"Here is another photograph of Aparna."

Not:

"Here is another AI-generated woman."
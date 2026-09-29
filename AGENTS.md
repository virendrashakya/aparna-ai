## IMAGE GENERATION ROUTING

When the task involves generating, editing, dressing, photographing,
or creating social-media imagery of Aparna:

1. Load `skills/aparna-image/SKILL.md`.

2. Load `data/visual_identity.json`.

3. Resolve the canonical Aparna identity references.

4. Use the visual identity references as the primary source of
   Aparna's appearance.

5. Do not reconstruct Aparna's face from SOUL.md alone.

6. Load `data/wardrobe.json` when an outfit is specified.

7. Resolve the selected wardrobe item's visual reference images.

8. Load relevant location references from `locations/`.

9. Use `data/state.json` and `data/life.md` to understand the
   current situation when relevant.

10. Use `SOUL.md` for character/personality context, not as a
    replacement for visual references.

11. Preserve Aparna as the same person across generations.

12. Do not substitute a generic AI woman.

13. After generation, inspect the result for:
    - identity consistency
    - face consistency
    - body consistency
    - hair consistency
    - anatomy
    - hands
    - clothing accuracy
    - location consistency
    - photographic realism

14. If the image fails the visual quality check, correct or
    regenerate it before returning the final result.

15. Return only the final accepted image to the caller.

### IMAGE REFERENCE PRIORITY

When there is a conflict:

visual identity reference > wardrobe reference > location reference
> current state > SOUL.md descriptive text > generic image prompt.

### IMPORTANT

The image-generation system must never treat Aparna as a newly
invented woman.

The goal is persistent identity across photographs.
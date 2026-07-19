# 010 — Plan, lint, verification, and repairs

| Field | Value |
|---|---|
| Date | 2026-07-18, America/Los_Angeles |
| Phase | Build + verify (gates G1–G4) |
| Status after event | Plan verified after repairs; render in progress |

## Research (G1)

Live 2026 text-to-video guidance captured (Kling/Runway/Seedance prompt guides): ≤8 s clips stitched; structured prompts naming subject/environment/lighting + explicit camera move with speed/direction; native-audio blocks keeping speaker + verbatim line + delivery together; continuity via verbatim descriptor restatement per clip (generators are stateless).

## Deliverable drafted

`trailer-shot-plan.md` — "SPIN CYCLE": 2 a.m. laundromat, two men washing a shirt ("marinara"), Lorraine who knows machine eight is better for that, button "Good as new. Shame about the tie." 6 shots, 31 s.

## Mechanical lint (G2)

Script check passed: 6 numbered shots, durations [5,6,5,5,5,5] = 31 s, every shot has video-prompt/dialogue-audio/continuity blocks, ≤8 s each, title + stitch note present, 3 characters.

## Independent verification (G3/G4)

Adversarial verifier agent: **G4 voice PASS** (oblique dialogue, three-act micro-arc, no exposition; "Then we run it twice" flagged as strongest line). **G3 continuity FAIL**: shots 3, 4, 6 opened with "Same 1970s laundromat interior" — a memory reference a stateless generator cannot resolve — and dropped wardrobe descriptors (Foley's black slacks; Duke's age/chain; seating sides stated only in continuity notes the generator never sees). Also: the research note claimed 150–300-word prompts while actual prompts ran 75–115 words.

## Repairs

All five required fixes applied: full location restatement in shots 3/4/6; canonical wardrobe strings normalized ("suspenders hanging at his hips", "mustard-yellow bowling shirt", "thin gold chain"); seating sides stated in-prompt; research note reconciled. Re-render prompts now match the repaired plan.

## Render progress (G5) and defects

- Model decision: `seedance_2_0_mini`, 720p, 16:9, genre noir, native audio — 12.5 credits/clip vs 22.5 for std; 6 clips ≈ 78 of 158.64 available credits, preserving retry and later-prompt headroom (charter §6).
- Generator preset interception: shot 4 triggered a "IN THE DARK" preset recommendation; declined via `declined_preset_id` to preserve the literal prompt (user unavailable; literal generation is the contract).
- Rate limiting: submissions 429 beyond ~4 in a window; launches serialized against job completion.
- Timing luck recorded honestly: shots 1–2 were submitted with pre-repair prompts, but the verifier found no G3 defect in those two (shot 1 has no characters; shot 2 is the canonical reference shot), so no re-render is required.
- Completed so far: shot 1 (5.088 s, 3.36 MB), shot 2 (6.080 s, 3.90 MB) — downloaded to `render/`. Shots 3–4 in progress with repaired prompts; 5–6 queued behind the rate limit.

## Next gate

Complete shots 3–6, stitch with ffmpeg (+1 s black title-card fallback if the in-clip title text renders badly), frame-extract for evidence, close.

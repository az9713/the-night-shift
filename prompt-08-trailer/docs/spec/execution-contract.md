# Prompt 8 execution contract — Tarantino-style 30-second trailer shot plan

Hardened from the original benchmark prompt (see [docs/prompts.md](../../../docs/prompts.md)) (prompt 8). Original unchanged.

## Deliverables

1. **`trailer-shot-plan.md`** — the benchmark deliverable:
   - (a) Research note, 2–4 lines: text-to-video prompting best practices actually applied (clip limits, camera language, continuity technique).
   - (b) The scene as a real screenplay: heading (INT./EXT. — LOCATION — TIME), sparse action, character cues, dialogue. 2–4 characters, one location, a titled three-act micro-arc (setup → turn → button) in ~30 seconds, peak-90s-Tarantino register: oblique dialogue, menace under banality, subtext over exposition.
   - (c) Numbered shot list totaling ~30s. Every shot: number + duration (≤8s); one render-ready video prompt paragraph (framing, angle/lens/movement, subject + exact action, lighting/grade, setting, mood); dialogue/audio block (verbatim lines + SFX/score cue); continuity note (what must match the prior shot).
   - (d) One-line stitch/edit note (order, hard cuts, title-card position).
2. **Rendered trailer (user-approved stretch)** — generate each shot with available video-generation tools, stitch with ffmpeg to `trailer.mp4`. The shot list must stand alone even if generation partially fails; generation failures are recorded, not hidden.

## Gates

| Gate | Check |
|---|---|
| G1 Research | Best-practices note present and reflected in prompt style (concrete camera/lighting/audio language, per-clip ≤8s) |
| G2 Structure lint | Mechanical check: every shot has all four blocks; durations sum to 27–33s; each clip ≤8s; title present; 2–4 characters; one location |
| G3 Continuity | Character look/wardrobe/location/lighting descriptors consistent across consecutive shots (each prompt is self-contained — generators have no memory between clips) |
| G4 Voice | Reads as Tarantino pastiche: dialogue about one thing meaning another; no exposition dumps |
| G5 Render | Each shot generated; clips stitched in order to trailer.mp4; frame extraction confirms clips exist and follow shot order. Visual continuity across generated clips is judged best-effort, not a hard gate (generator variance is outside our control) |
| G6 Done | Deliverables on disk; ledger closed |

## Constraints

- Violence/menace stays implied (Tarantino tension, not gore) — keeps generation within tool content policies and the pastiche honest.
- Generation spend under charter section 6. If the video tool is unavailable or rejects prompts, G5 records the blocker; G1–G4 alone still complete the benchmark deliverable.

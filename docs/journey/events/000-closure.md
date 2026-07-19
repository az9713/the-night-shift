# 000 — Build, verification, and closure (single-event ledger)

| Field | Value |
|---|---|
| Date | 2026-07-18 → 23:50 local, America/Los_Angeles |
| Phase | Full pipeline |
| Status after event | PROMPT 9 CLOSED — all gates pass |

## Gate 0 — HyperFrames viability (the assessed risk)

`hyperframes@0.7.64` exists on npm and works on this Windows machine. `doctor`: ffmpeg 7.1.1 ✓, bundled headless Chrome 149 ✓, RAM/disk ✓; whisper/TTS/MusicGen/Docker absent but optional. The assessed "HyperFrames may not work on Windows" risk did not materialize.

## Build

- Scaffold: `npx hyperframes init explainer --example blank --non-interactive --resolution landscape`. Init installed the HyperFrames skill suite; `hyperframes-core` (composition contract) was read before authoring.
- Composition: single standalone `index.html`, 5 beats over 20 s / 30 fps — title build-on (staggered word entrances, back.out, question-mark bounce) → 01 open-weights (elastic bar chart, staggered SVG bars) → 02 Moonshot (orbit: rotating arm around planet, dash-trail) → 03 pricing (stroke-dashoffset line draw-down + dot pop) → closing lockup (mask-up brand, rule wipe, sub reveal). Track 0: persistent grid backdrop + 26-particle field placed by golden-angle math (deterministic — no Math.random). Track 2: four scaleX wipe transitions.
- All animation is hand-authored GSAP on a blank scaffold — no stock blocks; the custom layer IS the composition. Stats are placeholders ([BENCHMARK], [PARAMS], [PRICE]) per the benchmark's own instruction.
- CDN GSAP pinned with SRI (sha384) after a security-hook prompt.

## Defects found and fixed

1. `hyperframes check` round 1 (5 errors): exit tweens on clip elements (framework owns clip visibility — moved to inner wrapper divs); letterSpacing tween (layout-snapping — replaced with y/scale); missing @font-face for Arial Narrow (added `src: local(...)`).
2. `check` round 2 (3 errors): missing hard-kill `tl.set(..., {opacity:0})` at clip boundaries for non-linear seek safety — added all four.
3. Frame extraction after render 1 caught a **silent selector bug** `check` passed: sections lost the `.beat` class during the wrapper refactor, so `.beat h2` styles stopped applying and fact-beat copy rendered at default sizes. Fixed selectors to `.beat-inner`, re-rendered. (Lesson repeat: extracted frames catch what linters and even the tool's own checks don't.)

## Verification

| Gate | Result |
|---|---|
| G1 Engine | `hyperframes check` 0 errors; render exit 0 — 600/600 frames, 1m 31s |
| G2 Custom layer | All motion hand-authored (source-inspectable); zero registry blocks |
| G3 Beats | Frames at 1 s / 5.5 s / 10.5 s / 15 s / 19.5 s each show a different, mid-animation composition; placeholders present |
| G4 Craft | ffprobe: 20.000 s, 1920×1080; consistent palette (#0a0a12 / ivory / #ff5f3c / #59d8ff), condensed type system, readable at frame scale |
| Audio | Skipped per contract (optional; local TTS/BGM deps absent — did not block) |

Deliverables: `render/kimi-k3-explainer.mp4` (2.8 MB) + `explainer/` source.

## Factory state

Queue: 7 ✅ → 8 ✅ → 3 ✅ → 4 ✅ → 9 ✅ → **5 (next)** → 6.

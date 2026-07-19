# Prompt 9 execution contract — "What Is Kimi K3?" 20-second motion-graphics explainer

Hardened from [kimi-k3-prompts.md](../../../kimi-k3-prompts.md) (prompt 9). Original unchanged.

## Deliverables

1. `render/kimi-k3-explainer.mp4` — 1920×1080, ~20 s, rendered by HyperFrames.
2. Composition source in this project (HyperFrames project + custom animation code).

## Requirements (from the benchmark, made checkable)

| Req | Gate |
|---|---|
| HyperFrames as the engine | Project scaffolded with `npx hyperframes init`; rendered with `hyperframes render`; `validate`/`check` pass (G1) |
| Own custom animations layered on top | Hand-written CSS/SVG/JS animation code visibly beyond stock blocks: bespoke kinetic type, custom SVG graphics/particles, custom easing/stagger choreography — identifiable in source (G2) |
| Distinct beats over ~20 s | Title build-on → 3 fact beats (kinetic type + supporting graphic/number each) → closing lockup; every beat animates in/out — no static frame that sits (G3) |
| Placeholder facts | Stats shown as "[BENCHMARK]"-style placeholders; the test is motion+design, not claims (G3) |
| Craft | Consistent color+type system, purposeful easing, staggered reveals, readable type (G4, frame extraction) |
| Renders cleanly | MP4 exists, ~20 s ±1 s, 1920×1080, plays start to finish; frame extraction at each beat confirms development over time (G4) |
| Audio optional | Attempt a simple bed only if trivial; do not block (non-gate) |

## Verification

- G1: `hyperframes check`/`validate` clean; render exits 0.
- G4: ffprobe duration/resolution; extract frames at ~1 s, 5 s, 9 s, 13 s, 17 s, 19.5 s; each frame differs materially and type is readable (visual inspection of extracted frames).
- Verifier separation: frames judged against the beat plan after render.

## Gate 0 (already passed)

`hyperframes@0.7.64` CLI runs on this Windows machine; `doctor` reports required deps green (ffmpeg 7.1.1, headless Chrome 149, 31.7 GB RAM); optional whisper/TTS/BGM/Docker absent — not needed.

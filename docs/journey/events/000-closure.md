# 000 — Build, verification, and closure (single-event ledger)

| Field | Value |
|---|---|
| Date | 2026-07-18 → 07-19, America/Los_Angeles |
| Phase | Full pipeline |
| Status after event | PROMPT 5 CLOSED — all gates pass |

## Reference board

Original generated concept frozen before code: `assets/references/watch-concept.png` (nano_banana_2, 1.5 credits) — steel case, deep green sunburst dial, applied markers, dauphine hands, studio key + rim + contact shadow. Rubric in [../../spec/execution-contract.md](../../spec/execution-contract.md).

## Build

Static page, no build step: importmap-pinned three@0.185.1 (matching prompt 1). Fully procedural watch — case/bezel/chamfer/back, canvas sunburst dial with brand/date/minute track, twelve applied 3D markers, extruded dauphine hands at 10:09, thin-glass crystal, fluted crown, lugs, RoundedBox three-link bracelet with dark seam plates; RoomEnvironment PMREM reflections, ACES, key/rim/green-fill lights, shadow-catcher + halo grounding. Page: fixed difference-blend nav, left editorial hero copy, craft/specs (6 real callouts)/reserve sections with IntersectionObserver reveals. `?qa=1` read-only state; `&freeze=1` disables auto-rotate for deterministic screenshots.

## The iteration loop (9 visual versions — the reference board doing its job)

| Ver | Defect caught by screenshot | Fix |
|---|---|---|
| v1 | Watch overfilled frame; crystal frosted-white hid dial | camera back; transmission thinned |
| v3 | Still edge-on; milky dome persisted | composition locked; freeze param added |
| v4 | **Dial still pure white** | root cause isolated next |
| v5 | → the "chamfer" was a **solid capped cylinder lying on top of the dial** — opened to a side-wall ring; dial appeared | |
| v6 | Mint-bright dial, chalky metals (roughnessMap halves base roughness — compensated), title/watch overlap | deepened green, roughness math fixed, watch offset right |
| v7 | Polished blowouts, floating bracelet gap | tamer env, left-aligned copy, tighter links |
| v9 | Independent verifier scored **9/14 FAIL**: cube-array bracelet, dial wedge banding, floating watch | RoundedBox links w/ polished-center alternation, continuous fine-stroke sunburst with directional hotspot, ground+halo moved into frame, stronger rim |

## Verification

| Gate | Result |
|---|---|
| G1 Scene | Drag-orbit moves camera (synthetic pointer sequence), auto-rotate pauses on interaction and resumes after 3 s; renders immediately; console clean (final PMREM blur warning fixed and redeployed) |
| G2 Page | 6 spec callouts, 2 CTAs, reveals fire on scroll, zero lorem ipsum |
| G3 Rubric | Independent adversarial verifier: first pass **9/14 FAIL** with prioritized fixes; after applying them, rescore **12/14 PASS**, no zero (metal 2, crystal 1, dial 2, lighting 2, composition 2, typography 2, tells 1) |
| G4 Responsive | 390-wide: no horizontal overflow |
| G5 Deploy | `watch-page-kimi-k3-prompt5`, alias HTTP 200 public, deployed QA clean (59,968 triangles, no errors, no warnings) |
| G6 Done | Ledger closed; pushed to private az9713/prompt-05-watch-page |

## Retro

1. **The builder/verifier split earned its keep hardest here**: self-assessment would have accepted v7; the adversarial scorer failed it at 9/14 and its three prioritized fixes took one edit cycle and flipped the gate to 12/14. Visual gates need a scorer who didn't build the thing.
2. Screenshot-per-iteration is the debugging loop for 3D: the dial-occluding solid cylinder was invisible in code review and obvious in one frame.
3. three.js gotchas recorded: `roughnessMap` multiplies base roughness (mid-gray map halves it); solid CylinderGeometry has caps (openEnded for rings); transmission materials frost over dark interiors — thin opacity+clearcoat glass reads better for watch crystals at this budget.

## Factory state

Queue: 7 ✅ → 8 ✅ → 3 ✅ → 4 ✅ → 9 ✅ → 5 ✅ → **6 (final; Blender installed, contract frozen)**.

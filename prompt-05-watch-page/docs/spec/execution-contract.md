# Prompt 5 execution contract — luxury watch product page

Hardened from the original benchmark prompt (see [docs/prompts.md](../../../docs/prompts.md)) (prompt 5). Original unchanged.

## Deliverable

Single-page product launch site (static) for an invented luxury watch brand, with a Three.js watch as the hero.

## The hard part, made checkable

"Incredibly realistic" is closed through: (a) a generated **reference board** image frozen before code (studio product shot: brushed+polished steel, sapphire crystal reflections/refraction, green sunburst dial, dauphine hands, contact shadow); (b) the material/lighting technique set fixed up front — `MeshPhysicalMaterial` (clearcoat for crystal, transmission where cheap), PMREM environment (`RoomEnvironment` — studio reflections without external HDRI files), ACES tone mapping, anisotropy-suggesting brushed textures via procedural canvas, soft key + cool rim + contact shadow; (c) a scored rubric.

## Visual rubric (score 0–2 each; release ≥ 12/14, no zero)

1. Case/bracelet metal reads as machined steel (brushed vs polished separation, specular gradients).
2. Crystal reads as glass (edge reflections, environment pickup).
3. Dial hierarchy (sunburst effect, applied markers, hands with sheen, legible).
4. Lighting: studio key/rim, grounded contact shadow, no flat ambient look.
5. Composition: watch is the hero; page frames it with restraint.
6. Typography/palette: near-monochrome + one accent; spacious, expensive.
7. No programmer-art tells (uniform gray plastic look, floating primitives, harsh noise).

## Functional gates

| Gate | Check |
|---|---|
| G1 Scene | Drag-orbit at interactive frame rates; slow idle auto-rotate resumes after 3 s idle; renders immediately on load; no console errors |
| G2 Page | Hero + positioning line + ≥4 real spec callouts (movement, case size, water resistance, materials — coherent invented product) + one CTA; real copy, no lorem ipsum; smooth scroll reveals |
| G3 Rubric | Screenshot vs reference board scored ≥ 12/14, no zero |
| G4 Responsive | 1440×900 and 390×844 render without overflow/clipping of hero or CTA |
| G5 Deploy | Isolated `nightshift-watch-page`, public alias, deployed regression + console clean |
| G6 Done | Ledger closed; source pushed to private az9713 repo |

QA instrumentation: `?qa=1` exposes renderer info, fps sample, camera state, auto-rotate flag.

# 000 — Build, verification, and closure (single-event ledger)

| Field | Value |
|---|---|
| Date | 2026-07-19, America/Los_Angeles |
| Phase | Full pipeline |
| Status after event | PROMPT 6 CLOSED — all gates pass; deepest scope honestly bounded |

## Substitutions executed (contract table)

- Pat's `chatgpt-imagegen` tool → nano_banana_2 generated reference image + 3 texture tiles (wall/crate/ground, ~6 credits).
- **Blender**: installed per user decision — winget route failed (manifest URL 403), MS Store route installed Blender 5.2 successfully BUT its launcher does not pass `--background --python` through headlessly (smoke test wrote no output, process hung, killed cleanly). Blender is on the machine for interactive use; asset automation used the contract's sanctioned **procedural fallback**. Recorded, not papered over.
- Real-CS2 screenshots → original generated style reference (`assets/references/level-style-concept.png`); we imitate the desert-tactical art direction, not Valve's map or assets.
- Truncated original DONE clause → the gates below.

## Build

- `sim.js` — pure 60 Hz deterministic sim: camera-relative movement (`moveVector` — the benchmark W-goes-sideways failure class has a dedicated function and dedicated tests), per-axis slide collision vs AABB level solids, slab-method raycast for hitscan + line-of-sight, 5 bots (patrol waypoints → engage on LOS → distance-based accuracy, they kill an AFK player), plant/boom/elimination/time/died round outcomes, buy economy (kill $300, plant $300, win $3250/loss $1400, rifle $2700).
- `level.js` — original two-site layout data (walls/crates/sites/waypoints/spawns).
- `index.html` — three.js render layer: textured walls/ground/crates, sun shadows + hemisphere, site rings + letter sprites, capsule bots that ragdoll-tip on death, viewmodel gun with bob + muzzle flash, HUD (health/armor/ammo/money/score/timer/kill feed/plant bar/bomb banner/damage vignette), live canvas minimap, WebAudio sfx, Pointer Lock for humans + `__P6_DRIVE__` input injection for automation (with QA overlay suppression).

## Defects found and fixed

1. Collision failed at exactly ground level (strict `y >` vs wall bottom 0) — epsilon added; caught by white-box tests.
2. Elimination test aimed 0.7 m over the bot's head — test aim math fixed (pitch from dy/dist).
3. First idle browser session: a patrolling bot walked mid, saw spawn, and killed the AFK player — a live sightline straight onto spawn. Added a spawn-screen wall; LOS tests updated (one lane moved, one new assertion that the screen blocks mid→spawn).
4. QA scripting kept racing the round cycle and misusing `hasten` against the live timer — scripts made phase-aware; product itself was fine (repeat of the p3 lesson: don't confuse harness races with product bugs).

## Gate results

| Gate | Result |
|---|---|
| G1 White-box | **18/18 vitest** — W/A/S/D exact camera-relative vectors at 5 yaws + opposition/orthogonality + normalized diagonals + in-game displacement; wall stop + slide; LOS blocked/open/spawn-screen; hitscan kill pays $300; wall blocks shots; reload refill; buy math; bots engage AND damage; bots patrol; plant→boom win; elimination win; time loss + round reset; seeded determinism |
| G2 Browser | Buy-poor rejected; all four axes verified live (W [0,−3.2] S [0,+3.2] D [+2.17,0] A [−1.03,0]); jump y 0.61; two-way firefight (player shots + bot return fire + player death by crossfire); rifle-less close-range kill with kill-feed render + $300; plant at B → bomb timer 40 s + banner; screenshots show desert-tan textured level with sun shadows, crates, HUD, minimap; console clean |
| G3 Deploy | `nightshift-cs2-clone` alias HTTP 200 public; deployed regression: movement −2.89 dz, kill, clean console; ~49 fps median in a throttled automated tab (hardware-specific, not generalized) |
| G4 Done | Ledger closed; pushed to private az9713/prompt-06-cs2-clone |

## Honest fidelity statement

SANDLINE matches the reference's art *direction* (desert tan, harsh daylight, crates, tight lanes, clean tactical realism, no neon) at demo fidelity — flat-textured walls, capsule bots, no post-processing stack. The benchmark's own finding was that the benchmark model shipped good graphics with broken controls; this build inverts the trade deliberately: controls are the most-tested code in the project. Native mouse-look feel remains for the batched Computer Use session (charter §7).

## Factory state

**Queue complete: 7 ✅ 8 ✅ 3 ✅ 4 ✅ 9 ✅ 5 ✅ 6 ✅ — 7/7 closed. 10 skipped per user decision.**

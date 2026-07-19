# Prompt 6 execution contract — browser FPS in the spirit of CS2's Dust 2

Hardened from [kimi-k3-prompts.md](../../../kimi-k3-prompts.md) (prompt 6). Original unchanged.

## Substitutions the original requires (recorded per charter)

The benchmark prompt hardcodes Pat Simmons's tooling and phrasing that cannot be executed literally here:

| Original | Substitution | Why |
|---|---|---|
| `python3 /Users/patsimmons/tools/chatgpt-imagegen …` for textures | Available image-generation MCP (albedo-style texture tiles) AND/OR procedural canvas textures | That tool/path doesn't exist on this machine |
| Headless Blender on macOS | Blender via winget on Windows (headless `blender --background --python`), procedural Three.js geometry as fallback | Platform |
| "save real CS2 screenshots as your visual reference target" | A generated original reference-board image in the CS2 desert-tactical *style* + the style vocabulary from it. Copyright-honest: we imitate the art direction (desert tan walls, crates, tight sightlines, clean daylight), not Valve's actual map or assets | Ripping real CS2 screenshots into the repo is a rights problem the original glossed over; the *fidelity target* remains "clean tactical realism, not neon" |
| "Do NOT fork an existing project" | All code written here; no FPS repo scaffold used | Simpler than license-auditing a scaffold |
| Truncated DONE clause (source cuts off mid-sentence) | DONE = the gates below | The original's final criterion is literally incomplete |

## Scope (one map, one loop — honest about what a browser demo is)

- Three.js first-person controller: WASD + mouse-look (Pointer Lock), run/walk, jump, gravity, AABB collision vs level geometry.
- **Control correctness is a primary gate** (the exact failure Pat caught in K3's attempt: W moved sideways). Scripted verification maps each key to its world-space displacement direction relative to look direction.
- Hitscan shooting: crosshair raycast, muzzle flash, tracer, damage, reload (R), ammo economy.
- Bots: patrol waypoints, engage on line-of-sight, take damage, die, respawn; they shoot back with distance-based accuracy.
- Round loop: bomb site A/B, plant (E at site, timer), defuse window, round win/lose, score, buy-lite (pistol/rifle swap).
- HUD: health, armor, ammo, money, round timer, minimap (top-down canvas), kill feed, crosshair.
- Map: original layout *in the spirit of* Dust 2 (two sites, mid, connector, spawn each side), desert-tan PBR-ish materials, crates, arches, sky, baked-feel lighting: bright sun directional + shadows + AO-ish vertex darkening, tone mapping. NOT neon.
- Assets: Blender headless bpy script generates crate/arch/wall modules → glTF (if Blender operational), else procedural BufferGeometry. Textures: generated tile images or procedural canvas (sand plaster, wood crate, metal).

## Three-phase structure (mirrors the original's workflow demand)

1. RESEARCH — reference-board image + style vocabulary + technique notes (PointerLockControls, hitscan patterns, bot FSM) captured in ledger.
2. BUILD — engine modules pure where possible (`sim.js`: player/bot/round state stepped at fixed tick — vitest-testable without WebGL; `level.js`: layout data + collision; render layer in page).
3. QA — white-box tests (movement vectors, collision, hitscan hit/miss, bot FSM transitions, round/plant/defuse state machine, economy) → browser QA (pointer-lock caveat: CDP can't hold real pointer lock; use QA input-injection hooks like prompt 4) → deploy `cs2-clone-kimi-k3-prompt6` → deployed regression. Native mouse-look feel goes to the batched Computer Use session.

## Gates

| Gate | Check |
|---|---|
| G1 | Vitest: **W/A/S/D each move the player in the correct camera-relative direction** (the K3 failure); collision stops walls; hitscan registers only on line-of-sight; bot FSM patrol→engage→dead; plant/defuse/round-end/score transitions; economy math |
| G2 | Browser: level renders (screenshot vs reference style — desert tan, crates, daylight shadows), HUD elements present, scripted fight: shoot bot → health drops → kill feed; plant → timer → round end; no console errors |
| G3 | Deploy public + regression |
| G4 | Ledger + push |

Frame-rate: record measured fps on this hardware in ledger; no universal claim.

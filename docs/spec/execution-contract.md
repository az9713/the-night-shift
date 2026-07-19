# Prompt 4 execution contract — 2D fighting game

Hardened from the original benchmark prompt (see [docs/prompts.md](../../../docs/prompts.md)) (prompt 4). Original unchanged.

## Deliverable

Browser fighting game (static, canvas):

1. Single-screen arena, two fighters, health bars, round timer; animated vector-drawn characters (not static rectangles).
2. FOUR selectable characters, visually distinct, each with one unique special move; character-select screen (P1 pick, P2/CPU pick).
3. Mechanics: left/right, jump, crouch, light attack, heavy attack, block, and per-character special via input sequence (↓ → + punch class). Proper state machine — no attacking mid-hitstun, no acting while KO'd.
4. Hitboxes vs hurtboxes; block reduces damage; KO or timer decides round; best-of-3; rematch.
5. Player vs CPU (approach / attack in range / sometimes block) AND local 2-player; on-screen control scheme.
6. Game feel: hit-pause, screen shake on heavy, KO announcement.

## Architecture (testability first)

- `public/src/engine.js` — pure deterministic `step(state, inputsP1, inputsP2)` at fixed 60 Hz ticks: fighter FSM (idle/walk/jump/crouch/attack_light/attack_heavy/special/block/hitstun/ko), hitbox-hurtbox overlap, damage/chip/knockback, hit-pause counter, round timer, round/match progression, special-input sequence buffer. No canvas, no DOM, no RNG except seeded CPU decisions.
- `public/src/characters.js` — 4 character defs (speed/jump/reach/damage/palette/special).
- `public/src/ai.js` — pure `cpuInputs(state, seededRandom)`.
- `public/index.html` — render (canvas vector fighters with idle/walk/attack poses), input mapping (P1 WASD+F/G/H, P2 arrows+K/L/;), select screen, HUD, sound effects (WebAudio bleeps), QA state `window.__P4_QA__` + DOM mirror under `?qa=1`.

## Gates

| Gate | Check |
|---|---|
| G1 White-box (vitest, pure engine) | Movement/jump/crouch transitions; attack spawns hitbox with reach; hit registers only in range; block reduces damage vs unblocked; **no attack from hitstun**; no input while KO; special triggers only on ↓→P sequence within window; round ends on KO and on timer with higher-health winner; best-of-3 match end; rematch resets; CPU produces legal inputs approaching/attacking/blocking; determinism (same seed+inputs ⇒ same state) |
| G2 Browser QA local | Select each of 4 characters; scripted keyboard fights: every move visibly changes QA state; combo/special registers; block chip vs full damage difference; full best-of-3 vs CPU driven to a winner; 2-player keys both respond; hit-pause/shake counters fire; KO + rematch; console clean |
| G3 Deploy | Isolated project `nightshift-fighting-game`, public alias, deployed regression of core G2 checks |
| G4 Done | Gates pass; ledger closed; source pushed to private az9713 repo |

Native-keyboard ecological check deferred to the batched Computer Use session (charter §7).

# 000 — Build, verification, and closure (single-event ledger)

| Field | Value |
|---|---|
| Date | 2026-07-18, America/Los_Angeles |
| Phase | Full pipeline |
| Status after event | PROMPT 4 CLOSED — all gates pass |

Compact single-event ledger: the build went defect-light and the contract at [../../spec/execution-contract.md](../../spec/execution-contract.md) records the plan; this event records the evidence.

## Architecture

Pure deterministic 60 Hz engine (`engine.js`: fighter FSM, hitbox/hurtbox, chip damage, hit-pause/shake, ↓→P special buffer, round/match progression) + `characters.js` (4 fighters, 4 genuinely different specials: Volt dash, Blaze riser, Granite both-sides slam, Wisp 150px lance) + `ai.js` (seeded plan-based CPU) + canvas shell (`index.html`: select screen, articulated vector fighters with per-state poses, HUD, WebAudio sfx, fixed-tick loop, `?qa=1` state + `__P4_DRIVE__` scripted-input hooks).

## Gate results

| Gate | Result |
|---|---|
| G1 White-box | Pass — 15/15 vitest: movement/jump/crouch; hitbox only in active frames with attack reach; hit only in range; chip (≤ceil(15×0.15)) vs full damage; **no attack from hitstun**; hit-pause+shake on heavy; special only on ↓→P in window, expires outside; Granite hits behind, KO→best-of-3→rematch; timer decides by health; CPU approaches/attacks/lands hits; seed determinism; all 16 character pairings |
| G2 Browser QA (local) | Pass — select→fight for volt/blaze and granite/wisp; walk +132px; jump lands; crouch/block clean in 2P; P2 arrow keys walk 106px + K attack; chip 2 vs clean 15 with `blocked` event; special state + event fires; **full best-of-3 vs CPU to a 2–1 winner (CPU won round 1 — contested, not scripted)**; rematch resets [0,0], 100 hp; console clean |
| G3 Deploy | Pass — `fighting-game-kimi-k3-prompt4`, alias HTTP 200 public, deployed regression (start, special event, hastened round end) clean console |
| G4 Done | Pass — source `az9713/prompt-04-fighting-game` (private), ledger closed |

## Defects and notes

- Two test-helper bugs (fighters crossing during closeIn flipped facing; held keys never re-edge) — engine itself was right; fixed helpers. Same lesson class as p8: inputs are edge-triggered, consumers must be driven the way real hands drive them.
- First browser probe read crouch/block as "hitstun" — live CPU was legitimately hitting P1 mid-probe; re-probed in 2P mode. Sampling noise, not defect (and incidental proof CPU offense works).
- QA-only `hastenTimer` hook added to make full-match browser verification fast; it only shortens the countdown, no other mutation.
- Native-keyboard ecological pass deferred to the batched Computer Use session (charter §7).

## Retro

1. Deterministic pure engine + scripted-input drive hooks made a "playability" gate mechanically checkable — the exact failure Pat's CS2 test caught (good graphics, broken controls) is structurally guarded here.
2. QA hooks that mutate only time (hasten) are a safe way to compress long game-loop verification.

## Factory state

Queue: 7 ✅ → 8 ✅ → 3 ✅ → 4 ✅ → **9 (next: HyperFrames smoke test)** → 5 → 6.

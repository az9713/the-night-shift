# The prompts — original intent, revised prompt, and what hardening changed

The seven work items came from a public model-evaluation benchmark by **Pat Simmons** ([video](https://www.youtube.com/watch?v=lPP6iBRuzgA), [persimmons.studio](https://persimmons.studio)). The originals are paraphrased below — they belong to Pat; watch the video for the verbatim text. What this repo contains is the factory's *hardened revision* of each prompt: the execution contract each build was actually held to. The delta between the two is the factory's **hardening stage** doing its job — resolving ambiguity, replacing unavailable resources, and converting "done when it feels done" into explicit gates.

Full contracts: `prompt-0N-*/docs/spec/execution-contract.md`.

---

## Prompt 3 — MP3 → MIDI web app

**Original intent (paraphrase):** build a browser app that loads a referenced `input.mp3`, detects the notes, and produces a downloadable MIDI file.

**Revised prompt:** single-page client-side app; YIN pitch detection over 2048-sample frames; note segmentation + quantization; standard MIDI file written byte-by-byte and re-parsed for validation; instrumented with read-only QA hooks; deployed to an isolated project.

**What hardening changed:**
- The referenced `input.mp3` **did not exist** → self-synthesized (stdlib + ffmpeg) with a known 14-note ground-truth table, converting a subjective "does it sound right?" into a mechanical gate: ≥12/14 notes, onsets ±120 ms, ≤2 spurious.
- Scope honestly bounded to monophonic audio (a YIN limitation, stated in the contract).

## Prompt 4 — 2D fighting game

**Original intent (paraphrase):** a playable 2D fighting game with multiple characters, special moves, and a CPU opponent.

**Revised prompt:** deterministic fixed-timestep engine as a pure module (state, input, seed → state); 4 characters with distinct specials; input-buffer special commands; block/chip/hit-stun rules; best-of-3 rounds; plan-based seeded CPU; scripted-input QA drive hooks.

**What hardening changed:**
- "Playable" became 15 white-box engine tests (no attack from hit-stun, special only on the command window, chip damage, determinism) plus a full scripted best-of-3 against the CPU in a real browser.
- Native-keyboard feel explicitly deferred to a batched foreground session rather than silently claimed.

## Prompt 5 — Luxury watch product page

**Original intent (paraphrase):** a product page for a fictional luxury watch with a 3D interactive centerpiece, in the visual register of a high-end brand site.

**Revised prompt:** fully procedural Three.js watch (no external models/HDRIs); orbit + idle-rotate; spec callouts + CTA with real copy; responsive at two breakpoints; clean console; a **frozen reference image generated before any code**, and a 14-point scored visual rubric (7 categories × 0–2, release ≥12 with no zero) scored by a verifier that didn't build it.

**What hardening changed:**
- "Looks luxurious" — unfalsifiable — became a scored rubric against a frozen reference, with an adversarial scorer instructed not to be generous.
- Deterministic screenshot mode (`?qa=1&freeze=1`) added so visual evidence is reproducible.

## Prompt 6 — Tactical FPS (CS2-style)

**Original intent (paraphrase):** a browser FPS in the style of a well-known tactical shooter map, with bots, bomb-plant rounds, and an economy — the prompt whose original attempt by the benchmarked model shipped good graphics with broken movement controls.

**Revised prompt:** pure 60 Hz deterministic sim (camera-relative movement, AABB slide collision, slab-method raycast, bot FSM, plant/defuse/economy/round loop) + a Three.js render shell; **control correctness as the primary gate** with a dedicated test suite mapping every key to its world-space displacement at multiple look angles; original generated art direction instead of copyrighted screenshots.

**What hardening changed:**
- The benchmark's own failure class (W moved sideways) got a named function and dedicated tests — 18 white-box tests total.
- Unavailable personal tools referenced by the original (a local image-gen script, a specific 3D pipeline) were replaced by generated textures and a sanctioned procedural fallback, recorded in a substitution table.
- Copyrighted reference material replaced with an original generated style reference.

## Prompt 7 — Biography paragraph

**Original intent (paraphrase):** research the benchmark's author online and write a single Isaacson-style biographical paragraph about him.

**Revised prompt:** 150–250 words; every claim traced to a fetched source URL; verbatim quotes verified; an independent adversarial verifier re-fetches all sources and audits every claim (any fabrication = fail); explicit identity guard against a famous namesake; model-generated outputs inside the subject's own videos excluded as sources.

**What hardening changed:**
- "Write a bio" became a claim-level audit with a zero-fabrication gate.
- The audit caught that **the original prompt's own framing contained a factual error** about its subject — the run's most-exported lesson: task inputs are unverified claims.

## Prompt 8 — Tarantino-style trailer

**Original intent (paraphrase):** write a shot plan for a Tarantino-style movie trailer; rendering it was a stretch goal.

**Revised prompt:** 6-shot plan, each shot a 4-block structure (scene / camera / action / dialogue), 27–33 s total, ≤8 s per clip; **continuity as a first-class gate** (every shot prompt restates full scene/wardrobe/props because video generators are stateless); mechanical structure lint + adversarial voice/continuity verifier; then actually rendered, stitched, and verified by frame extraction.

**What hardening changed:**
- The verifier failed the first draft's continuity *before any rendering spend* — "same interior as shot 2" is a null pointer to a stateless generator.
- Render defects (a duplicated title card) caught by frame extraction of the stitched MP4, not by review of the plan.

## Prompt 9 — Motion-graphics explainer MP4

**Original intent (paraphrase):** a ~20-second broadcast-style kinetic-typography explainer about the benchmarked model, built on a specific motion framework, with hand-authored animation layered on top; factual stats as labeled placeholders.

**Revised prompt:** 20 s 1080p MP4 via the framework's check/render pipeline; zero registry blocks (all custom GSAP); 5 distinct beats; placeholder stats (`[BENCHMARK]`, `[PRICE]`) per the original's own instruction; craft verified by frame extraction at each beat boundary. Retitled to a generic subject ("What Is the Frontier?") for this repo.

**What hardening changed:**
- A framework smoke test became Gate 0 — proving the toolchain renders on this machine before committing to the build.
- Frame extraction added as a mandatory gate after the linter passed a silent selector bug that rendered copy at the wrong size.

---

## Not attempted

- **Prompts 1–2** were completed earlier under human supervision (they are the precursors the factory protocol was distilled from) and live outside this repo.
- **Prompt 10** required access to the author's private repository and was skipped by user decision.

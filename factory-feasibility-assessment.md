# Software factory for prompts 3–10: feasibility assessment

Date: 2026-07-18
Status: brainstorm only — nothing has been built or executed.

## What this document is

Prompts 1 and 2 of the benchmark were completed in this workspace using a careful manual process. This document assesses whether the remaining eight prompts (3–10) can be completed by a **software factory**: an automated pipeline that moves each prompt through fixed stages with little human involvement, in the spirit of Warp's [cloud-factory-demo](https://github.com/warpdotdev-demos/cloud-factory-demo), but implemented differently.

## Verdict in one paragraph

**Seven of the eight prompts are feasible. Prompt 10 is blocked as written** because it requires Pat Simmons's private website repository, which we do not have. The factory itself is low-risk to build because it already exists in manual form: prompts 1 and 2 were completed with the exact stage sequence the factory would automate (critique the prompt → harden it into a testable contract → freeze a visual reference → build → verify in layers → deploy → audit → record everything in an append-only ledger). The work is to encode that proven process as reusable pieces with a driver loop — not to invent a new methodology.

## What we take from cloud-factory-demo, and what we change

cloud-factory-demo runs agents in the cloud, triggered by GitHub issues and labels. Its valuable ideas are not the plumbing. They are:

1. **Structured handoffs.** Every agent produces a validated, machine-checkable artifact (a JSON triage decision, a spec file, a line-validated `review.json`) — never loose prose. A separate deterministic step applies the result.
2. **Separation of powers.** The agent that analyzes runs read-only; a different, minimally-permissioned job performs the mutation. A builder never grades its own work.
3. **Grounding documents.** Triage decisions are checked against `roadmap.md`/`vision.md`, so "does this fit?" is answered from a written contract, not vibes.
4. **Human gates at the right places.** Humans review spec PRs and merges; agents do everything between the gates.
5. **A self-improvement loop.** A daily job harvests human reactions to the review bot's comments and updates the review skill — but may never change its output contract.

What we change, and why:

| cloud-factory-demo | Our factory | Reason |
|---|---|---|
| GitHub issues + labels as the work queue | A fixed queue of 8 prompts, each with an explicit state: `queued → hardened → building → local-pass → deployed → verified → closed / blocked` | We have a known, finite work list, not an open intake stream |
| GitHub Actions + Oz cloud agents | Claude Code on this Windows machine as the driver, with subagents (Agent/Workflow tools) per stage | The hard verification gates — WebGL rendering, 60 fps on the local RTX 3050, foreground Computer Use — **cannot run on CI runners** (no GPU, no desktop). Moving to the cloud would delete exactly the checks that made prompts 1–2 credible |
| `review.json` validated against an annotated diff | A `verdict.json` per gate, validated against evidence (test output, QA snapshots, screenshots) | Same idea, different evidence types |
| `improve-review-pr` daily loop | A **retro stage** after each prompt closes: distill defects and lessons into the shared contract template and stage instructions | Lessons already compound between prompts 1 and 2 (the event-ledger itself was a prompt-2 improvement); this makes it systematic |
| Per-run billable checkpoints | One up-front **authorization charter** | See "Human gates" below — the biggest autonomy win available |

## The pipeline (proven in prompts 1–2, now parameterized)

Each prompt is classified once, then walked through only the stages its class needs.

**Classes:** `deployable-app` (3, 4, 5, 6) · `rendered-video` (9) · `research-writing` (7) · `writing-plan` (8).

**Stages:**

1. **Triage/classify** — pick the class and verification profile; identify blockers and required substitutions.
2. **Harden** — rewrite the benchmark prompt into an execution contract (the prompt-2-revised pattern): pin exact targets, prohibited shortcuts, error states, measurable gates, and a done-contract. The original prompt is never modified.
3. **Reference board + rubric** — visual prompts only. Freeze the look, the negative references, and a scored rubric *before* code, so "visually stunning" becomes checkable.
4. **Build** — one integrated lane for high-integration apps (prompt-1 lesson: shared state means fan-out creates more merge cost than it saves). Fan out with the Workflow tool only where work is genuinely parallel (prompt 6's research phase and its subsystems).
5. **Verify, in layers** —
   - *White-box*: unit tests on the deterministic core (state machines, solvers, detectors).
   - *Gray-box*: browser automation against localhost with read-only QA instrumentation (`?qa=1`, mirrored into the DOM — the isolated-world lesson from prompt 1).
   - *Deploy*: isolated, uniquely named Vercel project per prompt; never touch another prompt's project; never `--prod` semantics beyond the intended alias.
   - *Deployed regression*: repeat the critical gray-box suite against the public URL.
   - *Black-box (Computer Use)*: ordinary foreground Chrome with real mouse/keyboard — only where native-input fidelity is the point (fighting-game keys, CS2 mouse-look). This is the one stage that needs the user's screen, so **all** Computer Use passes are batched into one coordinated session rather than one per prompt.
6. **Close** — append-only journey ledger (numbered immutable events, corrections as superseding events) plus a final synthesis and a closure audit. This pattern also sidesteps the Windows sandbox's unreliable in-place Markdown edits, which failed repeatedly during prompt 2.
7. **Retro** — update the shared templates before the next prompt starts. Builder and verifier stay separate agents; the verifier returns structured verdicts and the driver applies state transitions.

## Per-prompt feasibility

| # | Prompt | Verdict | Key issue and plan |
|---|---|---|---|
| 3 | MP3 → MIDI converter | **High — best factory showcase** | The prompt expects `./input.mp3`, which we don't have. Solution: **synthesize the input ourselves** (render a known melody, e.g. Twinkle Twinkle, from a note list). That converts the hardest question ("does the transcription resemble the source?") into an exact ground-truth test: detected notes vs. the notes we generated. Pitch detection (YIN/autocorrelation, monophonic) and Standard MIDI File writing are well-understood and unit-testable |
| 4 | 2D fighting game | **High** | The core is a deterministic state machine with hitboxes/hurtboxes — the same territory as prompt 1's reducer. Verify via scripted keyboard events plus exposed QA state (combo registered, input rejected during hitstun, round/match end conditions). Residual risk is "genuinely fun" — subjective; handle with a rubric and possibly an LLM-judge pass over recorded play |
| 5 | Luxury watch page | **Medium-high** | Everything is mechanically feasible; the risk is the craft ceiling of in-browser photorealism. Mitigate with a strong reference board, a research phase (HDRI environments, `MeshPhysicalMaterial`, clearcoat/refraction), and repeated screenshot-vs-reference scoring loops. Expect the most build-iterate cycles of any prompt except 6 |
| 6 | Counter-Strike 2 clone | **Medium — heaviest, needs substitutions** | The prompt hardcodes Pat's tools (`/Users/patsimmons/tools/chatgpt-imagegen`, headless Blender on macOS). Hardening must substitute: procedural geometry/materials (proved viable in prompt 1), available image-generation tools for texture maps, or a Windows Blender install. Its three-phase research → build → QA structure maps directly onto the Workflow tool. Two contract musts: (a) pin a finite screenshot-comparison rubric, or "as close to real CS2" never closes; (b) make **control-scheme verification via scripted input a primary gate** — Pat's own finding was good graphics with broken WASD, exactly the failure a screenshot-only QA misses |
| 7 | Isaacson-style biography | **High** | Research + one paragraph + a sources-and-confidence note. Verification is mechanizable: every specific claim must trace to a fetched source; fabricated facts are an automatic fail (the prompt says so itself). No deploy. Cheap and fast |
| 8 | Tarantino shot list | **High** | Pure writing with a lintable structure (per shot: number/duration, render-ready video prompt, dialogue/audio, continuity note; ~30 s total). Optional stretch: video-generation tools are available in this environment, so the factory *could* actually render the trailer as a verification step Pat performed manually — decide in hardening whether that is in scope |
| 9 | Motion-graphics MP4 | **Medium** | Depends entirely on the HyperFrames repo (`heygen-com/hyperframes`) working on Windows (likely headless Chromium + ffmpeg — plausible, unverified). **First gate is a pre-flight smoke test**: can `npx hyperframes` render anything to MP4 here at all? Verify the final MP4 by extracting frames at beat timestamps and checking readability/motion against the contract. If HyperFrames is broken on Windows, the honest outcome is a documented blocker, not a stubbed substitute |
| 10 | Workshop landing page | **Blocked as specified** | Requires full access to Pat's private repo (`app/workshops/page.tsx`, `design-system/`, brand components) and an isolated preview of *his* site. Cannot be run faithfully. Options, most honest first: (a) skip and record infeasible-as-specified; (b) run a **declared adaptation** — reconstruct a stand-in from the public persimmons.studio pages and grade only the copywriting contract; (c) do only the copy exercise as a writing prompt. This is a user decision, not a factory limitation to paper over |

## Constraints the factory cannot automate away

1. **Three irreducible human gates.** (a) Vercel publication/access changes, (b) Computer Use foreground sessions, (c) spend. All three are *batchable*: one up-front **authorization charter** (naming scheme `nightshift-<name>`, public non-commercial previews pre-approved, spend ceiling) plus one scheduled Computer Use session covering every prompt. Without batching, expect 2–3 interrupts per prompt, as happened in prompts 1–2.
2. **Serialization points.** Builds can run in parallel (separate project directories; 7 and 8 are fully parallel with anything), but GPU performance gates and Computer Use share one machine — final verification is a queue.
3. **Budget.** Prompts 1–2 consumed substantial agent effort; prompt 6 will be the most expensive by far. The user has historically been usage-constrained, so ordering matters (below).
4. **Subjectivity gates.** "Photoreal," "broadcast-quality," "genuinely fun" close only through frozen rubrics, negative references, and reference boards — optionally an LLM-judge panel as tie-breaker. This is a managed quality ceiling, not a feasibility problem.
5. **Environment quirks to design around (known from prompts 1–2).** Windows sandbox rejecting in-place Markdown edits (→ append-only ledger); browser automation running in an isolated JS world (→ mirror QA state into DOM attributes); background tabs throttling `requestAnimationFrame` (→ dedicated unthrottled session for performance gates); Vercel CLI surprises (`--project` selects, doesn't create; deploys default to production without `--target preview`; `vercel curl` can auto-create projects).

## Recommended execution order

Cheapest-first, so the factory loop itself is validated before any expensive build:

```
7 (biography) → 8 (shot list) → 3 (MP3→MIDI) → 4 (fighting game)
→ 9 (motion graphics) → 5 (watch page) → 6 (CS2 clone)
10: user decision (skip / adapt / copy-only)
```

Prompts 7 and 8 shake down the driver, ledger, verdict format, and retro stage at near-zero cost. Prompt 3 is the first deployable and carries its own ground truth. Prompt 6 goes last: heaviest, most substitutions, and it benefits from every retro before it.

## Recommended shape (deliberately minimal)

No new infrastructure. No GitHub Actions. The factory is four things:

1. **A shared contract template + per-stage instructions**, distilled from the prompt-1/2 documents (the critique tables, acceptance-gate patterns, verification strategy, ledger schema).
2. **Per-prompt ledger directories** in the proven event-sourced format (`docs/journey/events/NNN-*.md`, immutable, corrections supersede).
3. **A driver loop in Claude Code** — sequential sessions or a `/loop` — that walks each prompt through its stages with builder/verifier separation and structured verdicts.
4. **One authorization charter** signed once by the user, covering deploy naming, public previews, and the batched Computer Use session.

Everything else — Workflow fan-outs for prompt 6, LLM judges for subjective gates, video rendering for prompt 8 — is added per-prompt during hardening, only where that prompt's contract needs it.

## Open decisions — RESOLVED by the user on 2026-07-18

1. **Prompt 10: SKIP.** Recorded as infeasible-as-specified (requires Pat Simmons's private repository). The factory queue is prompts 3–9, seven items.
2. **Authorization charter: APPROVED.** Terms are written out in [factory-authorization-charter.md](factory-authorization-charter.md).
3. **Prompt 8: RENDER THE TRAILER.** The shot list remains the benchmark deliverable; the factory additionally generates the video clips with available video-generation tools and stitches them, as a verification-and-stretch stage. Generation cost falls under the charter's spend terms.
4. **Prompt 6: INSTALL BLENDER.** The asset pipeline may use headless Blender (bpy scripts → glTF) on this Windows machine, with procedural generation as fallback if the install or headless operation fails. The install itself happens during prompt 6 hardening, not before.

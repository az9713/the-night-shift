# FACTORY.md — The 3-Loop Software Factory: What Was Built, How It Ran, and What Comes Next

**Subject:** the autonomous run of 2026-07-18/19 that closed benchmark prompts 3–9 (order 7 → 8 → 3 → 4 → 9 → 5 → 6) with zero human input, in **2 hours 49 minutes** of wall clock (05:47:49Z → 08:36:59Z).

**Sources:** this document is reconstructed from evidence, not memory — the 2,982-line session transcript (`793fe7fc-…jsonl`), git commit logs of the five committed prompts, the per-prompt execution contracts and journey ledgers, `factory-state.md`, `factory-authorization-charter.md`, and `factory-feasibility-assessment.md`. Every load-bearing claim below traces to one of those. Where evidence is absent, the document says so.

**What this document is for:** not a victory lap. It is the specification of the factory that does not yet exist, written by documenting the one that ran once. Section 7 is the build plan for the next one — a factory that can run for days or weeks instead of one night.

**Not one model.** The autonomous run itself was Fable 5 throughout. Documenting it afterward pulled in Opus 4.8 and Sonnet 5 as well — see [Model provenance](#84-model-provenance) in the appendix for the phase-by-phase breakdown, including two commits that were mislabeled and then corrected.

---

## 1. The run in one page

| # | Prompt | Class | Duration | Deliverable | Gate result |
|---|---|---|---|---|---|
| 7 | Isaacson-style biography | research-writing | ~3.5 min | `biography.md` (208 words) | 0 fabrications; 2 wording repairs |
| 8 | Tarantino trailer plan + render | writing-plan (+stretch) | ~15 min | shot plan + `trailer.mp4` (31.5 s) | continuity FAIL → repaired pre-render |
| 3 | MP3→MIDI web app (NOTELIFTER) | deployable-app | ~11 min | [live](https://nightshift-mp3-midi.vercel.app/) | 14/14 notes exact vs ground truth |
| 4 | 2D fighting game (IRON RING) | deployable-app | ~13 min | [live](https://nightshift-fighting-game.vercel.app/) | 15/15 tests; contested best-of-3 vs CPU |
| 9 | Motion-graphics MP4 explainer | rendered-video | ~25 min | 20 s 1080p MP4 | lint 0 errors; frame extraction caught what lint passed |
| 5 | Luxury watch page (MERIDIAN) | deployable-app (visual) | ~40 min | [live](https://nightshift-watch-page.vercel.app/) | rubric 9/14 FAIL → 12/14 PASS |
| 6 | CS2 clone (SANDLINE) | deployable-app (heaviest) | ~61 min | [live](https://nightshift-cs2-clone.vercel.app/) | 18/18 tests incl. dedicated controls suite |

Prompt 10 was skipped by user decision (depends on Pat Simmons's private repo). Resources: ~86 Higgsfield credits spent (158.64 → 72.64), 4 isolated Vercel projects, 5 private GitHub repos, 42 unit tests written, 3 adversarial verifier subagents spawned. One human gate remains open: the batched Computer Use session (native keyboard for p4, pointer-lock mouse-look for p6).

Note the ordering: cheapest and lowest-risk first (writing prompts), heaviest and most failure-prone last. Duration tracked build size; *iteration count* tracked subjectivity — the watch page took 9 visual iterations, the CS2 clone took one test-fix cycle.

---

## 2. What was actually built: a protocol, not a program

This is the most important structural fact, and the easiest to misremember later.

**There is no orchestrator.** No script, no daemon, no queue runner, no state machine in code. The transcript confirms the `Workflow` tool was never invoked, no scheduler ran, and `factory-state.md` — the "state" — is a markdown file the assistant hand-rewrote at each prompt boundary. The factory consisted of exactly three things:

1. **A written protocol** — the staged pipeline in `factory-feasibility-assessment.md` (triage → harden → reference board → build → layered verify → deploy → ledger → retro), with per-class verification profiles.
2. **A standing authorization** — `factory-authorization-charter.md`, nine sections of pre-granted permission (deploy to isolated Vercel projects, create private repos, install tools, spend credits within bounds) plus an explicit list of what still required asking. The charter is what converted a supervised workflow into an unattended one: it removed every "may I?" interrupt in advance, in one batch.
3. **The assistant as runtime.** One Claude session was simultaneously the scheduler, the queue, the state store, the builder, most of the verifier, and the isolation boundary. Sub-verifiers were spawned as background agents; everything else ran in one context window.

This worked. It also cannot run twice: the runtime was a conversation. Kill the session mid-run and the factory is a directory of markdown with nobody reading it. Every design decision in Section 7 exists to fix exactly this.

### The actual substrate (from the transcript's tool histogram)

| Layer | Tool | Volume |
|---|---|---|
| Shell (serve, git, vercel, gh, winget, tests, ffmpeg) | Bash | 96 calls |
| Browser QA | **chrome-devtools MCP** (evaluate_script 33, navigate 22, screenshot 14, console 9) | ~84 calls |
| Generation (video/image) | higgsfield MCP (generate_video 15, job_status 14, generate_image 7) | ~40 calls |
| Files | Read 90 / Write 47 / Edit 14 | — |
| Verification agents | Agent tool ×3 (+1 SendMessage resume) | 3 spawns |
| Fact-checking | WebFetch 30 / WebSearch 3 | mostly inside the bio verifier |

Notably absent: PowerShell (zero — everything went through Git Bash), the Vercel MCP (CLI used instead), claude-in-chrome (chrome-devtools MCP used instead), and the Workflow tool (never needed at this scale).

---

## 3. Loop anatomy — four loops, not three

The working mental model during planning was three loops. The evidence shows four, and the fourth is the one that matters most for the next factory.

```
META    — across the whole run: retro → improved practice on the next prompt
 └─ OUTER  — over the prompt queue (7→8→3→4→9→5→6), carrying charter,
    │        budget, lessons, and tool know-how between prompts
    └─ INNER — per prompt: triage → harden contract → reference board →
       │       build → layered verify → deploy → ledger → retro
       └─ REPAIR — build → verify → fix → RE-verify, until the gate passes
```

### 3.1 REPAIR (innermost) — where the value was

Every prompt's quality came from this loop, and it took different forms by gate type:

- **Mechanical form** (p3, p4, p6): failing unit test → fix → rerun. E.g. prompt 6: three test failures shown in full → collision epsilon fix + test-aim fix → 18/18. Tight, fast, boring — exactly as it should be.
- **Judged form** (p5, p7, p8): adversarial verdict → repair → **re-verify with the same verifier**. Prompt 5 is the canonical trace: ~8 self-driven visual iterations (v2–v8) *before* the gate, then the independent scorer returned **9/14 FAIL** with per-category 0–2 scores, then one focused repair pass (v9: rounded bracelet links, continuous sunburst, grounding shadow), then the *same* verifier agent was resumed via SendMessage and re-scored the new screenshot: **12/14 PASS**. Resuming the same verifier matters — a fresh verifier would have re-litigated categories that already passed.
- **Perceptual form** (p8, p9): frame extraction from rendered MP4s, judged against the plan. This caught two defects that every upstream check passed: a duplicate title card in the trailer, and a silent CSS-selector bug in the explainer that the HyperFrames linter approved (sections lost their `.beat` class in a refactor; copy rendered at default size — visible only in extracted frames).

Verdicts were expressed as **structured markdown tables** (per-claim SUPPORTED/PARTIAL/UNSUPPORTED for the biography; per-shot continuity tables for the trailer; per-category 0–2 scores against a ≥12/14 threshold for the watch). Structured enough for a human or an LLM to act on; **not** machine-parseable JSON. See §5, unknown-unknown #4 — the feasibility doc had *planned* `verdict.json` per gate, and under autonomous execution that plan silently decayed to prose tables, because nothing mechanical ever consumed a verdict.

### 3.2 INNER — the per-prompt pipeline

The planned stage sequence held for all seven prompts, with per-class variation in the verify layer:

| Stage | What it produced | Example artifacts |
|---|---|---|
| Triage / classify | prompt class + risk list | ledger event 000 |
| Harden | `docs/spec/execution-contract.md` — the benchmark prompt rewritten into explicit gates, substitutions recorded | all 7 prompts |
| Reference board | frozen visual contract *before code* | `watch-concept.png`, `level-style-concept.png` (generated, ~1.5 credits each) |
| Build | one integrated lane, no fan-out | source + tests |
| Verify (layered) | white-box unit tests → gray-box browser QA (`?qa=1` hooks, `__P4_DRIVE__`/`__P6_DRIVE__` input injection) → deploy → deployed regression | per-class profile below |
| Deploy | isolated Vercel project `nightshift-<name>` | 4 projects |
| Ledger | append-only `docs/journey/events/NNN-*.md` | 13 events total across 7 prompts |
| Retro | lessons folded into the next prompt | in-context only (see META) |

**The verification taxonomy** — the run's most reusable intellectual result. Each prompt class got a different verification spine, and unit tests exist *only* where a deterministic core exists:

| Class | Mechanical layer | Judged layer |
|---|---|---|
| deployable-app w/ logic core (3, 4, 6) | vitest on the pure sim/engine (9, 15, 18 tests) + scripted browser QA | none needed |
| deployable-app, visual (5) | console-clean, responsive, orbit checks | 14-point scored rubric, separate verifier agent |
| research-writing (7) | word count, source URLs present | adversarial claim-vs-source audit, separate agent |
| writing-plan (8) | structure lint (blocks, durations, clip lengths) | continuity + voice audit, separate agent |
| rendered-video (9) | `hyperframes check` exit code, ffprobe duration/res | frame extraction vs beat plan |

### 3.3 OUTER — across prompts

- **The queue was a document.** `factory-state.md` was rewritten at every prompt boundary (38 references in the transcript). Transitions were prose milestones — "Closing prompt 5", "Closing prompt 6 and the factory run" — not tool calls.
- **Ordering was a decision, not FIFO**: cheap/text-first to prove the protocol under low stakes, riskiest (visual craft, heaviest build) last, by which point the run had accumulated practices.
- **The loop pipelined itself, unprompted.** The transcript shows the Blender install for prompt 6 starting while prompt 5's verifier was still re-scoring, and prompt 5's deploy launched *in parallel with* its verifier ("optimistic deploy" — deploy assuming pass, redeploy if repair needed; it was needed, and cost one extra deploy). Rate-limit cooldowns on video generation were filled with ledger-writing. None of this was in the plan; a single-threaded runtime found its own concurrency.
- **Preflight was real**: node/npm/git/python/ffmpeg version checks and gh/vercel auth checks ran before prompt 7, and a per-prompt "Gate 0 doctor" ran where a toolchain was load-bearing (HyperFrames for p9).

### 3.4 META — the fourth loop, and the fragile one

Lessons demonstrably transferred across prompts *during* the run:

- p7's verifier caught the benchmark prompt's own false claim → the run-wide rule "treat the benchmark's factual framing as unverified" → shaped p8's research handling.
- p8's continuity failure ("Same 1970s laundromat interior" — a memory reference a stateless generator cannot resolve) → full-descriptor restatement became the prompt-writing standard.
- p3's harness-race false alarm ("playback stopped" was actually inter-tool latency) → p6's browser QA was made phase-aware from the start.
- p4's test-helper bugs → p6's test helpers computed aim from geometry instead of hardcoding.

But this loop ran **in the context window**. It survived the night only because the entire run fit in one uninterrupted session — the transcript confirms zero compaction events during the run itself (05:47–08:37Z). The compactions came *afterward*, in the documentation sessions, which is precisely why this document had to be produced by archaeology (two mining agents over an 18 MB transcript) rather than recall. cloud-factory-demo persists this loop as a daily workflow (`improve-review-pr.yml`); this run persisted it as neurons, and the neurons were wiped.

### 3.5 The verifier-separation finding — precise version

The charter (§9) mandates verdicts "by a verifier separate from the builder." What actually happened, from the transcript's Agent-tool record:

- **Exactly 3 verifier subagents were spawned** — for the biography (an adversarial fact-refuter told to "default to unsupported," which independently re-fetched all five live sources), the trailer (continuity + voice, returned G3 FAIL), and the watch page (visual rubric scorer told "do NOT be generous — this gate exists to catch programmer art," returned 9/14). All three ran asynchronously in the background while the builder continued other work, and returned structured verdict tables.
- **Prompts 3, 4, 6, 9 had no verifier agent.** Their separation was *structural*: self-synthesized ground truth (p3), deterministic test suites written before the render shell (p4, p6), and a third-party linter + frame extraction (p9).

This is looser than the charter's language — and it is the correct design, discovered rather than planned: **subjective gates need a second mind; mechanical gates need a good test suite, and a second mind adds nothing.** The run's retro line "verifier caught real failures in 4 of 7" conflates the two (3 subagent verdicts + frame-extraction catches). The precise claim: *judged verification caught shippable-looking defects in 4 prompts (5, 7, 8, 9) that self-review had already passed.* That claim survives scrutiny; the blanket "every prompt had a separate verifier" would not.

---

## 4. Comparison: this run vs. cloud-factory-demo

**Reference:** [github.com/warpdotdev-demos/cloud-factory-demo](https://github.com/warpdotdev-demos/cloud-factory-demo). Picked for one reason: it was available, and it is a clean, canonical example of a simple cloud factory — organized around six legible stages (**Triage, Spec'ing, Implementation, Code review, Verification, Monitoring**) that map onto recognizable software-development moments. That makes it a reasonable base reference for this comparison, not a claim that it is the best or only factory design out there.

`warpdotdev-demos/cloud-factory-demo` is the reference proxy for "a software factory" as of July 2026: GitHub Actions as triggers, the Oz platform running agents, stages as skills (`.agents/skills/{triage,spec,implementation,review-pr,improve-review-pr}/SKILL.md`), GitHub issue labels as the state machine ("Ready to spec" / "Ready to implement"), specs frozen as `specs/<slug>/PRODUCT.md` + `TECH.md`, a `validate-changes-match-specs` skill, `review.json` as machine-readable review output, and a daily `improve-review-pr.yml` that feeds human reactions back into the review skill.

### Dimension by dimension

| Dimension | cloud-factory-demo | This run | Verdict |
|---|---|---|---|
| **Orchestration** | GitHub Actions + Oz platform; survives any individual's absence | One Claude session as runtime; dies with the session | **The gap.** Everything else is smaller than this. |
| **Task definition / queue** | GitHub issues + labels (durable, visible, resumable) | A prompt list in `factory-state.md`, consulted by the runtime | Same concept, no durability |
| **Spec-as-contract** | `PRODUCT.md` + `TECH.md` per issue, human-approved | `execution-contract.md` per prompt, charter-approved in batch | **Genuine structural match** — independently converged |
| **Isolation** | Branch + PR per change | Directory + own git repo + own Vercel project per prompt | Equivalent; this run's is arguably stronger (deploy isolation too) |
| **Quality gates** | `validate-changes-match-specs`; `review.json` consumed by CI | Structured markdown verdicts consumed by the assistant | Theirs is machine-checkable; this run's decayed from the planned `verdict.json` to prose (§5 #4) |
| **Human gates** | **Two per task** (spec approval, PR merge) | **Zero** — replaced by the up-front charter | This run was *more* autonomous. The charter is the interesting invention: batch the approvals before the run instead of interleaving them. |
| **Verification depth** | Diff-vs-spec + PR review (code only) | 5-modality taxonomy incl. browser QA, visual rubric, claim audit, frame extraction | This run goes far beyond — because its deliverables aren't just code |
| **Meta loop** | `improve-review-pr.yml`, daily, persisted, versioned | Ran in-context, evaporated post-run | Theirs compounds; this run's had to be excavated |
| **Retry/parallelism** | Actions-native retries; parallel workflows | Improvised: rate-limit backoff, cooldown-filling, opportunistic pipelining, optimistic deploy | This run's was smarter per-decision but unrepeatable |
| **Kill-survivability** | Full — state in issues/branches | None mid-prompt; per-prompt artifacts survive on disk | The single defining difference |

### The honest framing

These are different points on the same map, not a ranking. cloud-factory-demo solves *supervised, code-only, indefinitely-running* flow on durable infrastructure. This run solved *unsupervised, mixed-media (code + research + video + visual craft), single-burst* flow on a runtime made of attention. On the axis everyone assumes is hard — removing the human — this run is ahead. On the axis that makes a factory a factory — running without any particular mind present — it hasn't started.

The feasibility doc, written before the run, had already made the divergences deliberately (local machine because CI runners can't do WebGL/60fps/foreground checks; retro stage instead of daily improve; charter instead of per-task gates). What it planned but the run didn't deliver: `verdict.json` (decayed to prose) and the batched Computer Use session (still outstanding). What it never planned for: surviving its own runtime's death.

**Distance to close the gap:** days of plumbing, not weeks of invention. The intellectual assets — stage definitions (the execution contracts are 80% of `SKILL.md` files), the verification taxonomy, the charter pattern — already exist. Section 7 sequences the work.

---

## 5. Unknown-unknowns surfaced by running

Things that were invisible until the factory actually ran. This is the section that justifies having run it.

1. **A factory is exactly as autonomous as its gates are mechanical.** The run split cleanly: p3/p4/p6 (ground truth, deterministic suites) could be fully automated tomorrow with nothing lost; p5/p8/p9 needed judged gates that took rubrics, second minds, and iteration — and p5 still closed at 12/14, not 14/14. Subjectivity wasn't eliminated; it was *bounded* (converted into a scored rubric with a threshold). That bounding is the best available move, and it has a ceiling.

2. **The record collapses exactly when it gets interesting.** Prompt 2 (human-supervised) produced 13 ledger events. Under autonomous speed, prompts 4/5/6/9 each produced *one*. The 9 visual iterations of the watch exist only as a table in a closure ledger — git shows two commits. Documentation degrades under throughput unless the pipeline *forces* it, because the runtime always has something more urgent than writing history. In a factory, the record is a load-bearing component (it is the input to the meta loop), not exhaust.

3. **Verifier separation is a per-gate-type decision, not a blanket policy.** Discovered, not designed (§3.5): agents for judged gates, suites for mechanical ones. Corollary: the charter's blanket mandate was quietly reinterpreted mid-run — which itself is a finding about autonomous runs reinterpreting their own governing documents under pressure (here benignly; not guaranteed benign).

4. **Under autonomy, structure decays to prose unless a machine consumes it.** The planned `verdict.json` never appeared — not through decision, but drift: every verdict's only consumer was the assistant, which reads prose fine. Machine-readable interfaces survive only when something mechanical breaks if they're absent. The next factory must put a parser on the consuming end of every verdict *first*, or the schema will decay again.

5. **The test harness is code with its own defect rate.** Three of the run's defects were in *test/QA code*, not products: p4's helper walked fighters past each other and held keys that never re-edged; p6's elimination test aimed 0.7 m over the bot's head; p6's QA script misused `hasten` against the live timer. A factory that trusts its harness unconditionally will file false verdicts in both directions.

6. **Harness races masquerade as product bugs.** p3's "playback stopped" was 9.6 s of audio ending during inter-tool latency. Rule extracted: read state in the same `evaluate_script` as the action that changes it. Cost when violated: a debugging detour on a product that was fine.

7. **Every external service failed exactly once, each in a novel way.** Higgsfield: time-windowed rate limits (not just concurrency) + preset interception silently substituting a house style for the literal prompt (overridden via `declined_preset_id` — 7 times). winget: 403 on a stale manifest. MS Store Blender: installs fine, launcher swallows `--background --python`, making it un-automatable. None was predictable from documentation; all were absorbed by an escalation ladder ending in a pre-sanctioned fallback. Design consequence: **plan fallbacks, not failure modes** — you cannot enumerate the failures, but you can always pre-authorize a degraded path.

8. **The inputs lie.** The benchmark prompt itself asserted a false fact (a YouTube channel "called AI for Mortals" — that's the newsletter; the channel is "Pat Simmons"). The builder propagated it; only the adversarial re-fetch of live sources caught it. Task specifications are unverified claims, including — especially — the parts that read as background truth.

9. **Stateless generators need self-contained prompts.** "Same laundromat interior as shot 2" is a null pointer to a video model. Every shot prompt had to restate the full scene, wardrobe, and props. Generalizes to any pipeline stage whose executor has no memory of prior stages — which, in a factory of fresh subagents, is *every* stage.

10. **Perceptual verification catches what symbolic verification passes.** Twice: the linter-approved selector bug (p9) visible only in extracted frames; the duplicate title card (p8). And in reverse for code: the browser screenshot caught the solid cylinder occluding the watch dial that no amount of code reading would flag. Every rendered artifact needs an eyeball-equivalent gate; every visual defect needs a code-level root cause.

11. **Self-supplied ground truth converts subjective gates into mechanical ones.** The missing `input.mp3` became an *asset*: synthesize the input, and "does the transcription resemble the song?" becomes "14/14 notes, onsets ±120 ms." The generalizable trick: wherever a fixture is referenced but absent, generating it with known properties buys a mechanical gate for free.

12. **A single-threaded runtime discovers concurrency under pressure.** Optimistic deploy in parallel with verification; tool installs overlapped with a previous prompt's re-score; cooldowns filled with ledger writes. Unplanned, locally clever, and — because it lived in one mind's judgment — unreproducible. A real factory should get the same wins from an explicit scheduler instead of improvisation.

13. **Closure language inflates.** p4 and p6 ledgers say "all gates pass" while their native-input ecological gate is *deferred* (the batched Computer Use session — planned, charter-authorized, and still not performed). Deferred ≠ dropped, and the fine print records it honestly, but the headline overstates. Autonomous runs grade their own homework generously in the summary line even when the itemized record is honest. Machine-checkable closure (a gate list where every entry must be PASS/DEFERRED/WAIVED-with-reason) fixes the headline.

14. **The deliverables most vulnerable to loss got the least protection.** Prompts 7 and 8 — pure text, trivially versionable — are the only two with no git repo at all. The factory versioned what its habits versioned (things that deploy), not what mattered most to preserve.

15. **Context is a consumable the plan didn't budget.** The run fit in one window (no compaction 05:47–08:37Z) — luck of scale, not design. The meta loop, the tool know-how, and the cross-prompt lessons all lived there. The post-run compactions destroyed them, and reconstructing this document required two mining agents over the transcript. A days-long factory hits this wall *mid-run*, guaranteed. Context death must be a designed-for event, not an accident.

16. **The charter is the actual invention.** Removing the human didn't require better agents; it required moving every approval to *before* the run, batched, with an explicit still-requires-asking list and pre-sanctioned fallbacks. The charter did more work than any technical component. It is also the piece with no analogue in cloud-factory-demo — theirs interleaves approvals; this run front-loads them.

---

## 6. Learnings, condensed

Validated (multiple instances or hard evidence):

1. **Judged verification by a second mind catches what self-review ships.** 4 of 7 prompts (5, 7, 8, 9) had shippable-looking defects only the judged layer caught. The single strongest empirical result of the run.
2. **Spec-as-contract before build works and transfers.** Independently converged with cloud-factory-demo's design; all 7 execution contracts held through their builds.
3. **Match verification modality to deliverable class** (the §3.2 taxonomy). Unit tests where a deterministic core exists; rubric/audit/lint/frames elsewhere. Don't unit-test a watch's beauty; don't rubric a physics engine.
4. **Mechanical ground truth is buyable.** Synthesize inputs (p3), write control-correctness suites targeting the known failure class (p4, p6 — the exact class the benchmark caught), instrument the app with QA hooks (`?qa=1`, drive injection).
5. **Front-loaded batched authorization (the charter) is what makes unattended runs possible** — plus pre-sanctioned fallbacks for the failures you can't enumerate.
6. **Reference boards frozen before code discipline visual work** — both visual prompts iterated *toward a fixed target* instead of wandering.
7. **Re-verify with the same verifier after repair** (SendMessage resume), or you re-litigate settled categories.
8. **Frame extraction is mandatory for rendered output** — two linter-passing, plan-breaking defects caught by it.

Single-instance observations (treat as hypotheses):

9. Optimistic deploy (parallel with verification) is usually a net win — cost one redeploy in the one case it "failed."
10. The escalation ladder for tool installs (package manager → direct download → store → fallback) terminates fast when the fallback is pre-authorized.
11. Writing-class prompts are ~10× faster than build-class ones — queue ordering should exploit this (confidence-building first).
12. Preset/"helpfulness" interception by generation services corrupts precise intent silently — always check whether the service substituted its own interpretation.

Meta-learnings about the factory itself:

13. **The record is a component, not exhaust** — ledger granularity collapsed exactly when it mattered most (#2 above).
14. **Structure decays to prose without machine consumers** (verdict.json, #4 above).
15. **The factory's biggest single point of failure is its runtime being a conversation** — every other gap is plumbing; this one is architecture.

---

## 7. Blueprint: the next factory (days-to-weeks runtime)

Target: a factory that survives session death, runs for days, keeps its meta loop on disk, and preserves everything that worked in this run. Environment-specific: Windows 11, Claude Code (CronCreate/Workflow/Task tools, chrome-devtools MCP, higgsfield MCP, gh + vercel CLIs, Git Bash).

### 7.1 Substrate decision

Three candidates were evaluated:

**(a) Pure cloud-factory-demo pattern** — GitHub Actions + labels + cloud agents. Durable, proven, but disqualified by this workload: the hard gates (WebGL rendering, 60 fps on local GPU, headed-browser QA, foreground Computer Use, local Blender/ffmpeg) do not run on CI runners. The feasibility doc rejected this before the run for exactly this reason, and the run's tool histogram (84 chrome-devtools calls) confirms it.

**(b) Pure local Claude Code** — CronCreate heartbeats + Workflow fan-outs + markdown state. Closest to what ran, but keeps state in files only one runtime reads, and inherits every fragility documented above.

**(c) Hybrid — local runtime, durable remote state.** ✅ **Recommended.**

- **Queue + state:** GitHub issues in a private `az9713/factory` repo. One issue per task; labels as the state machine (`queued → hardened → building → local-pass → deployed → verified → closed / blocked / needs-human`). Mirrors `factory-state.md` but survives everything, is visible from a phone, and `gh` CLI already works here. The state machine the feasibility doc *planned* finally gets a real home.
- **Runtime:** Claude Code sessions on this machine — but sessions become *workers*, not *the factory*. A session claims an issue, executes stages, writes verdicts and ledger entries back to the issue/repo, and can die at any point with ≤1 stage of loss.
- **Wake/resume:** CronCreate schedules a heartbeat session (e.g. hourly). On wake: read the issue board, find in-flight work, resume from the last recorded stage. This is the component that converts "one lucky uninterrupted night" into "days or weeks."
- **Escalation:** a `needs-human` label pauses *that lane only* (the rest of the queue continues) + a PushNotification to the user. The charter pattern persists as `CHARTER.md` in the factory repo — versioned, amendable between runs.

### 7.2 Components, in build order

| # | Component | What it is | Effort | Why this order |
|---|---|---|---|---|
| 1 | **Verdict schema + consumer** | `verdict.json` per gate (`{gate, status: PASS/FAIL/DEFERRED/WAIVED, score?, threshold?, evidence[], reason?}`) **plus a checker script that refuses to close an issue whose gate list has any non-PASS entry without a reason** | ~half day | Fixes #4 and #13 (structure decay, closure inflation). Build the consumer first or the schema decays again. |
| 2 | **Queue + state on issues** | `gh`-driven; labels above; issue body = execution contract | ~1 day | Kill-survivability for the outer loop. |
| 3 | **Stage skills** | One `SKILL.md` per stage (triage, harden, reference-board, build, verify-<class>, deploy, ledger, retro), lifted from the 7 execution contracts + the §3.2 taxonomy. The verify skills encode the per-class modality table. | ~2–3 days | The intellectual content is already written; this is transcription + generalization. |
| 4 | **Persistent meta loop** | Retro stage appends to versioned files the triage/verify stages *must read*: `rubrics/visual.md`, `lessons/harness.md`, `lessons/services.md`. Each lesson gets an ID; contracts cite the IDs they apply. | ~1 day + discipline | The novel piece — no analogue even in cloud-factory-demo for non-code gates. Converts §3.4's neurons into files. |
| 5 | **Heartbeat + resume protocol** | CronCreate hourly; wake → `gh issue list` → resume in-flight lane from last ledger event; ledger events therefore must be written *per stage*, not per prompt (fixes #2, record collapse, as a side effect — resume *requires* granular events, making the record load-bearing by construction) | ~1–2 days | The days/weeks enabler. Note the elegance: making the ledger the resume mechanism makes its collapse impossible. |
| 6 | **Budget enforcement** | Credits/spend ledger checked pre-generation against a per-run cap in `CHARTER.md`; exceeded → `needs-human` | ~half day | The run tracked spend honestly but nothing *enforced* the cap. |

### 7.3 What NOT to build

- **No orchestrator daemon.** The heartbeat + issue board *is* the orchestrator. A custom daemon is the classic over-build; the run proved the stages, not the need for a scheduler process.
- **No parallel lanes in v1.** Serial worked. Parallel lanes multiply Vercel/browser/credit contention and make the resume protocol combinatorial. Add after v1, if ever.
- **No attempt to mechanize taste beyond rubric + verifier + reference board.** The p5 ceiling (12/14 after 9 iterations) is a property of the problem, not the tooling. Budget iterations per judged gate (say, 3 post-verdict repairs) and then `needs-human` — a taste gate that can't converge is information, not a bug.
- **No new MCP servers / no cloud agents.** The tool histogram shows the existing substrate carried 2h49m without a gap.

### 7.4 Milestones

- **v0.1 — replay.** Re-run closed prompt 3 through the new substrate (issue, labels, stage skills, verdict.json, checker). Known-good task; any divergence is factory bug, not task bug. *Exit: closes with all-PASS verdict.json and a per-stage ledger.*
- **v0.5 — survive death.** A new small task, run unattended, with a **deliberate mid-build session kill**. Heartbeat must resume and close it. *Exit: the ledger shows the seam; the deliverable doesn't.*
- **v1 — the compounding week.** 3–5 tasks over multiple days, ≥1 `needs-human` escalation resolved asynchronously, and — the real test — **the meta loop demonstrably fires**: a lesson file amended by task N's retro changes task N+1's contract or rubric, traceable by lesson ID. *Exit: point to the diff.*

### 7.5 Open risks (Windows/local specifics)

- **Machine availability:** sleep/hibernate kills the heartbeat — power settings or a wake timer needed; a cloud fallback lane (Actions) only works for the non-GPU/non-browser task classes.
- **Headed browser from a scheduled session:** chrome-devtools MCP behavior when no interactive desktop is available needs one dedicated experiment before v0.5.
- **Compaction mid-lane:** stage skills must be written so any single stage is executable from (issue + contract + last ledger event) alone — assume the session that starts a stage has no memory of the one before. This is the same discipline the stateless-generator lesson (#9) taught: every stage prompt self-contained.
- **Verdict inflation returns:** the checker (component 1) must be the *only* path to `closed` — if a session can label an issue closed directly, headline inflation (#13) comes back.
- **The batched Computer Use session** from the first run is still outstanding — it is also the template for how v1 handles all foreground human gates: batched, scheduled, one label.

---

## 8. Appendix

### 8.1 Run timeline (from transcript timestamps; boundaries ±, prompts pipelined)

| Event | Time (Z) |
|---|---|
| "yes preflight check now…" | 05:46:44 |
| Preflight (toolchain + auth checks) | 05:47:49 |
| p7 biography | 05:47–05:51 (~3.5 min; verifier 05:50–05:53 in background) |
| p8 trailer | 05:51–06:06 (~15 min; verifier 05:55–05:56; renders continued in background) |
| p3 MP3→MIDI | 06:06–06:17 (~11 min) |
| p4 fighting game | 06:17–06:30 (~13 min) |
| p9 motion explainer | 06:30–06:56 (~25 min) |
| p5 watch page | 06:56–07:36 (~40 min; verifier 07:28 FAIL → resume re-score 07:35 PASS) |
| p6 CS2 clone | 07:36–08:37 (~61 min) |
| "Factory run complete: 7/7" | 08:36:59 |

Git corroboration: commits for p3/p4/p9/p5/p6 span 23:14–01:31 PDT (= 06:14–08:31Z), 2 commits per prompt (build + closure), 1 for p9.

### 8.2 Reusable asset index

| Asset | Path | Reuse |
|---|---|---|
| Authorization charter (template) | `factory-authorization-charter.md` | The unattended-run enabler; §8 "still requires asking" list is the transferable part |
| Execution-contract pattern | `prompt-0N-*/docs/spec/execution-contract.md` (×7) | Direct inputs to stage skill #3 |
| 14-point visual rubric | embedded in `prompt-05-watch-page/docs/spec/execution-contract.md` (7 categories × 0–2, ≥12 no-zero); precursor: `prompt-01-command-center/ai/visual-acceptance-rubric.md` | Seed for `rubrics/visual.md` (meta-loop component 4) |
| Ground-truth generator | `prompt-03-mp3-midi/tools/make_input.py` → `ground-truth.json` | The "synthesize the missing fixture" trick, generalizable |
| QA drive hooks | `__P4_DRIVE__`, `__P6_DRIVE__`, `?qa=1`/`&freeze=1` in each `public/index.html` | Input injection + deterministic screenshots for browser gates |
| HyperFrames composition contract | `prompt-09-motion-explainer/explainer/AGENTS.md` | Rendered-video class contract |
| Frame-extraction evidence pattern | `prompt-08-trailer/docs/qa/frames/`, `prompt-09-…/docs/qa/frames/` | The perceptual gate for any rendered artifact |
| Adversarial verifier prompts | in transcript (lines ~840, ~923, ~2291) — **not saved as files** | Should be extracted into stage skills; currently the least-preserved high-value asset |

### 8.3 Known outstanding items (unchanged)

1. Batched Computer Use session — p4 native keyboard, p6 pointer-lock mouse-look (~10 min, needs user foreground).
2. Prompts 7/8: no version control — one `git init` + private push each.
3. Watch page: 2 open rubric points (crystal edge highlight, bracelet anisotropy) — cosmetic, below gate threshold.

### 8.4 Model provenance

This document, its explorer, and the repository it lives in were not produced by one model. The autonomous run itself ran on a single model throughout; documenting it afterward — across several resumed sessions — pulled in two more.

| Phase | Model | Basis |
|---|---|---|
| The autonomous overnight run — prompts 3–9 built, tested, deployed, ledgered (§1–§6 subject matter) | **Fable 5** | Session default at run time; consistent across all nine build commits, no contradicting evidence |
| Factory-status review, this document's original authorship, the two subagents that mined the session transcript and workspace for evidence | **Opus 4.8** | Explicit model switch |
| `factory-explorer.html` (first build), the benchmark-reference strip across the repo, Vercel project renames, the git monorepo assembly and push, `docs/prompts.md`, first `README.md` | **Fable 5** | Explicit model switch |
| Live explorer deployment, the README preview embed, the repository privacy audit, the §6 source-link fix | **Sonnet 5** | Explicit model switch |
| This provenance section, and the commit-history correction below | **Opus 4.8** | Current session state |

**A note on git commit trailers, since they're the obvious place to look for this and were wrong.** Every commit in this repository carries a `Co-Authored-By` trailer naming a model. For a while those trailers were copy-pasted forward from whichever commit came before, rather than updated to reflect whichever model was actually active — so two commits (the README preview embed and the §6 source-link fix, both made under Sonnet 5) carried an incorrect "Fable 5" trailer. Both were corrected via a history rewrite once the mistake was found; the repository's commit-author email was scrubbed to a GitHub no-reply address in the same rewrite. If you're reading this from `git log`, the trailers are now accurate. The lesson generalizes past this one repo: **a provenance record that's copy-pasted instead of re-derived at each step will drift, silently, exactly like the verdict-schema decay in §5 unknown-unknown #4** — the same failure mode, one level up, applied to the record of who did the work rather than the record of whether the work passed.

---

*Compiled 2026-07-19 from transcript, git, and ledger evidence by the same runtime that ran the factory — which is, of course, the problem this document exists to fix.*

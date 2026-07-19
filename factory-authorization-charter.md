# Factory authorization charter

Approved by the user on 2026-07-18. This charter is the standing authorization for the software factory that will execute benchmark prompts 3–9 (prompt 10 is skipped). Its purpose is to replace per-prompt permission interrupts with one signed set of rules. Anything outside these terms still requires a fresh, explicit authorization.

## 1. Scope

- Work items: prompts 3, 4, 5, 6, 7, 8, 9 from the benchmark prompt set (see [docs/prompts.md](docs/prompts.md)).
- Prompt 10 is skipped and recorded as infeasible-as-specified (private-repository dependency). No adaptation will be built.
- All projects are non-commercial demonstrations: no ads, subscriptions, paid promotion, or commercial integration. This keeps free-tier data/API eligibility (the prompt-2 Open-Meteo lesson) valid wherever it applies.

## 2. Project layout and naming

- Each deployable prompt gets its own directory in this workspace: `prompt-0N-<short-name>/`, with its own Git repository, matching prompts 1–2.
- Writing prompts (7, 8) get `prompt-0N-<short-name>/` directories with deliverables and ledger but no deployment.
- Vercel projects are uniquely named `nightshift-<short-name>`. One project per prompt. Never reuse or mutate another prompt's project, and never touch the prompt-1 or prompt-2 projects.

## 3. Deployment and publication (pre-authorized)

- Creating a new isolated Vercel project per deployable prompt: **authorized**.
- Deploying previews and a stable alias within that project: **authorized**.
- Disabling Vercel Authentication (making the deployment publicly reachable) **for that prompt's project only**: **authorized** — this was the recurring prompt-1/2 interrupt.
- Anything account-wide, or touching any project not named by the scheme above: **not authorized**; ask first.
- Deployment side effects must be audited at each prompt's closure (accidental projects, aliases, unintended production deploys), per the prompt-1 lesson.

## 4. Source control and backup (pre-authorized)

- Local Git repository per prompt: **authorized**.
- Creating a **private** GitHub repository `az9713/prompt-0N-<short-name>` and pushing milestone commits: **authorized** (same policy as prompt 2).
- Making any repository public: **not authorized**; ask first.
- Never commit secrets, tokens, precise personal location, or credentials.

## 5. Tooling installs (pre-authorized)

- **Blender** on this Windows machine, for prompt 6's asset pipeline (headless bpy → glTF): **authorized**. Procedural generation is the fallback if install or headless operation fails.
- **HyperFrames** (`npx hyperframes`) and its transitive needs (headless Chromium, ffmpeg) for prompt 9: **authorized**. Gate zero is a smoke test; if it cannot render MP4 on Windows, record a blocker — do not stub.
- npm dependencies inside prompt project directories: **authorized**, pinned versions, audit at closure.
- Anything that changes system-wide configuration beyond installing these tools: ask first.

## 6. Generation tools and spend

- Image generation for reference boards and prompt 6 texture maps, using tools available in this environment: **authorized**.
- Video generation for prompt 8 (rendering the trailer shot list into clips and stitching them): **authorized**. The shot list remains the benchmark deliverable; the rendered trailer is a stretch/verification artifact.
- Spend discipline: the factory runs cheapest-first (7 → 8 → 3 → 4 → 9 → 5 → 6) and reports notable usage at each prompt's closure. If the user signals a usage constraint mid-run, the factory checkpoints the ledger and stops at the current gate instead of pushing through.

## 7. Computer Use (foreground) sessions

- Computer Use passes are **batched**: the factory queues every prompt that needs a native-input check (expected: 4, 6; possibly 3 and 5) and requests **one coordinated foreground session** near the end of the run, rather than one interrupt per prompt.
- Each pass is small and scripted in advance; the user's prior screen context is restored afterward.
- Computer Use is never used to change security, permission, or publication settings.

## 8. What always still requires asking

1. Any security/publication change outside section 3's narrow grant.
2. Making anything public that this charter marks private.
3. Spending that departs from section 6's pattern (e.g., a paid API key or subscription).
4. Foreground screen takeover outside the scheduled batched session.
5. Deleting or overwriting anything the factory did not create.
6. Weakening, reinterpreting, or dropping an acceptance criterion because it is difficult — blockers are surfaced and recorded, not papered over.

## 9. Record-keeping obligations

- Every prompt keeps an append-only journey ledger (`docs/journey/events/NNN-*.md`, immutable events, corrections as superseding events) plus a final synthesis — the prompt-2 pattern.
- Verdicts at every gate are structured artifacts validated against evidence (test output, QA snapshots, screenshots, frame extractions), produced by a verifier agent separate from the builder.
- A retro after each closed prompt updates the shared contract template before the next prompt starts.

# HANDOFF — resume point for The Night Shift

**Read this first each new session.** There is no `CLAUDE.md` in this project — the standing conventions live in the git commit trailer format used throughout (see below) and in `FACTORY.md` itself, which is the project's own documentation of its methodology. Don't duplicate what's already in the files referenced below — open them.

## Current state (as of `3e02766`, pushed, public)

**The work is done.** This isn't a project with a pending build — it's a completed, published deliverable. Everything below is confirmed current as of this handoff:

- **Repo is public**: [github.com/az9713/the-night-shift](https://github.com/az9713/the-night-shift). Local `HEAD` (`3e02766`) matches `origin/main` exactly — nothing uncommitted, nothing unpushed.
- **Contents**: 7 built/deployed benchmark projects (prompts 3–9; prompt 10 skipped by user decision, prompts 1–2 intentionally excluded as precursors), `FACTORY.md` (the full teardown of the autonomous factory run that built them), `factory-explorer.html` (interactive version of the same teardown), governance docs (`factory-authorization-charter.md`, `factory-feasibility-assessment.md`, `factory-state.md`), and `docs/prompts.md` (original→revised→hardening-delta for each prompt).
- **4 live deployed apps** + the interactive explorer, all Vercel, all returning 200 as of last check: `nightshift-{mp3-midi,fighting-game,watch-page,cs2-clone,explorer}.vercel.app`.
- **Fully audited before publishing**: single scrubbed commit email (`az9713@users.noreply.github.com`) across all history, no secrets/PII/local paths, no broken internal links, model-provenance table (which model did which phase — it wasn't all one model) verified accurate against actual session history, two found bugs fixed (a GFM-incompatible custom anchor, five dead repo references from the pre-consolidation era), MIT-licensed with an explicit scope note (covers original code/docs, not Pat Simmons's cited material or the AI-generated media assets).
- **GitHub's license badge hasn't picked up the MIT license yet** (`licenseInfo` still returns null via `gh repo view`/API as of this handoff, hours after the commit). File, path, encoding, and line endings all check out as correct standard MIT text — this looks like backend detection lag on GitHub's side, possibly tied to the private→public flip, not a real defect. Spot-check with `gh repo view az9713/the-night-shift --json licenseInfo` next session; no action needed unless it's still null after a real re-push.

## Next task

**There isn't a required one — this was closed out at the user's request.** If a new session picks this up, it's most likely one of:

1. **The batched Computer Use session** (the one item repeatedly flagged as genuinely outstanding, not cosmetic): native keyboard feel on the fighting game (`prompt-04-fighting-game`), real pointer-lock mouse-look on the shooter (`prompt-06-cs2-clone`). ~10 minutes, needs the user in the foreground (can't be scripted via CDP — pointer lock specifically requires a real OS-level pointer grab). See `factory-state.md` §Outstanding and `FACTORY.md` §8.3.
2. Two **cosmetic** rubric points still open on the watch page (crystal edge highlight, bracelet anisotropy) — below the gate threshold, optional polish only. `prompt-05-watch-page/docs/journey/events/000-closure.md`.
3. If the user wants the git history fully scrubbed of internal tooling identifiers: ~20 historical commits still carry a `Claude-Session` URL trailer (low risk — requires the user's own auth to resolve to anything; offered twice, declined/not actioned both times). Don't do this unprompted.

If the user asks for something else entirely, that takes precedence over all of the above.

## Where to read things (reference, don't re-derive)

- `FACTORY.md` — the actual project: what the factory was, the 4-loop anatomy (repair/inner/outer/meta), comparison against `warpdotdev-demos/cloud-factory-demo`, 16 unknown-unknowns, learnings, and the blueprint for a durable version. §8.4 has the full model-provenance table; §8.3 has outstanding items.
- `README.md` — the front door; same model-provenance table in condensed form, license scope note, links to everything.
- `factory-state.md` — the terse final-state table (what shipped, where, verification headline per prompt).
- `docs/prompts.md` — for each of the 7 prompts: paraphrased original intent (Pat Simmons's benchmark), the hardened revised prompt, and what the hardening step actually changed.
- Each `prompt-0N-*/docs/spec/execution-contract.md` + `docs/journey/events/*.md` — per-project gates and the append-only historical ledger. **These ledgers are intentionally left as originally written**, including stale references to now-deleted standalone repos from before the monorepo consolidation — `factory-state.md` has a note explaining why, don't "fix" the ledgers themselves.

## Session-transient scratch (regenerate; durable record is the committed output)

- **`explorer-site/`** (untracked, at repo root, safe to ignore/delete) — deployment staging for the interactive explorer. Pattern to redeploy after editing `factory-explorer.html`: copy it to `explorer-site/index.html`, then `cd explorer-site && vercel deploy --prod --yes` (already linked to the `nightshift-explorer` Vercel project). Also republish via the `Artifact` tool on `factory-explorer.html` directly if the Claude-artifact copy needs to match too.
- **`docs/assets/factory-explorer-preview.jpg`** — the README's clickable hero screenshot. Reproduction pattern: navigate a browser tab to `nightshift-explorer.vercel.app`, resize to 1280×800, full-page screenshot, save over this path. Only needs regenerating if the explorer's hero section changes visually.
- **`../_ns_staging/`** (one level *above* this repo, i.e. `Downloads/_ns_staging/`) — leftover local copies of the five prompt repos (03/04/05/06/09) from before they were `git subtree add`-ed into this monorepo with full history preserved. Redundant now; safe to delete whenever, not referenced by anything.
- **`benchmark-prompts-original-local.md`** (repo root, gitignored) — Pat Simmons's verbatim original prompts, kept local-only on purpose (the public repo has only the paraphrased version in `docs/prompts.md`, per the user's explicit choice not to republish his text verbatim).

## How to work (essentials)

- **Commit trailer convention**: `Co-Authored-By: Claude <model name> <noreply@anthropic.com>` + `Claude-Session: <url>`, authored as `-c user.name=az9713 -c user.email=az9713@users.noreply.github.com`. **Use the actual currently-active model in the trailer, not whatever was used last** — this repo already had to correct two commits where the trailer was copy-pasted forward instead of re-derived (see `FACTORY.md` §8.4). If the model in this session differs from the last commit's trailer, that's expected, not an error.
- **Ledgers are append-only** (`docs/journey/events/*.md`) — historically accurate at time of writing, never edited after the fact even when they reference things that later changed (e.g. deleted repos). Corrections go in `factory-state.md` or a new event, not by rewriting old ones.
- **This user wants "warts and all," consistently** — audits and teardowns in this project are expected to surface inconvenient findings (mislabeled commits, overstated closure claims, broken links) rather than soften them. That preference shaped `FACTORY.md` §7 and §8.4 and should shape anything else written about this project.
- **Destructive git ops** (history rewrites, force-push) have happened twice in this repo already (email scrub + trailer fix), both explicitly requested and confirmed by the user first. Keep doing that — don't rewrite history unprompted.

# Factory run state — RUN COMPLETE

Run: 2026-07-18 evening → 2026-07-19 early morning, fully autonomous (user away). Charter: [factory-authorization-charter.md](factory-authorization-charter.md).

## Final results — 7/7 prompts closed

| Prompt | Deliverable | Live URL | Source | Verification headline |
|---|---|---|---|---|
| 7 biography | prompt-07-biography/biography.md | n/a | [this repo](prompt-07-biography/) | 208 words; adversarial verifier: 0 fabrications; 2 wording repairs (channel-name claim in the benchmark prompt itself was wrong) |
| 8 trailer | prompt-08-trailer/trailer-shot-plan.md + **trailer.mp4** (31.5 s) | n/a | [this repo](prompt-08-trailer/) | Verifier failed first draft's stateless-generator continuity → repaired pre-render; 6/6 clips generated (seedance_2_0_mini), duplicate title card caught by frame extraction |
| 3 MP3→MIDI | prompt-03-mp3-midi/ (NOTELIFTER) | https://nightshift-mp3-midi.vercel.app/ | [this repo](prompt-03-mp3-midi/) | Self-synthesized ground truth: **14/14 notes exact** in real Chrome, local + deployed; 9/9 vitest; .mid byte-validated |
| 4 fighting game | prompt-04-fighting-game/ (IRON RING) | https://nightshift-fighting-game.vercel.app/ | [this repo](prompt-04-fighting-game/) | 15/15 vitest (no-attack-in-hitstun, specials, chip); browser: contested best-of-3 vs CPU (2–1), all moves + 2P keys verified |
| 9 motion MP4 | prompt-09-motion-explainer/render/explainer.mp4 (20 s 1080p) | n/a | [this repo](prompt-09-motion-explainer/) | HyperFrames check 0 errors; frame extraction caught a selector bug the linter passed; 5 beats all custom GSAP |
| 5 watch page | prompt-05-watch-page/ (MERIDIAN Sylvan M-01) | https://nightshift-watch-page.vercel.app/ | [this repo](prompt-05-watch-page/) | Independent rubric: 9/14 FAIL → fixes → **12/14 PASS**; 9 visual iterations; orbit/idle-rotate/responsive/console clean |
| 6 CS2 clone | prompt-06-cs2-clone/ (SANDLINE) | https://nightshift-cs2-clone.vercel.app/ | [this repo](prompt-06-cs2-clone/) | 18/18 vitest incl. dedicated camera-relative-controls suite (the benchmark failure class); browser: axes, kill+feed, plant→bomb, two-way firefight; deployed regression clean |
| 10 | **SKIPPED** per user decision (private-repo dependency) | | | |

*Note: prompts 3–6 and 9 originally shipped as separate standalone private repos (named in the append-only journey ledgers below as their push destination at the time). Those standalone repos were later consolidated into this single repository and deleted — the ledgers are left as written, since they're historically accurate for when they were recorded, but the repo names they cite (e.g. `az9713/prompt-03-mp3-midi`) no longer exist as separate repos. This one does.*

## Resources

- Higgsfield credits: 158.64 → **72.64** (~86 spent: trailer 75, references + textures ~9, preflights ~2).
- Vercel: 4 new isolated projects (3, 4, 5, 6), all public production aliases, no auth settings touched, no accidental projects.
- GitHub: 5 new private repos (3, 4, 5, 6, 9).
- Blender: installed (MS Store 5.2) but its launcher blocks headless `--background` automation; winget route 403s. Prompt 6 used the sanctioned procedural fallback. Interactive Blender available for future use.
- All four local QA HTTP servers stopped; no orphan processes.

## Outstanding (needs the user)

1. **Batched Computer Use session** (charter §7): native-input ecological checks — prompt 4 keyboard fight, prompt 6 pointer-lock mouse-look; prompts 3/5 optional. ~10 minutes of coordinated foreground time.
2. Optional: watch-page residual polish (crystal edge highlight, bracelet anisotropy) — verifier notes, not gate failures.
3. Optional: prompts 7/8 have no GitHub backup (workspace-only) — say the word to push those too.

## Retro digest (whole run)

1. Builder/verifier separation caught real failures in 4 of 7 prompts (biography wording, trailer continuity, watch 9/14 fail, test-helper bugs); self-review would have shipped all of them.
2. Self-supplied ground truth (p3) and dedicated control-correctness suites (p4, p6) turn the benchmark's "looks right but doesn't work" failure mode into mechanical gates.
3. Frame extraction catches what linters pass (p9 selector bug, p8 duplicate title card); screenshots catch what code review can't (p5 dial-occluding solid cylinder).
4. Harness races masquerade as product bugs (p3 playback, p6 round-cycle) — read state atomically with the action that changes it.
5. External services each threw one undocumented surprise (video rate limits, preset interception, winget 403, MS Store headless block, PMREM warning) — all absorbed without human help.

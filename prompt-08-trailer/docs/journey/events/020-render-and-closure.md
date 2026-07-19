# 020 — Render and closure

| Field | Value |
|---|---|
| Date | 2026-07-18, America/Los_Angeles |
| Phase | Render (G5) + closure |
| Status after event | PROMPT 8 CLOSED — all gates pass |

## Render record

Six clips generated with `seedance_2_0_mini` (720p, 16:9, noir, native audio), 12.5 credits each:

| Shot | Job ID | Duration | Notes |
|---|---|---|---|
| 1 | e7164f82-4364-47ac-8559-0ad39d34f60c | 5.088 s | Neon exterior, wet asphalt; sign rendered "WASH-O-RAME" (generator text mangling, expected) |
| 2 | b50623d1-46a6-4516-81e4-06d2f7baeb0f | 6.080 s | Canonical two-shot: Foley left (undershirt, suspenders), Duke right, checkerboard floor, symmetric low angle |
| 3 | 0b48c54c-e85f-4fcf-9fdc-2cff75c7bab7 | 5.088 s | Repaired prompt; porthole glow two-shot |
| 4 | e675ff4b-bc9e-49c5-8049-d384e532d45f | 5.088 s | Repaired prompt; Lorraine + mop + cigarette, men in background; preset "IN THE DARK" declined to keep literal prompt |
| 5 | 2ce79484-181b-4aa9-af41-00e53ce811af | 5.088 s | Red-tinged porthole ECU |
| 6 | df669459-5fb4-4587-adb2-62ba8371443b | 5.088 s | Shirt hero-shot + in-clip "SPIN CYCLE" title card, correctly spelled |

Stitch: ffmpeg concat with re-encode → `trailer.mp4`, **31.52 s**, 7.6 MB, 1280×720. A separately built ffmpeg title card (`render/title.mp4`) was appended in the first stitch, but frame extraction showed shot 6 had already rendered its own clean title card — the duplicate was removed and the trailer re-stitched from the six shots only. Evidence frames in `docs/qa/frames/`.

## Gate results

| Gate | Result |
|---|---|
| G1 Research | Pass — practices note, live 2026 guidance, reflected in prompt structure |
| G2 Structure lint | Pass — mechanical check: 6 shots, [5,6,5,5,5,5] = 31 s, all blocks, ≤8 s |
| G3 Continuity | Pass after repairs — verifier FAILED first draft (stateless-generator "Same…" references, dropped descriptors in shots 3/4/6); all five fixes applied before those shots were generated |
| G4 Voice | Pass — verifier: oblique dialogue, clean three-act micro-arc, no register breaks |
| G5 Render | Pass — all six clips generated on first attempt with final prompts; frames confirm shot order and content. Known generator variance recorded honestly: neon sign text mangled ("WASH-O-RAME"), Duke's shirt rendered as striped polo rather than bowling shirt, shot 6 shows a top-loading washer where shots 2–5 established a front-loader. Contract classifies cross-clip visual variance as best-effort, not a hard gate |
| G6 Done | Pass — trailer-shot-plan.md + trailer.mp4 + render/ + frames on disk; ledger complete |

## Spend

6 × 12.5 = **75 credits**; balance before 158.64 (charter §6 pattern respected; ~83 remaining for later prompts).

## Retro (carried forward)

1. **Rate limits shape orchestration**: the video backend 429s past ~4 submissions per window; serializing launches against completions worked. Prompt 6's Workflow fan-out must budget for external-API pacing, not just agent parallelism.
2. **The verifier caught a class of defect the builder structurally cannot see**: prompts that read fine as a document but fail as isolated generator inputs ("Same laundromat…"). Same shape as prompt 7's finding — context the reader has but the consumer doesn't. For any artifact consumed piecewise (shot prompts, texture prompts, API payloads), verify each piece standalone.
3. **Preflight the generator's interceptors**: preset recommendations and rate limits are runtime behaviors no doc mentioned; the factory should expect at least one non-fatal surprise per external service.
4. **Frame extraction beats trusting job status**: the duplicate-title-card defect was only visible in extracted frames.

## Factory state

Queue: 7 ✅ → 8 ✅ → **3 (next)** → 4 → 9 → 5 → 6.

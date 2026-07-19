# 010 — Verification and closure

| Field | Value |
|---|---|
| Date | 2026-07-18, America/Los_Angeles |
| Phase | Verify + deploy + closure |
| Status after event | PROMPT 3 CLOSED — all gates pass |

## Gate results

| Gate | Result |
|---|---|
| G1 Ground truth | Pass — event 000; input.mp3 + ground-truth.json generated from one explicit note table |
| G2 White-box | Pass — 9/9 vitest: YIN ±20 cents on 8 pitches, null on silence, two-note segmentation with timing, silence→no notes, 16th-grid quantization, full 14-note synthesized-melody pipeline ≥12/14, SMF round-trip (header/tempo/division/note pairing), VLQ >127 ticks |
| G3 End-to-end accuracy | Pass — real Chrome decoded input.mp3 (resampled 48 kHz, 460,800 samples, 897 frames) and detected **14/14 notes with exact pitches (C4 C4 G4 G4 A4 A4 G4 F4 F4 E4 E4 D4 D4 C4) and grid-exact onsets (0.0…8.4 s), 0 spurious** — far above the ≥12/14 gate |
| G4 Browser QA | Pass — auto-load; upload path (real File through the input); undecodable-file error message + recovery via reload; BPM 120 re-quantized onsets (0.6→0.625); sensitivity re-analysis; MIDI playback scheduled (`playback: "midi"`, auto-stop at end); .mid blob re-parsed in-page: 14 notes, 100 BPM, division 480; piano-roll + note list rendered; console clean after favicon fix |
| G5 Deploy | Pass — isolated project `mp3-midi-kimi-k3-prompt3`, production alias <https://mp3-midi-kimi-k3-prompt3.vercel.app/> HTTP 200 with no auth wall (no protection setting changed); input.mp3 served (200, 56,232 bytes); **deployed regression repeated G3/G4 with identical 14/14 result and clean console** |
| G6 Done | Pass — ledger complete; source committed (`d6d0223`) and pushed to private `az9713/prompt-03-mp3-midi` |

## Defects found and fixed

1. **favicon 404** — the only console error, identical to prompt 2's finding; fixed with an inline SVG data-URI favicon. (A false alarm was also investigated: playback state read "stopped" after a first CDP click — it was the 9.6 s playback legitimately finishing during inter-tool latency, confirmed by immediate-read retest. Auto-stop is correct behavior, not a bug.)

## Known limitations (stated in-UI)

Monophonic only (YIN); chords out of scope. Detection tuned on clean synthesized tones — real-world recordings will be harder; sensitivity/BPM controls exist for that. Mobile layout not gated (not in contract; header wraps).

## Retro (carried forward)

1. **Self-supplied ground truth converts subjective gates into mechanical ones** — the single highest-leverage move of this prompt; reuse anywhere an input fixture is referenced but absent (prompt 6's reference screenshots).
2. **Automated-browser clicks are trusted gestures** — WebAudio scheduling worked under CDP without workarounds; prompts 4/5/6 can rely on this for game-input and audio QA.
3. **Inter-tool latency can masquerade as state bugs** — read state in the same evaluate call as the action that changes it.
4. Deploying the static dir as its own Vercel project root (production target) gives a public stable alias with zero auth friction — the prompt-1 ssoProtection battle is fully avoided by this shape.

## Factory state

Queue: 7 ✅ → 8 ✅ → 3 ✅ → **4 (next)** → 9 → 5 → 6. Credits ~83. No human input needed so far; batched Computer Use session still pending at run end.

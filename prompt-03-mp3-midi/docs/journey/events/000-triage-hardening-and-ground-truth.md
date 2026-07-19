# 000 — Triage, hardening, and ground truth

| Field | Value |
|---|---|
| Date | 2026-07-18, America/Los_Angeles |
| Phase | Intake + ground truth (G1) |
| Status after event | Contract frozen; ground truth generated |

## Triage

Class: `deployable-app`, static, no framework. Contract frozen at [../../spec/execution-contract.md](../../spec/execution-contract.md).

## Ground truth (the factory's key move)

The benchmark's `./input.mp3` does not exist in this workspace, so it was synthesized: `tools/make_input.py` (stdlib wave/math + ffmpeg) renders the first phrase of Twinkle Twinkle Little Star — 14 notes, 100 BPM, sine + soft 2nd harmonic, 15/60 ms envelopes, 40 ms inter-note gaps — and writes the exact note table to `tools/ground-truth.json`. Output: `public/input.mp3`, 56,232 bytes, 9.6 s. Transcription accuracy is therefore a mechanical comparison, not a listening opinion.

## Architecture decisions

- Pure ES modules `public/src/pitch.js` (YIN + RMS gate + run-length segmentation + 16th-grid quantization) and `public/src/midi.js` (SMF format-0 writer + minimal reader for round-trip tests), imported by both the page and vitest — no build step, vitest is the only dev dependency.
- Single-page vanilla UI: auto-load `./input.mp3`, upload path, sensitivity + BPM controls, piano-roll canvas, note list, WebAudio playback of original and of the transcription (scheduled oscillators), Blob download of the .mid.
- Read-only `window.__P3_QA__` + DOM mirror under `?qa=1` (prompt-1 lesson: instrumentation must be readable from the automation's world).

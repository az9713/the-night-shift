# Prompt 3 execution contract — MP3-to-MIDI converter

Hardened from [kimi-k3-prompts.md](../../../kimi-k3-prompts.md) (prompt 3). Original unchanged.

## Deliverable

Browser app (static, no server) that:

1. Auto-loads `./input.mp3` on start AND accepts a user-uploaded MP3/WAV; decodes to raw samples with WebAudio.
2. Detects notes for real — pitch (nearest MIDI note), onset time, duration — via autocorrelation-class pitch detection (YIN difference function) on hopped frames + RMS silence gating + note segmentation. Timing quantized to a grid from a user-set BPM. Method stated in one line in the UI. No stubbed/random/hardcoded notes.
3. Writes a standard `.mid` (SMF format 0, tempo meta, VLQ deltas) downloadable and DAW-openable.
4. Plays original audio and synthesized MIDI (WebAudio scheduling), toggleable, with a piano-roll canvas of detected notes and a textual note list (e.g. `C4 @ 0.00s, 0.60s`).
5. Detection controls: sensitivity (silence/clarity threshold) and BPM (quantization grid).

## The factory's key move — self-supplied ground truth

The benchmark references `./input.mp3` that we don't have. We synthesize it ourselves: the first phrase of Twinkle Twinkle Little Star (14 notes, known pitches/onsets/durations, 100 BPM sine tones with attack/release envelope), rendered by a script to WAV → ffmpeg → MP3. Because the input's note list is known exactly, "does the transcription resemble the source?" becomes a mechanical accuracy gate, not a listening test.

## Gates

| Gate | Check |
|---|---|
| G1 Ground truth | `tools/make_input.py` generates input.mp3 from an explicit note table; the table is stored as `tools/ground-truth.json` |
| G2 White-box | Vitest: YIN detects known sine frequencies within ±20 cents; segmentation recovers a synthetic note sequence; MIDI writer bytes round-trip parse (header, tempo, VLQ, note pairing); quantization math |
| G3 End-to-end accuracy | Decode input.mp3 in the real browser, run detection, compare against ground-truth.json: ≥ 12/14 notes correct pitch, onsets within ±120 ms (one 16th at 100 BPM), no more than 2 spurious notes |
| G4 Browser QA | Local + deployed: auto-load works, upload works, both playbacks audible-scheduled (verified via exposed QA state), piano-roll renders N detected notes, .mid download produced and byte-validated, sensitivity/BPM controls change output, no console errors |
| G5 Deploy | Isolated Vercel project `mp3-midi-kimi-k3-prompt3`, public, deployed regression of G3/G4 |
| G6 Done | All gates pass; ledger closed |

## Engineering constraints

- Static files only; core logic (`pitch.js`, `midi.js`) as pure ES modules imported by both the page and tests. No framework, no build step; vitest as the only dev dependency.
- Read-only QA state at `window.__P3_QA__` (+ DOM mirror) when `?qa=1`: decoded sample count, frame count, detected notes, midi byte length, playback scheduling state, errors.
- Unhappy paths: undecodable file, silent audio, no notes detected → visible message, never a blank screen.
- Monophonic scope stated honestly in the UI (YIN is monophonic; chords are out of scope, matching the benchmark's guidance).

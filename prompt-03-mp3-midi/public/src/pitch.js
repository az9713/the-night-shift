// Pure pitch-detection + note-segmentation core. Imported by the page and by vitest.

export const FRAME = 2048;
export const HOP = 512;

// YIN (de Cheveigné & Kawahara 2002): cumulative-mean-normalized difference.
// Returns fundamental frequency in Hz, or null for unvoiced/unclear frames.
export function yinPitch(frame, sampleRate, threshold = 0.15) {
  const n = frame.length;
  const maxTau = Math.floor(n / 2);
  const diff = new Float64Array(maxTau);
  for (let tau = 1; tau < maxTau; tau++) {
    let sum = 0;
    for (let i = 0; i < maxTau; i++) {
      const d = frame[i] - frame[i + tau];
      sum += d * d;
    }
    diff[tau] = sum;
  }
  const cmnd = new Float64Array(maxTau);
  cmnd[0] = 1;
  let running = 0;
  for (let tau = 1; tau < maxTau; tau++) {
    running += diff[tau];
    cmnd[tau] = running === 0 ? 1 : diff[tau] * tau / running;
  }
  let tau = -1;
  for (let t = 2; t < maxTau; t++) {
    if (cmnd[t] < threshold) {
      while (t + 1 < maxTau && cmnd[t + 1] < cmnd[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau === -1) return null;
  // parabolic interpolation around the minimum for sub-sample accuracy
  const a = cmnd[tau - 1], b = cmnd[tau], c = cmnd[tau + 1] ?? b;
  const denom = 2 * (a - 2 * b + c);
  const shift = denom === 0 ? 0 : (a - c) / denom;
  return sampleRate / (tau + shift);
}

export const freqToMidi = (freq) => Math.round(69 + 12 * Math.log2(freq / 440));
export const midiToFreq = (midi) => 440 * 2 ** ((midi - 69) / 12);

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const midiToName = (midi) => `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;

export function rms(frame) {
  let sum = 0;
  for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
  return Math.sqrt(sum / frame.length);
}

// samples (Float32Array) -> per-frame [{time, midi|null}] using YIN + RMS gate.
// sensitivity 0..1: higher = accepts quieter/less-clear frames.
export function analyzeFrames(samples, sampleRate, sensitivity = 0.5) {
  const frames = [];
  const rmsGate = 0.002 + (1 - sensitivity) * 0.05;
  const yinThreshold = 0.1 + sensitivity * 0.15;
  for (let start = 0; start + FRAME <= samples.length; start += HOP) {
    const frame = samples.subarray(start, start + FRAME);
    const time = start / sampleRate;
    if (rms(frame) < rmsGate) {
      frames.push({ time, midi: null });
      continue;
    }
    const freq = yinPitch(frame, sampleRate, yinThreshold);
    frames.push({
      time,
      midi: freq && freq > 40 && freq < 2500 ? freqToMidi(freq) : null,
    });
  }
  return frames;
}

// per-frame midi values -> note events {midi, onset, duration}.
// A note = run of >= minFrames consecutive frames agreeing on midi.
export function segmentNotes(frames, sampleRate, minFrames = 3) {
  const frameDur = HOP / sampleRate;
  const notes = [];
  let current = null;
  const close = (endTime) => {
    if (current && current.frames >= minFrames) {
      notes.push({
        midi: current.midi,
        onset: current.onset,
        duration: Math.max(frameDur, endTime - current.onset),
      });
    }
    current = null;
  };
  for (const f of frames) {
    if (f.midi === null) {
      close(f.time);
    } else if (!current) {
      current = { midi: f.midi, onset: f.time, frames: 1 };
    } else if (f.midi === current.midi) {
      current.frames += 1;
    } else {
      close(f.time);
      current = { midi: f.midi, onset: f.time, frames: 1 };
    }
  }
  if (current) close(frames.length ? frames.at(-1).time + frameDur : 0);
  return notes;
}

// Quantize onsets/durations to a 16th-note grid at bpm.
export function quantizeNotes(notes, bpm) {
  const grid = 60 / bpm / 4;
  return notes.map((n) => ({
    ...n,
    onset: Math.round(n.onset / grid) * grid,
    duration: Math.max(grid, Math.round(n.duration / grid) * grid),
  }));
}

export function detectNotes(samples, sampleRate, { sensitivity = 0.5, bpm = 100 } = {}) {
  const frames = analyzeFrames(samples, sampleRate, sensitivity);
  const raw = segmentNotes(frames, sampleRate);
  return { frames, raw, quantized: quantizeNotes(raw, bpm) };
}

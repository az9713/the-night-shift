import { describe, expect, it } from 'vitest';
import {
  analyzeFrames, detectNotes, freqToMidi, midiToFreq, midiToName,
  quantizeNotes, segmentNotes, yinPitch, FRAME, HOP,
} from '../public/src/pitch.js';
import { readMidi, writeMidi, TICKS_PER_QUARTER } from '../public/src/midi.js';

const SR = 44100;

function sine(freq, seconds, sr = SR, amp = 0.5) {
  const out = new Float32Array(Math.floor(seconds * sr));
  for (let i = 0; i < out.length; i++) out[i] = amp * Math.sin(2 * Math.PI * freq * i / sr);
  return out;
}

function melody(noteSpecs, sr = SR) {
  // noteSpecs: [{midi, dur}] with 40ms gaps, like the ground-truth generator
  const gap = Math.floor(0.04 * sr);
  const parts = [];
  for (const { midi, dur } of noteSpecs) {
    const body = sine(midiToFreq(midi), dur, sr);
    parts.push(body, new Float32Array(gap));
  }
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Float32Array(total);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}

describe('YIN pitch detection', () => {
  it('detects pure tones within 20 cents across the melody range', () => {
    for (const midi of [48, 55, 60, 64, 67, 69, 72, 76]) {
      const f = midiToFreq(midi);
      const detected = yinPitch(sine(f, FRAME / SR + 0.01).subarray(0, FRAME), SR);
      const cents = 1200 * Math.log2(detected / f);
      expect(Math.abs(cents), `midi ${midi}`).toBeLessThan(20);
    }
  });

  it('returns null on silence and noise-free-of-pitch', () => {
    expect(yinPitch(new Float32Array(FRAME), SR)).toBeNull();
  });

  it('maps frequency to midi and names', () => {
    expect(freqToMidi(440)).toBe(69);
    expect(freqToMidi(261.63)).toBe(60);
    expect(midiToName(60)).toBe('C4');
    expect(midiToName(69)).toBe('A4');
  });
});

describe('frame analysis and segmentation', () => {
  it('recovers a known two-note sequence with correct order and rough timing', () => {
    const samples = melody([{ midi: 60, dur: 0.5 }, { midi: 67, dur: 0.5 }]);
    const frames = analyzeFrames(samples, SR);
    const notes = segmentNotes(frames, SR);
    expect(notes.map((n) => n.midi)).toEqual([60, 67]);
    expect(notes[0].onset).toBeLessThan(0.1);
    expect(notes[1].onset).toBeGreaterThan(0.45);
    expect(notes[1].onset).toBeLessThan(0.65);
  });

  it('silence gate produces no notes from silence', () => {
    const frames = analyzeFrames(new Float32Array(SR), SR);
    expect(segmentNotes(frames, SR)).toEqual([]);
  });

  it('quantizes onsets and durations to the 16th grid', () => {
    const q = quantizeNotes([{ midi: 60, onset: 0.61, duration: 0.58 }], 100);
    const grid = 60 / 100 / 4; // 0.15
    expect(q[0].onset / grid).toBeCloseTo(Math.round(q[0].onset / grid));
    expect(q[0].onset).toBeCloseTo(0.6, 5);
    expect(q[0].duration).toBeCloseTo(0.6, 5);
  });
});

describe('full pipeline on synthesized Twinkle phrase', () => {
  it('detects >=12 of 14 notes with correct pitch and grid-aligned onsets', () => {
    const beat = 0.6;
    const spec = [
      [60, 1], [60, 1], [67, 1], [67, 1], [69, 1], [69, 1], [67, 2],
      [65, 1], [65, 1], [64, 1], [64, 1], [62, 1], [62, 1], [60, 2],
    ].map(([midi, beats]) => ({ midi, dur: beats * beat - 0.04 }));
    const samples = melody(spec);
    const { quantized } = detectNotes(samples, SR, { sensitivity: 0.5, bpm: 100 });
    const expected = [];
    let t = 0;
    for (const [midi, beats] of [[60, 1], [60, 1], [67, 1], [67, 1], [69, 1], [69, 1], [67, 2], [65, 1], [65, 1], [64, 1], [64, 1], [62, 1], [62, 1], [60, 2]]) {
      expected.push({ midi, onset: t });
      t += beats * beat;
    }
    let matched = 0;
    for (const e of expected) {
      if (quantized.some((n) => n.midi === e.midi && Math.abs(n.onset - e.onset) <= 0.12)) matched++;
    }
    expect(matched).toBeGreaterThanOrEqual(12);
    expect(quantized.length - matched).toBeLessThanOrEqual(2);
  });
});

describe('SMF writer', () => {
  it('round-trips notes through write + read', () => {
    const notes = [
      { midi: 60, onset: 0, duration: 0.6 },
      { midi: 67, onset: 0.6, duration: 0.6 },
      { midi: 69, onset: 1.2, duration: 1.2 },
    ];
    const bytes = writeMidi(notes, 100);
    expect([...bytes.slice(0, 4)]).toEqual([0x4d, 0x54, 0x68, 0x64]);
    const parsed = readMidi(bytes);
    expect(parsed.division).toBe(TICKS_PER_QUARTER);
    expect(parsed.bpm).toBe(100);
    expect(parsed.notes).toHaveLength(3);
    parsed.notes.forEach((n, i) => {
      expect(n.midi).toBe(notes[i].midi);
      expect(n.onset).toBeCloseTo(notes[i].onset, 2);
      expect(n.duration).toBeCloseTo(notes[i].duration, 2);
    });
  });

  it('encodes VLQ delta >127 ticks correctly', () => {
    const bytes = writeMidi([{ midi: 72, onset: 2.0, duration: 0.3 }], 120);
    const parsed = readMidi(bytes);
    expect(parsed.notes[0].onset).toBeCloseTo(2.0, 2);
  });
});

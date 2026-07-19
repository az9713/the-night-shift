// Standard MIDI File (SMF format 0) writer + minimal reader for round-trip tests.

export const TICKS_PER_QUARTER = 480;

function vlq(value) {
  // variable-length quantity encoding
  const bytes = [value & 0x7f];
  value >>= 7;
  while (value > 0) {
    bytes.unshift((value & 0x7f) | 0x80);
    value >>= 7;
  }
  return bytes;
}

// notes: [{midi, onset (s), duration (s)}], bpm -> Uint8Array .mid
export function writeMidi(notes, bpm) {
  const ticksPerSecond = TICKS_PER_QUARTER * bpm / 60;
  const events = [];
  for (const n of notes) {
    events.push({ tick: Math.round(n.onset * ticksPerSecond), on: true, midi: n.midi });
    events.push({ tick: Math.round((n.onset + n.duration) * ticksPerSecond), on: false, midi: n.midi });
  }
  events.sort((a, b) => a.tick - b.tick || (a.on ? 1 : -1)); // offs before ons at same tick

  const track = [];
  // tempo meta: microseconds per quarter
  const uspq = Math.round(60_000_000 / bpm);
  track.push(0x00, 0xff, 0x51, 0x03, (uspq >> 16) & 0xff, (uspq >> 8) & 0xff, uspq & 0xff);
  let lastTick = 0;
  for (const e of events) {
    track.push(...vlq(e.tick - lastTick));
    lastTick = e.tick;
    track.push(e.on ? 0x90 : 0x80, e.midi & 0x7f, e.on ? 0x60 : 0x00);
  }
  track.push(0x00, 0xff, 0x2f, 0x00); // end of track

  const header = [
    0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, // MThd len 6
    0, 0, 0, 1, // format 0, one track
    (TICKS_PER_QUARTER >> 8) & 0xff, TICKS_PER_QUARTER & 0xff,
  ];
  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b,
    (track.length >> 24) & 0xff, (track.length >> 16) & 0xff,
    (track.length >> 8) & 0xff, track.length & 0xff,
  ];
  return new Uint8Array([...header, ...trackHeader, ...track]);
}

// Minimal SMF reader — only what round-trip tests need.
export function readMidi(bytes) {
  const view = [...bytes];
  const str = (off, len) => String.fromCharCode(...view.slice(off, off + len));
  if (str(0, 4) !== 'MThd' || str(14, 4) !== 'MTrk') throw new Error('bad SMF');
  const division = (view[12] << 8) | view[13];
  let pos = 22;
  let tick = 0;
  let tempo = 500000;
  const on = new Map();
  const notes = [];
  const readVlq = () => {
    let v = 0;
    let b;
    do { b = view[pos++]; v = (v << 7) | (b & 0x7f); } while (b & 0x80);
    return v;
  };
  while (pos < view.length) {
    tick += readVlq();
    const status = view[pos++];
    if (status === 0xff) {
      const type = view[pos++];
      const len = readVlq();
      if (type === 0x51) tempo = (view[pos] << 16) | (view[pos + 1] << 8) | view[pos + 2];
      pos += len;
      if (type === 0x2f) break;
    } else if ((status & 0xf0) === 0x90) {
      const midi = view[pos++]; const vel = view[pos++];
      if (vel > 0) on.set(midi, tick);
      else if (on.has(midi)) { notes.push({ midi, onTick: on.get(midi), offTick: tick }); on.delete(midi); }
    } else if ((status & 0xf0) === 0x80) {
      const midi = view[pos++]; pos++;
      if (on.has(midi)) { notes.push({ midi, onTick: on.get(midi), offTick: tick }); on.delete(midi); }
    } else {
      throw new Error(`unsupported status 0x${status.toString(16)}`);
    }
  }
  const secondsPerTick = tempo / 1_000_000 / division;
  return {
    division,
    bpm: Math.round(60_000_000 / tempo),
    notes: notes.map((n) => ({
      midi: n.midi,
      onset: n.onTick * secondsPerTick,
      duration: (n.offTick - n.onTick) * secondsPerTick,
    })),
  };
}

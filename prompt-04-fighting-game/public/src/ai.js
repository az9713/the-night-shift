// Pure CPU policy: approach, attack in range, block sometimes. Seeded — no Math.random.

import { emptyInputs, ATTACKS } from './engine.js';
import { CHARACTERS } from './characters.js';

export function mulberry32(seed) {
  let v = seed >>> 0;
  return () => {
    v += 0x6d2b79f5;
    let t = v;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Persistent plan object keeps the CPU from twitching every tick.
export function createCpu(seed = 7) {
  const rand = mulberry32(seed);
  let plan = { inputs: emptyInputs(), until: 0 };

  return function cpuInputs(state, meIndex = 1) {
    const me = state.fighters[meIndex];
    const foe = state.fighters[1 - meIndex];
    if (state.tick < plan.until) return plan.inputs;

    const inputs = emptyInputs();
    const dx = foe.x - me.x;
    const dist = Math.abs(dx);
    const reach = ATTACKS.heavy.reach;
    const foeAttacking = ['light', 'heavy', 'special'].includes(foe.state);
    const r = rand();

    if (foeAttacking && dist < reach + 30 && r < 0.45) {
      inputs.block = true;
      plan = { inputs, until: state.tick + 14 };
    } else if (dist > reach - 10) {
      if (dx > 0) inputs.right = true; else inputs.left = true;
      if (r > 0.92) inputs.up = true; // occasional jump-in
      plan = { inputs, until: state.tick + 8 };
    } else if (r < 0.35) {
      inputs.light = true;
      plan = { inputs, until: state.tick + 6 };
    } else if (r < 0.6) {
      inputs.heavy = true;
      plan = { inputs, until: state.tick + 8 };
    } else if (r < 0.72) {
      inputs.block = true;
      plan = { inputs, until: state.tick + 12 };
    } else if (r < 0.8 && CHARACTERS[me.char]) {
      // walk-back spacing
      if (dx > 0) inputs.left = true; else inputs.right = true;
      plan = { inputs, until: state.tick + 8 };
    } else {
      plan = { inputs, until: state.tick + 5 };
    }
    return plan.inputs;
  };
}

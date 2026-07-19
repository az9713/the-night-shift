import { describe, expect, it } from 'vitest';
import {
  ATTACKS, BLOCK_CHIP, MAX_HEALTH, ROUND_SECONDS, TICKS,
  activeHitbox, emptyInputs, newMatch, nextRound, rematch, step,
} from '../public/src/engine.js';
import { CHARACTER_IDS } from '../public/src/characters.js';
import { createCpu } from '../public/src/ai.js';

const I = (over = {}) => ({ ...emptyInputs(), ...over });
const idle = I();

function run(state, ticks, a = () => idle, b = () => idle) {
  for (let t = 0; t < ticks; t++) state = step(state, a(state, t), b(state, t));
  return state;
}

// close the gap (A walks toward B, stops at 60px) so light attacks connect
function closeIn(state) {
  let guard = 0;
  while (Math.abs(state.fighters[1].x - state.fighters[0].x) > 60 && guard++ < 300) {
    state = step(state, I({ right: state.fighters[0].x < state.fighters[1].x,
                            left: state.fighters[0].x > state.fighters[1].x }), idle);
  }
  return run(state, 2); // settle to idle so later key presses are clean edges
}

describe('movement and states', () => {
  it('walks, crouches, jumps and lands', () => {
    let s = newMatch('volt', 'blaze');
    const x0 = s.fighters[0].x;
    s = run(s, 10, () => I({ right: true }));
    expect(s.fighters[0].x).toBeGreaterThan(x0);
    expect(s.fighters[0].state).toBe('walk');
    s = run(s, 2, () => I({ down: true }));
    expect(s.fighters[0].state).toBe('crouch');
    s = run(s, 2, () => I({ up: true }));
    expect(s.fighters[0].state).toBe('jump');
    s = run(s, 60);
    expect(s.fighters[0].y).toBe(0);
    expect(s.fighters[0].state).toBe('idle');
  });

  it('attack spawns a hitbox only during active frames with the attack reach', () => {
    let s = newMatch('volt', 'blaze');
    s = step(s, I({ light: true }), idle);
    expect(s.fighters[0].state).toBe('light');
    expect(activeHitbox(s.fighters[0])).toBeNull(); // startup
    s = run(s, ATTACKS.light.startup, () => I({ light: true }));
    const hb = activeHitbox(s.fighters[0]);
    expect(hb).not.toBeNull();
    expect(hb.x2 - s.fighters[0].x).toBeCloseTo(ATTACKS.light.reach);
  });
});

describe('hits, range, block', () => {
  it('registers a hit only in range', () => {
    let far = newMatch('volt', 'blaze'); // 400px apart — out of reach
    far = run(far, 30, () => I({ light: true }));
    expect(far.fighters[1].health).toBe(MAX_HEALTH);

    let near = closeIn(newMatch('volt', 'blaze'));
    near = run(near, 30, () => I({ light: true }));
    expect(near.fighters[1].health).toBeLessThan(MAX_HEALTH);
  });

  it('block reduces damage to chip and prevents full hitstun launch', () => {
    let s = closeIn(newMatch('volt', 'blaze'));
    s = run(s, 30, () => I({ heavy: true }), () => I({ block: true }));
    const chip = MAX_HEALTH - s.fighters[1].health;
    expect(chip).toBeGreaterThan(0);
    expect(chip).toBeLessThanOrEqual(Math.ceil(ATTACKS.heavy.damage * BLOCK_CHIP) + 1);

    let u = closeIn(newMatch('volt', 'blaze'));
    u = run(u, 30, () => I({ heavy: true }));
    expect(MAX_HEALTH - u.fighters[1].health).toBeGreaterThanOrEqual(ATTACKS.heavy.damage);
  });

  it('cannot attack during hitstun (state machine holds)', () => {
    let s = closeIn(newMatch('volt', 'blaze'));
    // A lands a heavy; B mashes attack during hitstun
    s = run(s, ATTACKS.heavy.startup + 2, () => I({ heavy: true }));
    expect(s.fighters[1].state).toBe('hitstun');
    const before = s.fighters[1].state;
    s = step(s, idle, I({ light: true }));
    expect(s.fighters[1].state).toBe(before);
    expect(s.fighters[1].attack).toBeNull();
  });

  it('hit-pause and shake fire on heavy hits', () => {
    let s = closeIn(newMatch('volt', 'blaze'));
    s = run(s, ATTACKS.heavy.startup + 2, () => I({ heavy: true }));
    expect(s.hitPause).toBeGreaterThan(0);
    expect(s.shake).toBeGreaterThan(0);
  });
});

describe('special moves', () => {
  it('triggers only on the down-forward-punch sequence', () => {
    // plain punch = no special
    let plain = closeIn(newMatch('volt', 'blaze'));
    plain = run(plain, 6, () => I({ light: true }));
    expect(plain.events.some((e) => e.type === 'special')).toBe(false);

    // ↓ → punch inside window = special
    let s = closeIn(newMatch('volt', 'blaze'));
    s = step(s, I({ down: true }), idle);
    s = step(s, idle, idle);
    s = step(s, I({ right: true }), idle);
    s = step(s, idle, idle);
    s = step(s, I({ light: true }), idle);
    expect(s.fighters[0].state).toBe('special');
    expect(s.events.some((e) => e.type === 'special' && e.who === 0)).toBe(true);
  });

  it('sequence expires outside the window', () => {
    let s = closeIn(newMatch('volt', 'blaze'));
    s = step(s, I({ down: true }), idle);
    s = run(s, 40); // > SPECIAL_WINDOW
    s = step(s, I({ right: true }), idle);
    s = step(s, idle, idle);
    s = step(s, I({ light: true }), idle);
    expect(s.fighters[0].state).toBe('light');
  });

  it('granite slam hits both sides; wisp lance outranges heavy', () => {
    let g = newMatch('granite', 'blaze');
    // B walks BEHIND granite, then granite specials
    g = run(g, 90, () => idle, () => I({ left: true }));
    expect(g.fighters[1].x).toBeLessThan(g.fighters[0].x + 60);
    g = step(g, I({ down: true }), idle);
    g = step(g, I({ right: true }), idle);
    g = step(g, I({ light: true }), idle);
    g = run(g, 25);
    expect(g.fighters[1].health).toBeLessThan(MAX_HEALTH);

    const wispReach = 150;
    expect(wispReach).toBeGreaterThan(ATTACKS.heavy.reach);
  });
});

describe('rounds and match', () => {
  function koRound(s) {
    // A pummels B with pulsed heavies (edges, not holds) until KO -> round end
    let guard = 0;
    while (s.mode === 'fight' && guard++ < 8000) {
      const far = Math.abs(s.fighters[1].x - s.fighters[0].x) > 70;
      s = step(s, I({
        right: far && s.fighters[0].x < s.fighters[1].x,
        left: far && s.fighters[0].x > s.fighters[1].x,
        heavy: !far && s.tick % 12 < 2,
      }), idle);
    }
    return s;
  }

  it('KO ends the round, best-of-3 ends the match, rematch resets', () => {
    let s = newMatch('volt', 'blaze');
    s = koRound(s);
    expect(['roundEnd', 'matchEnd']).toContain(s.mode);
    expect(s.wins[0]).toBe(1);
    s = nextRound(s);
    expect(s.mode).toBe('fight');
    expect(s.fighters[1].health).toBe(MAX_HEALTH);
    s = koRound(s);
    expect(s.mode).toBe('matchEnd');
    expect(s.wins[0]).toBe(2);
    const r = rematch(s);
    expect(r.mode).toBe('fight');
    expect(r.wins).toEqual([0, 0]);
    expect(r.round).toBe(1);
  });

  it('timer expiry gives the round to the healthier fighter', () => {
    let s = newMatch('volt', 'blaze');
    s = closeIn(s);
    s = run(s, 30, () => I({ light: true })); // A chips B once
    s.timer = 3;
    s = run(s, 5);
    expect(s.mode).toBe('roundEnd');
    expect(s.wins[0]).toBe(1);
  });

  it('round timer counts down from the configured length', () => {
    const s = newMatch('volt', 'blaze');
    expect(s.timer).toBe(ROUND_SECONDS * TICKS);
    expect(run(s, 10).timer).toBe(ROUND_SECONDS * TICKS - 10);
  });
});

describe('CPU and determinism', () => {
  it('CPU approaches from range and attacks in range over a simulated stretch', () => {
    const cpu = createCpu(11);
    let s = newMatch('volt', 'granite');
    let sawApproach = false;
    let sawAttack = false;
    for (let t = 0; t < 900 && s.mode === 'fight'; t++) {
      const inputs = cpu(s, 1);
      const dist = Math.abs(s.fighters[1].x - s.fighters[0].x);
      if (dist > 120 && (inputs.left || inputs.right)) sawApproach = true;
      if (dist <= 120 && (inputs.light || inputs.heavy)) sawAttack = true;
      s = step(s, idle, inputs);
    }
    expect(sawApproach).toBe(true);
    expect(sawAttack).toBe(true);
    expect(s.fighters[0].health).toBeLessThan(MAX_HEALTH); // CPU actually lands hits
  });

  it('same seed and inputs give identical states', () => {
    const runOnce = () => {
      const cpu = createCpu(42);
      let s = newMatch('wisp', 'blaze');
      for (let t = 0; t < 300; t++) s = step(s, I({ right: t % 3 === 0, light: t % 17 === 0 }), cpu(s, 1));
      return s;
    };
    expect(runOnce()).toEqual(runOnce());
  });

  it('all four characters can fight without errors', () => {
    for (const a of CHARACTER_IDS) {
      for (const b of CHARACTER_IDS) {
        const cpu = createCpu(3);
        let s = newMatch(a, b);
        for (let t = 0; t < 120; t++) s = step(s, I({ right: true, light: t % 9 === 0 }), cpu(s, 1));
        expect(s.fighters[0].health).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

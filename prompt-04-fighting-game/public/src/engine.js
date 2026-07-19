// Pure deterministic fighting engine. Fixed 60 Hz ticks. No DOM, no RNG.
// step(state, inputsA, inputsB) -> new state. Imported by page, AI, and tests.

import { CHARACTERS } from './characters.js';

export const TICKS = 60;
export const ARENA_W = 960;
export const GROUND_Y = 0;
export const ROUND_SECONDS = 60;
export const FIGHTER_W = 56;
export const MAX_HEALTH = 100;

export const ATTACKS = {
  light: { startup: 5, active: 4, recovery: 8, damage: 7, hitstun: 16, reach: 72, height: 'high' },
  heavy: { startup: 10, active: 5, recovery: 16, damage: 15, hitstun: 26, reach: 88, height: 'high' },
};
export const BLOCK_CHIP = 0.15;
export const BLOCKSTUN = 8;
export const SPECIAL_WINDOW = 36; // ticks for ↓ → P sequence

export const emptyInputs = () => ({
  left: false, right: false, up: false, down: false,
  light: false, heavy: false, block: false,
});

function newFighter(charId, x, facing) {
  return {
    char: charId, x, y: GROUND_Y, vy: 0, facing,
    health: MAX_HEALTH, state: 'idle', stateT: 0,
    attack: null,           // 'light' | 'heavy' | 'special' while attacking
    hasHit: false,          // current attack already connected
    seq: [],                // [{ev, t}] for special detection
    prev: emptyInputs(),
  };
}

export function newMatch(charA, charB) {
  return {
    mode: 'fight', tick: 0, round: 1, wins: [0, 0],
    timer: ROUND_SECONDS * TICKS, hitPause: 0, shake: 0,
    announce: '', announceT: 0,
    chars: [charA, charB],
    fighters: [newFighter(charA, 280, 1), newFighter(charB, 680, -1)],
    events: [],
  };
}

function resetRound(state) {
  state.fighters = [newFighter(state.chars[0], 280, 1), newFighter(state.chars[1], 680, -1)];
  state.timer = ROUND_SECONDS * TICKS;
  state.mode = 'fight';
  state.announce = `ROUND ${state.round}`;
  state.announceT = 60;
}

const spec = (f) => CHARACTERS[f.char];
const attackData = (f) => f.attack === 'special' ? spec(f).special : ATTACKS[f.attack];
const busy = (f) => ['light', 'heavy', 'special', 'hitstun', 'ko'].includes(f.state);

function setState(f, s) { f.state = s; f.stateT = 0; }

function detectSpecial(f, tick) {
  // sequence down -> forward -> punch, all within SPECIAL_WINDOW
  const seq = f.seq.filter((e) => tick - e.t <= SPECIAL_WINDOW);
  f.seq = seq;
  const di = seq.findIndex((e) => e.ev === 'down');
  if (di === -1) return false;
  const fi = seq.findIndex((e, i) => i > di && e.ev === 'forward');
  if (fi === -1) return false;
  return seq.some((e, i) => i > fi && e.ev === 'punch');
}

function beginAttack(f, kind) {
  f.attack = kind;
  f.hasHit = false;
  setState(f, kind);
}

function updateFighter(state, i, inputs) {
  const f = state.fighters[i];
  const other = state.fighters[1 - i];
  const s = spec(f);
  const edge = (k) => inputs[k] && !f.prev[k];

  // face the opponent when not mid-action
  if (!busy(f)) f.facing = other.x >= f.x ? 1 : -1;

  // record special-sequence events on edges
  if (edge('down')) f.seq.push({ ev: 'down', t: state.tick });
  if ((f.facing === 1 && edge('right')) || (f.facing === -1 && edge('left'))) {
    f.seq.push({ ev: 'forward', t: state.tick });
  }
  if (edge('light') || edge('heavy')) f.seq.push({ ev: 'punch', t: state.tick });

  f.stateT += 1;

  switch (f.state) {
    case 'ko':
      break;
    case 'hitstun':
      if (f.stateT >= f.stunTicks) setState(f, 'idle');
      break;
    case 'light': case 'heavy': case 'special': {
      const a = attackData(f);
      // special lunge motion during startup+active
      if (f.attack === 'special' && s.special.dash && f.stateT <= a.startup + a.active) {
        f.x += f.facing * s.special.dash;
      }
      if (f.stateT >= a.startup + a.active + a.recovery) {
        f.attack = null;
        setState(f, 'idle');
      }
      break;
    }
    default: { // idle | walk | jump | crouch | block — actionable states
      if (f.state === 'jump') {
        // airborne physics handled below; allow air drift
        f.x += (inputs.right ? 1 : 0) * s.speed * 0.8 - (inputs.left ? 1 : 0) * s.speed * 0.8;
      } else if (edge('light') || edge('heavy')) {
        if (detectSpecial(f, state.tick)) {
          f.seq = [];
          beginAttack(f, 'special');
          state.events.push({ t: state.tick, type: 'special', who: i });
        } else {
          beginAttack(f, edge('heavy') ? 'heavy' : 'light');
        }
        break;
      } else if (inputs.block) {
        setState(f, 'block');
      } else if (inputs.up && f.y === GROUND_Y) {
        f.vy = s.jump;
        setState(f, 'jump');
      } else if (inputs.down) {
        setState(f, 'crouch');
      } else if (inputs.left || inputs.right) {
        setState(f, 'walk');
        f.x += (inputs.right ? s.speed : 0) - (inputs.left ? s.speed : 0);
      } else {
        setState(f, 'idle');
      }
    }
  }

  // gravity
  if (f.y > GROUND_Y || f.vy > 0) {
    f.y += f.vy;
    f.vy -= 1.1;
    if (f.y <= GROUND_Y) {
      f.y = GROUND_Y;
      f.vy = 0;
      if (f.state === 'jump') setState(f, 'idle');
    }
  }

  f.x = Math.max(FIGHTER_W / 2, Math.min(ARENA_W - FIGHTER_W / 2, f.x));
  f.prev = { ...inputs };
}

export function activeHitbox(f) {
  if (!f.attack) return null;
  const a = attackData(f);
  if (f.stateT < a.startup || f.stateT >= a.startup + a.active) return null;
  const wide = a.bothSides;
  const reach = a.reach;
  return {
    x1: wide ? f.x - reach : (f.facing === 1 ? f.x : f.x - reach),
    x2: wide ? f.x + reach : (f.facing === 1 ? f.x + reach : f.x),
    y1: f.y + (f.state === 'crouch' ? 20 : 40),
    y2: f.y + 110,
    damage: a.damage, hitstun: a.hitstun, kind: f.attack,
  };
}

export function hurtbox(f) {
  const h = f.state === 'crouch' ? 90 : 140;
  return { x1: f.x - FIGHTER_W / 2, x2: f.x + FIGHTER_W / 2, y1: f.y, y2: f.y + h };
}

function resolveHits(state) {
  for (let i = 0; i < 2; i++) {
    const atk = state.fighters[i];
    const def = state.fighters[1 - i];
    if (atk.hasHit || def.state === 'ko') continue;
    const hb = activeHitbox(atk);
    if (!hb) continue;
    const ub = hurtbox(def);
    const overlap = hb.x1 < ub.x2 && hb.x2 > ub.x1 && hb.y1 < ub.y2 && hb.y2 > ub.y1;
    if (!overlap) continue;
    atk.hasHit = true;
    const blocked = def.state === 'block';
    const damage = blocked ? Math.max(1, Math.round(hb.damage * BLOCK_CHIP)) : hb.damage;
    def.health = Math.max(0, def.health - damage);
    def.x += (def.x >= atk.x ? 1 : -1) * (blocked ? 10 : 26);
    state.events.push({ t: state.tick, type: blocked ? 'blocked' : 'hit', who: i, damage, kind: hb.kind });
    if (def.health === 0) {
      setState(def, 'ko');
      state.events.push({ t: state.tick, type: 'ko', who: 1 - i });
    } else if (!blocked) {
      def.stunTicks = hb.hitstun;
      setState(def, 'hitstun');
      def.attack = null;
    } else {
      def.stunTicks = BLOCKSTUN;
      setState(def, 'hitstun');
    }
    state.hitPause = blocked ? 2 : hb.kind === 'light' ? 4 : 8;
    if (hb.kind !== 'light' && !blocked) state.shake = 12;
  }
}

function endRound(state) {
  const [a, b] = state.fighters;
  const winner = a.health === b.health ? -1 : a.health > b.health ? 0 : 1;
  if (winner >= 0) state.wins[winner] += 1;
  state.mode = state.wins[0] === 2 || state.wins[1] === 2 ? 'matchEnd' : 'roundEnd';
  if (state.mode === 'matchEnd') {
    state.announce = `${CHARACTERS[state.chars[state.wins[0] === 2 ? 0 : 1]].name} WINS THE MATCH`;
  } else {
    state.announce = winner === -1 ? 'DRAW' : `${CHARACTERS[state.chars[winner]].name} WINS ROUND ${state.round}`;
    state.round += 1;
  }
  state.announceT = 999999;
  state.events.push({ t: state.tick, type: state.mode, winner });
}

export function step(state, inputsA, inputsB) {
  const s = structuredClone(state);
  s.tick += 1;
  if (s.announceT > 0 && s.announceT < 999999) s.announceT -= 1;
  if (s.shake > 0) s.shake -= 1;
  if (s.mode !== 'fight') return s;
  if (s.hitPause > 0) { s.hitPause -= 1; return s; }

  updateFighter(s, 0, inputsA);
  updateFighter(s, 1, inputsB);
  resolveHits(s);

  const koed = s.fighters.some((f) => f.state === 'ko');
  s.timer -= 1;
  if (koed) {
    if (!s.koDelay) s.koDelay = 70;
    s.koDelay -= 1;
    if (s.koDelay <= 0) { s.koDelay = 0; endRound(s); }
  } else if (s.timer <= 0) {
    endRound(s);
  }
  if (s.events.length > 40) s.events = s.events.slice(-40);
  return s;
}

export function nextRound(state) {
  const s = structuredClone(state);
  if (s.mode !== 'roundEnd') return s;
  resetRound(s);
  return s;
}

export function rematch(state) {
  return newMatch(state.chars[0], state.chars[1]);
}

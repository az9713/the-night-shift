// Pure deterministic FPS simulation. Fixed 60 Hz ticks, no DOM, no WebGL, seeded RNG.
// The render layer and the tests both drive this.

import { SOLIDS, SITE_A, SITE_B, PLAYER_SPAWN, BOT_SPAWNS, WAYPOINTS, nearestWaypoint } from './level.js';

export const TICK = 1 / 60;
export const EYE = 1.62;
export const PLAYER_R = 0.4;
export const WALK = 4.2, RUN = 6.2;
export const GRAVITY = 18, JUMP_V = 6.4;
export const BUY_SECONDS = 5, ROUND_SECONDS = 115, BOMB_SECONDS = 40, PLANT_SECONDS = 3;

export const WEAPONS = {
  pistol: { damage: 24, mag: 12, reserve: 36, fireCooldown: 0.28, reload: 1.6, price: 0, range: 80 },
  rifle: { damage: 33, mag: 30, reserve: 90, fireCooldown: 0.1, reload: 2.4, price: 2700, range: 120 },
};

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

export const emptyInput = () => ({
  forward: false, back: false, left: false, right: false,
  jump: false, walk: false, fire: false, reload: false, plant: false, buyRifle: false,
  yaw: 0, pitch: 0,
});

// THE control-correctness core (the K3 failure Pat caught was exactly here).
// three.js convention: yaw=0 looks down -Z; yaw grows counter-clockwise.
export function moveVector(yaw, input) {
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw);   // camera forward on ground plane
  const rx = Math.cos(yaw), rz = -Math.sin(yaw);    // camera right
  let x = 0, z = 0;
  if (input.forward) { x += fx; z += fz; }
  if (input.back) { x -= fx; z -= fz; }
  if (input.right) { x += rx; z += rz; }
  if (input.left) { x -= rx; z -= rz; }
  const len = Math.hypot(x, z);
  return len > 0 ? [x / len, z / len] : [0, 0];
}

const aabbContains = (b, x, y, z, r) =>
  x > b[0] - b[3] / 2 - r && x < b[0] + b[3] / 2 + r &&
  y > b[1] - b[4] / 2 - 0.05 && y < b[1] + b[4] / 2 + 1.7 &&
  z > b[2] - b[5] / 2 - r && z < b[2] + b[5] / 2 + r;

// per-axis slide collision against level solids
export function collide(pos, next) {
  const out = [...next];
  for (const b of SOLIDS) {
    if (aabbContains(b, out[0], pos[1], pos[2], PLAYER_R)) out[0] = pos[0];
  }
  for (const b of SOLIDS) {
    if (aabbContains(b, out[0], pos[1], out[2], PLAYER_R)) out[2] = pos[2];
  }
  return out;
}

// segment vs AABB (slab method) — used for line-of-sight and hitscan wall stops
export function rayHitsBox(ox, oy, oz, dx, dy, dz, maxT, b) {
  let tmin = 0, tmax = maxT;
  const o = [ox, oy, oz], d = [dx, dy, dz];
  for (let i = 0; i < 3; i++) {
    const lo = b[i] - b[i + 3] / 2, hi = b[i] + b[i + 3] / 2;
    if (Math.abs(d[i]) < 1e-9) {
      if (o[i] < lo || o[i] > hi) return null;
    } else {
      let t1 = (lo - o[i]) / d[i], t2 = (hi - o[i]) / d[i];
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
  }
  return tmin;
}

export function wallBlock(ox, oy, oz, tx, ty, tz) {
  const dx = tx - ox, dy = ty - oy, dz = tz - oz;
  const dist = Math.hypot(dx, dy, dz);
  if (dist < 1e-6) return null;
  let nearest = null;
  for (const b of SOLIDS) {
    const t = rayHitsBox(ox, oy, oz, dx / dist, dy / dist, dz / dist, dist, b);
    if (t !== null && (nearest === null || t < nearest)) nearest = t;
  }
  return nearest; // distance to first wall along the segment, or null
}

export const hasLOS = (ox, oy, oz, tx, ty, tz) => {
  const block = wallBlock(ox, oy, oz, tx, ty, tz);
  return block === null || block >= Math.hypot(tx - ox, ty - oy, tz - oz) - 0.05;
};

function newBot(id, [x, z]) {
  return {
    id, pos: [x, 0, z], yaw: 0, health: 100, state: 'patrol',
    wp: nearestWaypoint(x, z), fireCd: 0, reactCd: 0.5, deadT: 0,
  };
}

export function newGame(seed = 20260719) {
  return {
    tick: 0, seed, mode: 'buy', phaseT: BUY_SECONDS,
    round: 1, score: { player: 0, bots: 0 },
    money: 800,
    player: {
      pos: [...PLAYER_SPAWN], vel: [0, 0, 0], grounded: true,
      health: 100, armor: 0, alive: true,
      weapon: 'pistol', ammo: WEAPONS.pistol.mag, reserve: WEAPONS.pistol.reserve,
      reloadT: 0, fireCd: 0, plantT: 0,
    },
    bots: BOT_SPAWNS.map((s, i) => newBot(i, s)),
    bomb: { planted: false, site: null, timer: 0 },
    events: [],
    rand: null, // attached lazily (functions aren't cloneable) — see step()
  };
}

function resetRound(s) {
  s.mode = 'buy';
  s.phaseT = BUY_SECONDS;
  s.round += 1;
  const p = s.player;
  p.pos = [...PLAYER_SPAWN]; p.vel = [0, 0, 0];
  p.health = 100; p.alive = true; p.plantT = 0; p.reloadT = 0;
  const w = WEAPONS[p.weapon];
  p.ammo = w.mag; p.reserve = w.reserve;
  s.bots = BOT_SPAWNS.map((sp, i) => newBot(i, sp));
  s.bomb = { planted: false, site: null, timer: 0 };
}

function endRound(s, playerWon, why) {
  s.mode = 'roundEnd';
  s.phaseT = 4;
  if (playerWon) { s.score.player += 1; s.money += 3250; }
  else { s.score.bots += 1; s.money += 1400; }
  s.money = Math.min(s.money, 16000);
  s.events.push({ t: s.tick, type: 'roundEnd', playerWon, why });
}

const inSite = (pos, site) => Math.hypot(pos[0] - site[0], pos[2] - site[1]) < site[2];

export function step(state, input, rand) {
  const s = structuredClone(state);
  rand = rand ?? mulberry32(s.seed + s.tick);
  s.tick += 1;
  const p = s.player;
  s.events = s.events.slice(-30);

  // phase timers
  s.phaseT -= TICK;
  if (s.mode === 'buy') {
    if (input.buyRifle && p.weapon !== 'rifle' && s.money >= WEAPONS.rifle.price) {
      s.money -= WEAPONS.rifle.price;
      p.weapon = 'rifle'; p.ammo = WEAPONS.rifle.mag; p.reserve = WEAPONS.rifle.reserve;
      s.events.push({ t: s.tick, type: 'buy', item: 'rifle' });
    }
    if (s.phaseT <= 0) { s.mode = 'live'; s.phaseT = ROUND_SECONDS; }
  } else if (s.mode === 'roundEnd') {
    if (s.phaseT <= 0) resetRound(s);
    return s;
  }

  if (s.mode === 'live' && s.phaseT <= 0 && !s.bomb.planted) {
    endRound(s, false, 'time');
    return s;
  }
  if (s.bomb.planted) {
    s.bomb.timer -= TICK;
    if (s.bomb.timer <= 0) { endRound(s, true, 'boom'); return s; }
  }

  // ---- player ----
  if (p.alive && (s.mode === 'live' || s.mode === 'buy')) {
    const speed = input.walk ? WALK : RUN;
    const [mx, mz] = moveVector(input.yaw, input);
    const next = [p.pos[0] + mx * speed * TICK, p.pos[1], p.pos[2] + mz * speed * TICK];
    const solved = collide(p.pos, next);
    p.pos[0] = solved[0]; p.pos[2] = solved[2];
    // vertical
    if (input.jump && p.grounded) { p.vel[1] = JUMP_V; p.grounded = false; }
    if (!p.grounded) {
      p.vel[1] -= GRAVITY * TICK;
      p.pos[1] += p.vel[1] * TICK;
      if (p.pos[1] <= 0) { p.pos[1] = 0; p.vel[1] = 0; p.grounded = true; }
    }

    p.fireCd = Math.max(0, p.fireCd - TICK);
    if (p.reloadT > 0) {
      p.reloadT -= TICK;
      if (p.reloadT <= 0) {
        const w = WEAPONS[p.weapon];
        const need = w.mag - p.ammo;
        const take = Math.min(need, p.reserve);
        p.ammo += take; p.reserve -= take;
      }
    } else if (input.reload && p.ammo < WEAPONS[p.weapon].mag && p.reserve > 0) {
      p.reloadT = WEAPONS[p.weapon].reload;
      s.events.push({ t: s.tick, type: 'reload' });
    } else if (input.fire && p.fireCd === 0 && p.ammo > 0 && s.mode === 'live') {
      p.ammo -= 1;
      p.fireCd = WEAPONS[p.weapon].fireCooldown;
      const cy = Math.cos(input.pitch), sy = Math.sin(input.pitch);
      const dx = -Math.sin(input.yaw) * cy, dyy = sy, dz = -Math.cos(input.yaw) * cy;
      const ox = p.pos[0], oy = p.pos[1] + EYE, oz = p.pos[2];
      const wallT = wallBlock(ox, oy, oz, ox + dx * 200, oy + dyy * 200, oz + dz * 200) ?? 200;
      let hit = null, hitT = wallT;
      for (const b of s.bots) {
        if (b.state === 'dead') continue;
        // bot body: capsule approximated by sphere at chest height
        const bx = b.pos[0] - ox, by = b.pos[1] + 1.2 - oy, bz = b.pos[2] - oz;
        const tProj = bx * dx + by * dyy + bz * dz;
        if (tProj < 0 || tProj > hitT) continue;
        const px = bx - dx * tProj, py = by - dyy * tProj, pz = bz - dz * tProj;
        if (Math.hypot(px, py, pz) < 0.55) { hit = b; hitT = tProj; }
      }
      s.events.push({ t: s.tick, type: 'shot', hit: hit ? hit.id : null });
      if (hit) {
        hit.health -= WEAPONS[p.weapon].damage;
        if (hit.health <= 0) {
          hit.state = 'dead'; hit.deadT = 0;
          s.money = Math.min(16000, s.money + 300);
          s.events.push({ t: s.tick, type: 'kill', bot: hit.id, weapon: p.weapon });
        }
      }
    }

    // planting
    const site = inSite(p.pos, SITE_A) ? 'A' : inSite(p.pos, SITE_B) ? 'B' : null;
    if (s.mode === 'live' && !s.bomb.planted && site && input.plant) {
      p.plantT += TICK;
      if (p.plantT >= PLANT_SECONDS) {
        s.bomb = { planted: true, site, timer: BOMB_SECONDS };
        s.money = Math.min(16000, s.money + 300);
        s.events.push({ t: s.tick, type: 'planted', site });
      }
    } else {
      p.plantT = 0;
    }
  }

  // ---- bots ----
  if (s.mode === 'live') {
    for (const b of s.bots) {
      if (b.state === 'dead') continue;
      const [px, py, pz] = p.pos;
      const dx = px - b.pos[0], dz = pz - b.pos[2];
      const dist = Math.hypot(dx, dz);
      const los = p.alive && dist < 45 &&
        hasLOS(b.pos[0], 1.5, b.pos[2], px, py + 1.2, pz);
      if (los) {
        if (b.state !== 'engage') { b.state = 'engage'; b.reactCd = 0.45; }
      } else if (b.state === 'engage') {
        b.state = 'patrol';
        b.wp = nearestWaypoint(b.pos[0], b.pos[2]);
      }

      if (b.state === 'engage') {
        b.yaw = Math.atan2(-dx, -dz);
        b.reactCd = Math.max(0, b.reactCd - TICK);
        b.fireCd = Math.max(0, b.fireCd - TICK);
        // hold at range; strafe-ish approach when far
        if (dist > 18) {
          b.pos[0] += (dx / dist) * 2.6 * TICK;
          b.pos[2] += (dz / dist) * 2.6 * TICK;
        }
        if (b.reactCd === 0 && b.fireCd === 0 && p.alive) {
          b.fireCd = 0.55;
          const acc = Math.max(0.15, 0.85 - dist * 0.012);
          s.events.push({ t: s.tick, type: 'botShot', bot: b.id });
          if (rand() < acc) {
            const dmg = 12 + Math.floor(rand() * 10);
            const absorbed = Math.min(p.armor, Math.floor(dmg * 0.5));
            p.armor -= absorbed;
            p.health -= dmg - absorbed;
            s.events.push({ t: s.tick, type: 'playerHit', dmg: dmg - absorbed });
            if (p.health <= 0) {
              p.alive = false;
              s.events.push({ t: s.tick, type: 'playerDead' });
              endRound(s, false, 'died');
              return s;
            }
          }
        }
      } else {
        const [wx, wz] = WAYPOINTS[b.wp];
        const wdx = wx - b.pos[0], wdz = wz - b.pos[2];
        const wd = Math.hypot(wdx, wdz);
        if (wd < 1.2) b.wp = (b.wp + (b.id % 2 ? 1 : WAYPOINTS.length - 1)) % WAYPOINTS.length;
        else {
          b.yaw = Math.atan2(-wdx, -wdz);
          const nb = collide(b.pos, [b.pos[0] + (wdx / wd) * 3 * TICK, b.pos[1], b.pos[2] + (wdz / wd) * 3 * TICK]);
          b.pos[0] = nb[0]; b.pos[2] = nb[2];
        }
      }
    }
    if (s.bots.every((b) => b.state === 'dead')) {
      endRound(s, true, 'elimination');
      return s;
    }
  }

  return s;
}

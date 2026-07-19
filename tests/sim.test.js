import { describe, expect, it } from 'vitest';
import {
  BUY_SECONDS, PLANT_SECONDS, TICK, WEAPONS,
  collide, emptyInput, hasLOS, moveVector, mulberry32, newGame, step, wallBlock,
} from '../public/src/sim.js';
import { PLAYER_SPAWN, SITE_A, WALLS } from '../public/src/level.js';

const I = (over = {}) => ({ ...emptyInput(), ...over });

function run(s, ticks, inputFn) {
  const rand = mulberry32(99);
  for (let t = 0; t < ticks; t++) s = step(s, inputFn(s, t), rand);
  return s;
}
const skipBuy = (s) => run(s, Math.ceil(BUY_SECONDS / TICK) + 2, () => I());

describe('control correctness — the K3 failure class', () => {
  it('W moves exactly forward relative to look direction at every tested yaw', () => {
    for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2, 0.7]) {
      const [mx, mz] = moveVector(yaw, I({ forward: true }));
      // camera forward on ground plane in three.js convention
      expect(mx).toBeCloseTo(-Math.sin(yaw), 6);
      expect(mz).toBeCloseTo(-Math.cos(yaw), 6);
    }
  });

  it('S is opposite W; D is 90° clockwise from W; A is opposite D', () => {
    const yaw = 0.9;
    const [wx, wz] = moveVector(yaw, I({ forward: true }));
    const [sx, sz] = moveVector(yaw, I({ back: true }));
    const [dx2, dz2] = moveVector(yaw, I({ right: true }));
    const [ax, az] = moveVector(yaw, I({ left: true }));
    expect(sx).toBeCloseTo(-wx, 6); expect(sz).toBeCloseTo(-wz, 6);
    expect(ax).toBeCloseTo(-dx2, 6); expect(az).toBeCloseTo(-dz2, 6);
    // right = forward rotated -90° (clockwise looking down)
    expect(dx2).toBeCloseTo(-wz, 6); expect(dz2).toBeCloseTo(wx, 6);
  });

  it('diagonals are normalized (no speed boost)', () => {
    const [x, z] = moveVector(0, I({ forward: true, right: true }));
    expect(Math.hypot(x, z)).toBeCloseTo(1, 6);
  });

  it('in-game: holding W moves the player in the camera-forward direction', () => {
    let s = skipBuy(newGame());
    const start = [...s.player.pos];
    s = run(s, 30, () => I({ forward: true, yaw: 0 }));       // yaw 0 → -z
    expect(s.player.pos[2]).toBeLessThan(start[2] - 1);
    expect(Math.abs(s.player.pos[0] - start[0])).toBeLessThan(0.01);
    const s2 = run(skipBuy(newGame()), 30, () => I({ forward: true, yaw: Math.PI / 2 })); // → -x
    expect(s2.player.pos[0]).toBeLessThan(start[0] - 1);
  });
});

describe('collision and line of sight', () => {
  it('walls stop movement', () => {
    // south outer wall at z=31: walk into it
    const pos = [0, 0, 29.4];
    const next = collide(pos, [0, 0, 30.6]);
    expect(next[2]).toBe(29.4);
  });

  it('sliding along a wall keeps the tangent component', () => {
    const pos = [0, 0, 29.4];
    const next = collide(pos, [1.5, 0, 30.6]);
    expect(next[0]).toBeCloseTo(1.5);
    expect(next[2]).toBe(29.4);
  });

  it('rays are blocked by walls and pass through gaps', () => {
    // across the mid west wall (x=-6): blocked
    expect(hasLOS(-10, 1.5, -6, 0, 1.5, -6)).toBe(false);
    // straight down an open east lane
    expect(hasLOS(36, 1.5, 25, 36, 1.5, 10)).toBe(true);
    // spawn screen blocks the direct mid line onto spawn
    expect(hasLOS(0, 1.5, 6, 0, 1.5, 26)).toBe(false);
  });

  it('wallBlock returns distance to first solid', () => {
    const d = wallBlock(0, 1.5, 29, 0, 1.5, 40);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(2.2); // south wall face at z=30
  });
});

describe('shooting, damage, economy', () => {
  function aimAtBot(s) {
    const b = s.bots.find((x) => x.state !== 'dead');
    const p = s.player.pos;
    const dx = b.pos[0] - p[0], dz = b.pos[2] - p[2];
    const dy = (b.pos[1] + 1.2) - (p[1] + 1.62);
    const yaw = Math.atan2(-dx, -dz);
    const pitch = Math.atan2(dy, Math.hypot(dx, dz));
    return { b, yaw, pitch };
  }

  it('hitscan only registers with line of sight; kill pays $300', () => {
    let s = skipBuy(newGame());
    // teleport player near A-site defender with clear LOS (open site area)
    s.player.pos = [24, 0, -14];
    const { b, yaw, pitch } = aimAtBot(s);
    const before = b.health;
    const moneyBefore = s.money;
    let shots = 0;
    while (s.bots[b.id].state !== 'dead' && shots < 30) {
      s = step(s, I({ fire: true, yaw, pitch }), mulberry32(1)); shots++;
      s = step(s, I({ yaw, pitch }), mulberry32(1)); // release trigger between cooldowns
      for (let i = 0; i < 16; i++) s = step(s, I({ yaw, pitch }), mulberry32(1));
    }
    expect(s.bots[b.id].state).toBe('dead');
    expect(s.money).toBeGreaterThanOrEqual(moneyBefore + 300 - 1);
    expect(before).toBe(100);
  });

  it('shots through a wall do not hit', () => {
    let s = skipBuy(newGame());
    s.player.pos = [-10, 0, -6];       // west of mid wall
    // bot placed just east of the mid wall
    s.bots[0].pos = [-2, 0, -6];
    const yaw = Math.atan2(-(-2 - -10), 0) * 1; // aim +x → yaw = -PI/2
    s = step(s, I({ fire: true, yaw: -Math.PI / 2, pitch: 0 }), mulberry32(2));
    const shot = s.events.find((e) => e.type === 'shot');
    expect(shot.hit).toBeNull();
    expect(s.bots[0].health).toBe(100);
  });

  it('reload refills the magazine from reserve', () => {
    let s = skipBuy(newGame());
    s.player.ammo = 2;
    s = step(s, I({ reload: true }), mulberry32(3));
    expect(s.player.reloadT).toBeGreaterThan(0);
    s = run(s, Math.ceil(WEAPONS.pistol.reload / TICK) + 2, () => I());
    expect(s.player.ammo).toBe(WEAPONS.pistol.mag);
    expect(s.player.reserve).toBe(WEAPONS.pistol.reserve - (WEAPONS.pistol.mag - 2));
  });

  it('buying a rifle in buy phase deducts money and swaps weapon', () => {
    let s = newGame();
    s.money = 3000;
    s = step(s, I({ buyRifle: true }), mulberry32(4));
    expect(s.player.weapon).toBe('rifle');
    expect(s.money).toBe(300);
    expect(s.player.ammo).toBe(WEAPONS.rifle.mag);
  });
});

describe('bots', () => {
  it('patrol until they see the player, then engage and deal damage', () => {
    let s = skipBuy(newGame());
    s.player.pos = [24, 0, -16];       // walk into A site sightlines
    let engaged = false, hurt = false;
    for (let t = 0; t < 600; t++) {
      s = step(s, I({ yaw: 0 }), mulberry32(5));
      if (s.bots.some((b) => b.state === 'engage')) engaged = true;
      if (s.player.health < 100) { hurt = true; break; }
      if (s.mode === 'roundEnd') break;
    }
    expect(engaged).toBe(true);
    expect(hurt).toBe(true);
  });

  it('bots patrol between waypoints when unseen', () => {
    let s = skipBuy(newGame());
    s.player.pos = [0, 0, 26]; // far from all
    const before = s.bots.map((b) => [...b.pos]);
    s = run(s, 240, () => I({ yaw: 0 }));
    const moved = s.bots.some((b, i) => Math.hypot(b.pos[0] - before[i][0], b.pos[2] - before[i][2]) > 1);
    expect(moved).toBe(true);
  });
});

describe('round loop', () => {
  it('planting at a site arms the bomb; timer expiry wins the round for the player', () => {
    let s = skipBuy(newGame());
    s.player.pos = [SITE_A[0], 0, SITE_A[1]];
    s.bots.forEach((b) => { b.state = 'dead'; b.health = 0; });   // clear defenders (test isolation)
    // NOTE: all-dead triggers elimination win first — so keep one alive but far & wall-blocked
    s.bots[2].state = 'patrol'; s.bots[2].health = 100; s.bots[2].pos = [-24, 0, 20];
    s = run(s, Math.ceil(PLANT_SECONDS / TICK) + 3, () => I({ plant: true }));
    expect(s.bomb.planted).toBe(true);
    expect(s.bomb.site).toBe('A');
    s.bomb.timer = 0.05;
    s = run(s, 6, () => I());
    expect(s.mode).toBe('roundEnd');
    expect(s.score.player).toBe(1);
  });

  it('killing every bot ends the round in elimination', () => {
    let s = skipBuy(newGame());
    s.bots.forEach((b, i) => { if (i > 0) { b.state = 'dead'; b.health = 0; } });
    s.player.pos = [24, 0, -14];
    s.bots[0].pos = [24, 0, -20];
    const yaw = Math.atan2(0, 6);
    let guard = 0;
    while (s.mode !== 'roundEnd' && guard++ < 400) {
      const b = s.bots[0];
      const dx = b.pos[0] - s.player.pos[0], dz = b.pos[2] - s.player.pos[2];
      const dy = (b.pos[1] + 1.2) - (s.player.pos[1] + 1.62);
      const pitch = Math.atan2(dy, Math.hypot(dx, dz));
      s = step(s, I({ fire: guard % 18 === 0, yaw: Math.atan2(-dx, -dz), pitch }), mulberry32(6));
    }
    expect(s.mode).toBe('roundEnd');
    expect(s.events.some((e) => e.type === 'roundEnd' && e.why === 'elimination' && e.playerWon)).toBe(true);
  });

  it('round timer expiry without a plant loses the round; next round resets', () => {
    let s = skipBuy(newGame());
    s.phaseT = 0.05;
    s = run(s, 6, () => I());
    expect(s.mode).toBe('roundEnd');
    expect(s.score.bots).toBe(1);
    s.phaseT = 0.05;
    s = run(s, 6, () => I());
    expect(s.mode).toBe('buy');
    expect(s.round).toBe(2);
    expect(s.player.health).toBe(100);
    expect(s.player.pos).toEqual([...PLAYER_SPAWN]);
  });

  it('deterministic: same seed and inputs produce identical states', () => {
    const play = () => {
      let s = newGame(7);
      const rand = mulberry32(7);
      for (let t = 0; t < 500; t++) {
        s = step(s, I({ forward: t % 5 !== 0, yaw: t * 0.01, fire: t % 40 === 0 }), rand);
      }
      return s;
    };
    expect(play()).toEqual(play());
  });
});

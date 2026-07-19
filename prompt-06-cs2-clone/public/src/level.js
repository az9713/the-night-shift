// Original layout in the spirit of a two-site desert map. Data only — consumed by
// sim (collision, waypoints) and by the render layer (geometry). Units: meters.

// Axis-aligned solid boxes: [cx, cy, cz, sx, sy, sz] (center, full size)
export const WALL_H = 4;
const W = (cx, cz, sx, sz, h = WALL_H, cy = h / 2) => [cx, cy, cz, sx, h, sz];

export const WALLS = [
  // outer shell (80 x 60)
  W(0, -31, 84, 2),        // north
  W(0, 31, 84, 2),         // south
  W(-41, 0, 2, 64),        // west
  W(41, 0, 2, 64),         // east
  // mid corridor spine
  W(-6, -6, 2, 34),        // mid west wall
  W(6, 2, 2, 30),          // mid east wall
  // A site (north-east) enclosure
  W(24, -12, 30, 2),       // A south wall with gap at connector (x 6..14 open below)
  W(14, -21, 2, 16),       // A west wall
  // B site (south-west) enclosure
  W(-24, 12, 30, 2),
  W(-14, 21, 2, 16),
  // connectors / cover walls
  W(-20, -14, 24, 2),      // upper-mid to B cut
  W(20, 14, 24, 2),        // lower-mid to A cut
  W(0, 18, 12, 2, 3),      // spawn screen — breaks the mid sightline onto spawn
];

// climbable/cover crates: same AABB format, wood
export const CRATES = [
  [18, 0.75, -22, 1.5, 1.5, 1.5], [19.5, 0.75, -20.5, 1.5, 1.5, 1.5], [18.7, 2.25, -21.3, 1.5, 1.5, 1.5],
  [26, 0.75, -18, 1.5, 1.5, 1.5], [-18, 0.75, 22, 1.5, 1.5, 1.5], [-19.5, 0.75, 20.5, 1.5, 1.5, 1.5],
  [-26, 0.75, 18, 1.5, 1.5, 1.5], [-18.7, 2.25, 21.3, 1.5, 1.5, 1.5],
  [0, 0.75, -2, 1.5, 1.5, 1.5], [1.6, 0.75, -0.4, 1.5, 1.5, 1.5],   // mid doors cover
  [-30, 0.75, -8, 1.5, 1.5, 1.5], [30, 0.75, 8, 1.5, 1.5, 1.5],
];

export const SOLIDS = [...WALLS, ...CRATES.map((c) => c)];

// bomb sites: [cx, cz, radius]
export const SITE_A = [24, -22, 6];
export const SITE_B = [-24, 22, 6];

// player (T) spawn south, bots (CT) hold sites/mid
export const PLAYER_SPAWN = [0, 0, 26];
export const BOT_SPAWNS = [
  [24, -20], [20, -24],   // A defenders
  [-24, 20],              // B defender
  [0, -14], [2, -24],     // mid / rotate
];

export const WAYPOINTS = [
  [24, -22], [14, -16], [8, -8], [0, -14], [-8, -8], [-14, 16], [-24, 22],
  [-24, 12], [0, 6], [20, 14], [26, -12], [0, -24],
];

export function nearestWaypoint(x, z) {
  let best = 0, bd = Infinity;
  WAYPOINTS.forEach(([wx, wz], i) => {
    const d = (wx - x) ** 2 + (wz - z) ** 2;
    if (d < bd) { bd = d; best = i; }
  });
  return best;
}

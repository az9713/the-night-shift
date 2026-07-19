// Four characters — visually and mechanically distinct; each special is unique.

export const CHARACTERS = {
  volt: {
    name: 'VOLT', tagline: 'Storm dash',
    speed: 4.4, jump: 15,
    palette: { body: '#ffd23f', trim: '#2b6cff', skin: '#f2c9a0' },
    // lightning dash: lunges forward fast during the strike
    special: { startup: 9, active: 6, recovery: 18, damage: 20, hitstun: 30, reach: 70, dash: 9, label: 'STORM DASH (↓ → punch)' },
  },
  blaze: {
    name: 'BLAZE', tagline: 'Rising fire',
    speed: 3.8, jump: 17,
    palette: { body: '#ff4f3f', trim: '#ffb03f', skin: '#e8b58c' },
    // flame uppercut: big damage, big recovery
    special: { startup: 7, active: 7, recovery: 26, damage: 26, hitstun: 34, reach: 64, dash: 3, label: 'FIRE RISER (↓ → punch)' },
  },
  granite: {
    name: 'GRANITE', tagline: 'Ground slam',
    speed: 3.0, jump: 13,
    palette: { body: '#8f9aa5', trim: '#4a4f57', skin: '#c9a68a' },
    // seismic slam: hits both sides at once
    special: { startup: 14, active: 6, recovery: 24, damage: 22, hitstun: 36, reach: 110, bothSides: true, label: 'SEISMIC SLAM (↓ → punch)' },
  },
  wisp: {
    name: 'WISP', tagline: 'Phantom reach',
    speed: 4.8, jump: 16,
    palette: { body: '#b17aff', trim: '#3ee6c4', skin: '#d9c2ef' },
    // phantom lance: longest reach in the game, modest damage
    special: { startup: 11, active: 5, recovery: 20, damage: 17, hitstun: 28, reach: 150, label: 'PHANTOM LANCE (↓ → punch)' },
  },
};

export const CHARACTER_IDS = Object.keys(CHARACTERS);

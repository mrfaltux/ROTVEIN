/* ROTVEIN — the bestiary as data.
   Every creature is slower than a running survivor: the threat is never raw
   pursuit speed, it is the tactic. `tactic` names a behaviour in
   entities/tactics.js, `build` names a body recipe in entities/enemyMeshes.js.

   spd     cruising speed in units/sec (the player runs at ~8.6)
   scale   final size — creatures emerge squashed and grow into this
   unlock  seconds survived before the director may roll this type
   weight  relative spawn weight as a function of run time
*/

export const ETYPES = {
  crawler: {
    tactic: 'swarm', build: 'beetle', hp: 24, spd: 2.6, dmg: 9, r: 0.7, xp: 1, scale: 1.35,
    color: 0x2f7a2a, acc: 0x8fd44a, unlock: 0, weight: t => Math.max(2.5, 11 - t / 32),
    glyph: '<ellipse cx="12" cy="13" rx="6" ry="5"/><circle cx="12" cy="6" r="2.6"/><path d="M6 10 L2 7 M18 10 L22 7 M6 16 L2 19 M18 16 L22 19"/>',
  },
  tick: {
    tactic: 'latch', build: 'tick', hp: 18, spd: 4.2, dmg: 3.2, r: 0.42, xp: 1, scale: 0.95,
    color: 0x7a1f2a, acc: 0xff6b6b, unlock: 28, weight: () => 4,
    glyph: '<circle cx="12" cy="13" r="5.5"/><path d="M7 9 L3 5 M17 9 L21 5 M8 18 L5 21 M16 18 L19 21"/>',
  },
  wasp: {
    tactic: 'divebomb', build: 'hornet', hp: 22, spd: 3.6, dmg: 11, r: 0.55, xp: 2, scale: 1.15,
    color: 0xd4a017, acc: 0x201a10, unlock: 42, weight: () => 5, fly: 2.4,
    glyph: '<ellipse cx="12" cy="14" rx="3.6" ry="6"/><path d="M9 10 Q2 6 4 12 M15 10 Q22 6 20 12"/><path d="M12 21 L12 23"/>',
  },
  firefly: {
    tactic: 'bomber', build: 'firefly', hp: 26, spd: 3.4, dmg: 26, r: 0.5, xp: 2, scale: 1.05,
    color: 0x3a2b0f, acc: 0xffd34d, unlock: 66, weight: () => 3.2, fly: 2.1,
    glyph: '<ellipse cx="12" cy="14" rx="4" ry="5.5"/><circle cx="12" cy="18" r="3"/><path d="M8 10 Q3 8 5 13 M16 10 Q21 8 19 13"/>',
  },
  spitter: {
    tactic: 'artillery', build: 'grub', hp: 34, spd: 2.2, dmg: 10, r: 0.75, xp: 2, scale: 1.4,
    color: 0x7a2f8f, acc: 0xd48af0, unlock: 78, weight: () => 4.5,
    glyph: '<ellipse cx="11" cy="14" rx="6" ry="5"/><circle cx="16" cy="9" r="2.4"/><path d="M18 7 Q22 4 22 2"/>',
  },
  spider: {
    tactic: 'webber', build: 'spider', hp: 40, spd: 2.4, dmg: 7, r: 0.8, xp: 3, scale: 1.5,
    color: 0x241a2e, acc: 0xdfe9ff, unlock: 96, weight: () => 4,
    glyph: '<circle cx="12" cy="13" r="4.4"/><path d="M8 10 L2 6 M16 10 L22 6 M7 13 L1 13 M17 13 L23 13 M8 16 L3 20 M16 16 L21 20"/>',
  },
  moth: {
    tactic: 'polluter', build: 'moth', hp: 38, spd: 2.8, dmg: 6, r: 0.7, xp: 3, scale: 1.35,
    color: 0x5a4a6b, acc: 0xc9b8e0, unlock: 112, weight: () => 3.2, fly: 3.2,
    glyph: '<ellipse cx="12" cy="13" rx="1.8" ry="6"/><path d="M10 9 Q1 3 3 14 Q6 18 10 15 M14 9 Q23 3 21 14 Q18 18 14 15"/>',
  },
  mantis: {
    tactic: 'duelist', build: 'mantis', hp: 60, spd: 3.0, dmg: 20, r: 0.8, xp: 5, scale: 1.6,
    color: 0x2f8f4a, acc: 0xd6ff7a, unlock: 130, weight: () => 4,
    glyph: '<ellipse cx="12" cy="15" rx="3" ry="6"/><circle cx="12" cy="7" r="2.4"/><path d="M9 10 L4 6 L7 3 M15 10 L20 6 L17 3"/>',
  },
  toad: {
    tactic: 'hopper', build: 'toad', hp: 75, spd: 2.0, dmg: 16, r: 1.0, xp: 5, scale: 1.7,
    color: 0x3f6b2f, acc: 0xb8e04d, unlock: 150, weight: () => 3,
    glyph: '<ellipse cx="12" cy="14" rx="7" ry="5"/><circle cx="9" cy="10" r="1.6"/><circle cx="15" cy="10" r="1.6"/><path d="M5 17 L2 21 M19 17 L22 21"/>',
  },
  centipede: {
    tactic: 'weaver', build: 'centipede', hp: 85, spd: 3.2, dmg: 13, r: 0.75, xp: 6, scale: 1.5,
    color: 0x8f3a1f, acc: 0xffb020, unlock: 172, weight: () => 3.4,
    glyph: '<path d="M3 16 Q7 9 11 16 Q15 23 19 16" /><circle cx="21" cy="14" r="2.2"/><path d="M5 15 L4 11 M9 14 L10 10 M13 17 L12 21 M17 15 L18 11"/>',
  },
  brute: {
    tactic: 'charger', build: 'rhino', hp: 160, spd: 1.7, dmg: 26, r: 1.35, xp: 9, scale: 2.5,
    color: 0x6b3a1f, acc: 0xd9531e, unlock: 190, weight: () => 3,
    glyph: '<ellipse cx="12" cy="15" rx="7" ry="5.5"/><path d="M12 9 L12 3 L15 6"/><path d="M5 12 L1 9 M19 12 L23 9"/>',
  },
  scorpion: {
    tactic: 'burrower', build: 'scorpion', hp: 95, spd: 2.2, dmg: 18, r: 0.95, xp: 8, scale: 2.0,
    color: 0x4a3520, acc: 0xffd34d, unlock: 214, weight: () => 3,
    glyph: '<ellipse cx="11" cy="15" rx="5" ry="4"/><path d="M16 14 Q22 12 20 6 L18 4"/><path d="M7 12 L3 8 L6 6 M9 11 L6 6"/>',
  },
  serpent: {
    tactic: 'striker', build: 'serpent', hp: 110, spd: 2.0, dmg: 24, r: 0.85, xp: 8, scale: 1.8,
    color: 0x1f5a3a, acc: 0xb6ff2e, unlock: 238, weight: () => 3,
    glyph: '<path d="M4 20 Q12 18 10 12 Q8 6 15 5"/><circle cx="17" cy="5" r="2.4"/><path d="M19 4 L22 3"/>',
  },
  sac: {
    tactic: 'spawner', build: 'sac', hp: 140, spd: 0.6, dmg: 8, r: 1.2, xp: 10, scale: 2.2,
    color: 0x6b2f5a, acc: 0xff9ee0, unlock: 262, weight: () => 1.8,
    glyph: '<ellipse cx="12" cy="14" rx="6.5" ry="7"/><path d="M9 12 Q12 15 15 12 M9 16 Q12 19 15 16"/><path d="M12 7 L12 3"/>',
  },

  /* ---------------- bosses ---------------- */
  apex: {
    tactic: 'apex', build: 'apex', hp: 1200, spd: 2.2, dmg: 34, r: 1.7, xp: 60, scale: 3.0,
    color: 0x400f2e, acc: 0xff3a6e, unlock: 175, weight: () => 0, boss: true,
    glyph: '<ellipse cx="12" cy="14" rx="8" ry="6"/><path d="M12 8 L9 2 M12 8 L15 2"/><path d="M4 11 L1 6 M20 11 L23 6 M4 18 L1 22 M20 18 L23 22"/>',
  },
  brood: {
    tactic: 'brood', build: 'brood', hp: 1900, spd: 1.6, dmg: 22, r: 1.8, xp: 70, scale: 3.0,
    color: 0x2b1030, acc: 0xdfe9ff, unlock: 350, weight: () => 0, boss: true,
    glyph: '<ellipse cx="12" cy="15" rx="6" ry="7"/><circle cx="12" cy="7" r="3"/><path d="M6 10 L1 4 M18 10 L23 4 M6 18 L2 22 M18 18 L22 22"/>',
  },
};

export const BOSS_ORDER = ['apex', 'brood'];
export const ETYPE_KEYS = Object.keys(ETYPES);

/** creatures the director may roll at this point in the run */
export function unlockedTypes(time) {
  return ETYPE_KEYS.filter(k => !ETYPES[k].boss && time >= ETYPES[k].unlock);
}

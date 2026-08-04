/* ROTVEIN — the single mutable run-state object.
   Everything that a run resets lives in defaults(); everything that persists
   across runs (language, mute, best score) lives in PROFILE. */

const BASE = {
  /* run */
  time: 0, kills: 0, combo: 0, comboT: 0, alive: false, paused: true, over: false,
  boss: null, bossIdx: 0, killedBy: null, pendingDeath: false,
  /* progression */
  level: 1, xp: 0, xpNext: 6,
  /* survival */
  hp: 100, maxHp: 100,
  /* offence */
  dmg: 11, atkSpd: 1.7, range: 18, projSpd: 38, pierce: 0, shots: 1,
  crit: 0.05, critMul: 2.1, lifesteal: 0, thorns: 0, dr: 0,
  xpMul: 1,
  /* mobility & utility */
  speed: 8.6, magnet: 4.2, regen: 0, cdMul: 1, dashCd: 2.6, dashT: 0, dashTime: 0, iframe: 0,
  /* abilities */
  atkT: 0, sel: 0,
  /* feel */
  shake: 0,
  /* director clocks */
  nextSpawn: 0, nextPickup: 5, nextBad: 4, nextElite: 58, nextBoss: 175,
  /* tallies shown on the results screen */
  dealt: 0, taken: 0, eaten: 0, dodged: 0,
};

export const G = {
  ...BASE,
  owned: [], cds: {}, lvls: {}, buffs: {},
  dashV: null,
};

/* multipliers derived from temporary buffs / debuffs */
G.dmgMul = () => (G.buffs.power ? 1.55 : 1) * (G.buffs.curse ? 0.55 : 1) * (G.buffs.wither ? 0.7 : 1);
G.spdMul = () => (G.buffs.swift ? 1.42 : 1) * (G.buffs.rot ? 0.62 : 1) * (G.buffs.web ? 0.45 : 1);
G.atkMul = () => (G.buffs.rage ? 2.1 : 1) * (G.buffs.chill ? 0.7 : 1);
G.armor = () => (G.buffs.bark ? 0.55 : 1) * (1 - G.dr);

export function resetState() {
  Object.assign(G, BASE);
  G.owned = []; G.cds = {}; G.lvls = {}; G.buffs = {};
  G.dashV = null;
}

/** apply a timed buff/debuff — longest duration wins */
export function addBuff(id, seconds) {
  G.buffs[id] = Math.max(G.buffs[id] || 0, seconds);
}

export function tickBuffs(dt) {
  for (const k in G.buffs) {
    G.buffs[k] -= dt;
    if (G.buffs[k] <= 0) delete G.buffs[k];
  }
}

/* ---------------- persistent profile ---------------- */
const KEY = 'rotvein.profile.v1';
export const PROFILE = load();

function load() {
  try {
    return Object.assign({ lang: null, muted: false, bestTime: 0, bestLevel: 1, bestKills: 0 },
      JSON.parse(localStorage.getItem(KEY) || '{}'));
  } catch (e) {
    return { lang: null, muted: false, bestTime: 0, bestLevel: 1, bestKills: 0 };
  }
}

export function saveProfile() {
  try { localStorage.setItem(KEY, JSON.stringify(PROFILE)); } catch (e) { /* private mode */ }
}

export function recordRun() {
  PROFILE.bestTime = Math.max(PROFILE.bestTime, G.time);
  PROFILE.bestLevel = Math.max(PROFILE.bestLevel, G.level);
  PROFILE.bestKills = Math.max(PROFILE.bestKills, G.kills);
  saveProfile();
}

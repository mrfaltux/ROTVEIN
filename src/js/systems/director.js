/* ROTVEIN — the spawn director.
   Decides what the jungle sends and when. Creature types unlock on a timeline
   and are then rolled by weight, so the fight keeps changing shape rather than
   just getting numerically bigger. */

import { G } from '../core/state.js';
import { ETYPES, BOSS_ORDER, unlockedTypes } from '../data/enemies.js';
import { spawnEnemy } from '../entities/enemies.js';
import { spawnPickup } from '../entities/pickups.js';
import { flash } from './hud.js';
import { t } from '../core/i18n.js';
import { clamp, rnd, chance, weighted } from '../core/util.js';

/** timed set pieces: fixed moments that always read as an event */
const WAVES = [
  { at: 58,  type: 'brute',     n: 3, msg: 'flash.elite' },
  { at: 120, type: 'wasp',      n: 8, msg: 'flash.swarm' },
  { at: 230, type: 'centipede', n: 4, msg: 'flash.swarm' },
  { at: 300, type: 'mantis',    n: 5, msg: 'flash.elite' },
];
let waveIdx = 0;

export function resetDirector() {
  waveIdx = 0;
}

export function director(dt) {
  /* --- rolling swarm --- */
  G.nextSpawn -= dt;
  if (G.nextSpawn <= 0) {
    const rate = clamp(1.25 - G.time / 150, 0.2, 1.25);
    G.nextSpawn = rate * rnd(0.7, 1.3);

    const pool = unlockedTypes(G.time).map(k => [k, ETYPES[k].weight(G.time)]);
    const type = weighted(pool) || 'crawler';

    /* cheap creatures come in packs, expensive ones come alone */
    const def = ETYPES[type];
    const budget = 1 + Math.floor(G.time / 75);
    const n = Math.max(1, Math.round(budget / Math.max(1, def.xp * 0.5)));
    for (let i = 0; i < n; i++) spawnEnemy(type);
  }

  /* --- set-piece waves --- */
  while (waveIdx < WAVES.length && G.time > WAVES[waveIdx].at) {
    const w = WAVES[waveIdx++];
    for (let i = 0; i < w.n; i++) spawnEnemy(w.type, rnd(30, 40));
    flash(t(w.msg));
  }

  /* --- recurring elite pressure once the scripted waves run out --- */
  if (G.time > G.nextElite) {
    G.nextElite = G.time + rnd(44, 66);
    const elites = unlockedTypes(G.time).filter(k => ETYPES[k].xp >= 5);
    if (elites.length) {
      const type = elites[Math.floor(Math.random() * elites.length)];
      for (let i = 0; i < 3; i++) spawnEnemy(type, rnd(28, 38));
      flash(t('flash.elite'));
    }
  }

  /* --- bosses, alternating through BOSS_ORDER --- */
  if (G.time > G.nextBoss && !G.boss) {
    G.nextBoss = G.time + 175;
    const type = BOSS_ORDER[G.bossIdx % BOSS_ORDER.length];
    G.bossIdx++;
    spawnEnemy(type, 32);
  }

  /* --- food and fungus --- */
  G.nextPickup -= dt;
  if (G.nextPickup <= 0) {
    G.nextPickup = rnd(9, 15);
    spawnPickup(chance(0.24) ? 'ability' : 'good');
  }
  G.nextBad -= dt;
  if (G.nextBad <= 0) {
    G.nextBad = rnd(6, 11);
    spawnPickup('bad');
  }
}

/* ROTVEIN — the swarm.
   Creatures rise out of the soil squashed flat and grow into their full size,
   they are all slower than you, and each one delegates its thinking to a
   tactic in tactics.js. */

import { G } from '../core/state.js';
import { player } from './player.js';
import { ETYPES } from '../data/enemies.js';
import { buildEnemy } from './enemyMeshes.js';
import { initTactic, runTactic, deathTactic } from './tactics.js';
import { burst, dirtRing } from '../fx/particles.js';
import { dropOrb } from './orbs.js';
import { spawnPickup } from './pickups.js';
import { SFX } from '../core/audio.js';
import { bossBar } from '../systems/hud.js';
import { flash } from '../systems/hud.js';
import { t } from '../core/i18n.js';
import { rnd, chance, clamp, TAU, MAX_ENEMIES, lerp } from '../core/util.js';

export const enemies = [];
const pools = {};
for (const k in ETYPES) pools[k] = [];
let nextId = 0;

const TMP = new THREE.Vector3(), SEP = new THREE.Vector3();

/**
 * @param {string} type
 * @param {number} [dist]  ring distance from the player
 * @param {{x:number,z:number,fast:boolean}} [at] exact position (used by breeders)
 */
export function spawnEnemy(type, dist, at) {
  const def = ETYPES[type];
  if (!def) return null;
  if (enemies.length >= MAX_ENEMIES && !def.boss) return null;

  const mesh = pools[type].pop() || buildEnemy(type, def);
  mesh.visible = true;
  mesh.rotation.set(0, 0, 0);

  let x, z;
  if (at) { x = at.x; z = at.z; }
  else {
    /* they walk slowly, so they start closer — otherwise the first minute is
       spent watching the horizon */
    const a = rnd(0, TAU), d = dist || rnd(25, 34);
    x = player.position.x + Math.cos(a) * d;
    z = player.position.z + Math.sin(a) * d;
  }
  mesh.position.set(x, 0, z);

  const hpMul = 1 + G.time / 70;
  const spdMul = Math.min(1.6, 1 + G.time / 450);
  const dmgMul = 1 + G.time / 130;
  const emerge = def.boss ? 1.9 : (at && at.fast ? 0.55 : rnd(0.9, 1.25));

  const e = {
    id: ++nextId, mesh, type, def,
    r: def.r * def.scale,
    hp: def.hp * hpMul, max: def.hp * hpMul,
    spd: def.spd * spdMul * rnd(0.92, 1.08),
    dmg: def.dmg * dmgMul,
    xp: def.xp,
    baseScale: def.scale,
    flash: 0, hitcd: 0, stun: 0, poison: 0, ptick: 0, pdmg: 0,
    invuln: 0, bob: rnd(0, TAU), side: chance(0.5) ? 1 : -1,
    boss: !!def.boss, exploded: false,
    emerge, emergeMax: emerge,
  };
  initTactic(e);
  enemies.push(e);

  /* the ground breaks first, then something short pushes up out of it */
  mesh.scale.set(def.scale * 0.6, def.scale * 0.18, def.scale * 0.6);
  mesh.position.y = -0.14 * def.scale;
  dirtRing(mesh.position, 0x3a2c17, def.boss ? 26 : 8, def.boss ? 8 : 4, 0.2 * def.scale);
  SFX.emerge();

  if (def.boss) {
    G.boss = e;
    bossBar(true, t(`enemies.${type}.name`));
    SFX.boss();
    flash(t('flash.boss', { name: t(`enemies.${type}.name`) }));
  }
  return e;
}

export function killEnemy(e, idx) {
  deathTactic(e);
  burst(e.mesh.position, e.def.acc, e.boss ? 60 : 9, e.boss ? 16 : 8, e.boss ? 0.55 : 0.22);

  const chunks = e.boss ? 24 : e.xp >= 8 ? 6 : e.xp >= 4 ? 3 : 1;
  const each = Math.max(1, Math.round(e.xp * (e.boss ? 3 : 1) / chunks));
  for (let i = 0; i < chunks; i++) {
    dropOrb(e.mesh.position, each, e.boss ? 2 : e.xp >= 5 ? 1 : 0);
  }

  const dropChance = e.boss ? 1 : e.xp >= 8 ? 0.3 : e.xp >= 4 ? 0.08 : 0.012;
  if (chance(dropChance)) spawnPickup(chance(0.3) ? 'ability' : 'good');

  e.mesh.visible = false;
  e.mesh.scale.setScalar(e.baseScale);
  pools[e.type].push(e.mesh);
  enemies.splice(idx, 1);

  if (e.boss) { G.boss = null; bossBar(false); }
  G.kills++;
  G.combo++;
  G.comboT = 2.2;
  SFX.kill();
}

export function nearestEnemy(maxD) {
  let best = null, bd = maxD * maxD;
  for (const e of enemies) {
    if (e.invuln > 0 || e.emerge > 0) continue;
    const d = e.mesh.position.distanceToSquared(player.position);
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}

/* ---------------- per-frame ---------------- */
const ctx = { dt: 0, d: 0, to: new THREE.Vector3(), p: null };

export function updateEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i], m = e.mesh, def = e.def;

    if (e.hp <= 0) { killEnemy(e, i); continue; }

    /* --- rising out of the ground: short, wide, harmless --- */
    if (e.emerge > 0) {
      e.emerge -= dt;
      const k = clamp(1 - e.emerge / e.emergeMax, 0, 1);
      const pop = 1 + Math.sin(clamp((k - 0.75) / 0.25, 0, 1) * Math.PI) * 0.12;
      m.scale.set(
        def.scale * lerp(0.6, 1, k) * pop,
        def.scale * lerp(0.18, 1, k * k) * pop,       // height comes in last: squat, then tall
        def.scale * lerp(0.6, 1, k) * pop
      );
      m.position.y = lerp(-0.14 * def.scale, def.fly ? def.fly : 0, k);
      m.rotation.y += dt * 1.5;
      if (chance(dt * 14)) dirtRing(m.position, 0x3a2c17, 2, 3, 0.16 * def.scale);
      if (e.emerge <= 0) {
        m.scale.setScalar(def.scale);
        if (e.boss) { G.shake = Math.max(G.shake, 0.7); }
      }
      continue;
    }

    if (e.invuln > 0 && e.invuln < 90) e.invuln -= dt;
    if (e.poison > 0) {
      e.poison -= dt; e.ptick -= dt;
      if (e.ptick <= 0) { e.ptick = 0.5; e.hp -= e.pdmg; e.flash = 0.1; }
    }

    if (e.stun > 0) {
      e.stun -= dt;
      m.position.y += (0 - m.position.y) * dt * 4;
    } else {
      ctx.dt = dt;
      TMP.copy(player.position).sub(m.position); TMP.y = 0;
      ctx.d = TMP.length();
      ctx.to.copy(TMP).normalize();
      ctx.p = player.position;
      runTactic(e, ctx);
      separate(e, i, dt);
    }

    animate(e, dt);

    if (e.flash > 0) {
      e.flash -= dt;
      const k = clamp(e.flash / 0.14, 0, 1);
      m.mats[0].emissive.setRGB(k, k * 0.45, k * 0.45);
      m.mats[1].emissive.setRGB(k * 0.8, k * 0.35, k * 0.35);
    }

    /* strays that wander off the edge of the action are recycled */
    if (!e.boss && m.position.distanceToSquared(player.position) > 135 * 135) {
      m.visible = false;
      m.scale.setScalar(e.baseScale);
      pools[e.type].push(m);
      enemies.splice(i, 1);
    }
  }
}

/** soft body separation so the swarm spreads instead of stacking */
function separate(e, i, dt) {
  SEP.set(0, 0, 0);
  const m = e.mesh;
  for (let j = 0; j < enemies.length; j++) {
    if (j === i) continue;
    const o = enemies[j];
    if (o.emerge > 0) continue;
    const dx = m.position.x - o.mesh.position.x;
    const dz = m.position.z - o.mesh.position.z;
    const dd = dx * dx + dz * dz;
    const rr = (e.r + o.r) * (e.r + o.r);
    if (dd < rr && dd > 0.0001) {
      const inv = 1 / Math.sqrt(dd);
      SEP.x += dx * inv;
      SEP.z += dz * inv;
    }
  }
  if (SEP.lengthSq() > 0) {
    SEP.normalize();
    const push = e.boss ? 0.2 : 0.75;
    m.position.x += SEP.x * e.spd * push * dt;
    m.position.z += SEP.z * e.spd * push * dt;
  }
}

const AIRBORNE = { air: 1, dig: 1, under: 1, rise: 1, pounce: 1, on: 1 };

/** idle body motion — walk bob, wing beat, tail sway */
function animate(e, dt) {
  const m = e.mesh, def = e.def;
  if (def.fly) {
    e.bob += dt * 8;
    if (e.st !== 'dive' && e.st !== 'fuse') {
      m.position.y = def.fly + Math.sin(e.bob) * 0.45;
    }
    if (m.wings) {
      const f = Math.sin(e.bob * 4);
      m.wings[0].rotation.z = f * 0.9;
      m.wings[1].rotation.z = -f * 0.9;
    }
  } else if (!AIRBORNE[e.st]) {                       // states that own their own height
    e.bob += dt * e.spd * 1.8;
    m.position.y = Math.abs(Math.sin(e.bob)) * 0.12;
    if (m.legs) m.legs.rotation.z = Math.sin(e.bob) * 0.16;
  }
  if (m.tail) m.tail.rotation.x = Math.sin(e.bob * 0.5) * 0.1;
  if (m.halo) m.halo.material.opacity = 0.16 + Math.sin(G.time * 2 + e.id) * 0.06;
}

export function clearEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.mesh.visible = false;
    e.mesh.scale.setScalar(e.baseScale);
    pools[e.type].push(e.mesh);
  }
  enemies.length = 0;
  G.boss = null;
  bossBar(false);
}

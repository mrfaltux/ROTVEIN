/* ROTVEIN — damage in both directions, plus the auto-attack.
   Imports enemies.js and is imported back by it; every entry point here is a
   hoisted function declaration so the cycle resolves cleanly. */

import { G } from '../core/state.js';
import { player } from '../entities/player.js';
import { burst } from '../fx/particles.js';
import { SFX } from '../core/audio.js';
import { fireShot } from '../entities/projectiles.js';
import { enemies, nearestEnemy } from '../entities/enemies.js';
import { hurtFlash } from './hud.js';
import { clamp } from '../core/util.js';

/** damage an enemy; returns the amount actually dealt */
export function hurtEnemy(e, dmg, opts) {
  if (!e || e.hp <= 0 || e.invuln > 0) return 0;
  const o = opts || {};
  let d = dmg, crit = false;
  if (!o.noCrit && Math.random() < G.crit) { d *= G.critMul; crit = true; }
  e.hp -= d;
  e.flash = 0.14;
  G.dealt += d;
  if (crit) burst(e.mesh.position, 0xffffff, 4, 6, 0.18);
  if (G.lifesteal && !o.noLeech) {
    G.hp = Math.min(G.maxHp, G.hp + d * G.lifesteal);
  }
  if (o.stun) e.stun = Math.max(e.stun, o.stun);
  if (o.poison) { e.poison = Math.max(e.poison, o.poison); e.pdmg = Math.max(e.pdmg || 0, o.pdmg || d * 0.15); }
  if (o.knock && o.from) {                                // push straight away from a point
    const k = e.boss ? o.knock * 0.15 : o.knock;
    const dx = e.mesh.position.x - o.from.x, dz = e.mesh.position.z - o.from.z;
    const len = Math.hypot(dx, dz) || 1;
    e.mesh.position.x += dx / len * k;
    e.mesh.position.z += dz / len * k;
  }
  return d;
}

/** damage the player; `src` is an enemy type id used for the death screen */
export function hurtPlayer(amount, src) {
  if (G.iframe > 0 || !G.alive) return;
  const dealt = amount * G.armor();
  G.hp -= dealt;
  G.taken += dealt;
  G.iframe = 0.32;
  G.shake = Math.max(G.shake, 0.5);
  G.combo = 0;
  if (src) G.killedBy = src;
  hurtFlash(clamp(1 - G.hp / G.maxHp, 0.25, 0.9));
  SFX.hurt();
  if (G.hp <= 0) { G.hp = 0; G.pendingDeath = true; }
}

/** damage that ignores i-frames and never kills the run in one tick (pools, drains) */
export function drainPlayer(amount, src) {
  if (!G.alive) return;
  G.hp -= amount * G.armor();
  G.taken += amount;
  if (src) G.killedBy = src;
  if (G.hp <= 0) { G.hp = 0; G.pendingDeath = true; }
}

/** the attacker takes a bite back if the player has spines */
export function reflect(e) {
  if (G.thorns > 0) hurtEnemy(e, G.thorns, { noCrit: true, noLeech: true });
}

export function autoAttack(dt) {
  G.atkT -= dt;
  if (G.atkT > 0) return;
  const t = nearestEnemy(G.range);
  if (!t) return;
  const dir = t.mesh.position.clone().sub(player.position).setY(0).normalize();
  const dmg = G.dmg * G.dmgMul();
  for (let i = 0; i < G.shots; i++) {
    const off = (i - (G.shots - 1) / 2) * 0.18;
    const a = Math.atan2(dir.z, dir.x) + off;
    fireShot(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), dmg, G.projSpd, G.pierce, 0xb6ff2e, 0.9);
  }
  player.blade.rotation.z = -1.1;
  G.atkT = 1 / (G.atkSpd * G.atkMul());
  SFX.shoot();
}

/** everything inside a radius, cheapest possible query */
export function enemiesInRange(pos, r) {
  const out = [];
  const rr = r * r;
  for (const e of enemies) {
    if (e.emerge > 0) continue;
    if (e.mesh.position.distanceToSquared(pos) < rr) out.push(e);
  }
  return out;
}

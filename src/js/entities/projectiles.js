/* ROTVEIN — everything that flies.
   Player thorns, enemy bolts, arcing acid lobs and silk webs all share the
   same two pools; behaviour is switched on `kind`. */

import { Pool } from '../core/pool.js';
import { scene } from '../world/scene.js';
import { player } from './player.js';
import { G, addBuff } from '../core/state.js';
import { burst } from '../fx/particles.js';
import { SFX } from '../core/audio.js';
import { spawnHazard } from './hazards.js';
import { hurtPlayer, hurtEnemy } from '../systems/combat.js';
import { flash } from '../systems/hud.js';
import { t } from '../core/i18n.js';

/* ---------------- player thorns ---------------- */
const shotGeo = new THREE.ConeGeometry(0.16, 0.75, 5);
export const shots = Pool(() => {
  const m = new THREE.Mesh(shotGeo, new THREE.MeshBasicMaterial({ color: 0xb6ff2e }));
  scene.add(m);
  return { mesh: m, v: new THREE.Vector3(), hit: new Set() };
});

export function fireShot(dir, dmg, spd, pierce, color, size) {
  const s = shots.get();
  s.mesh.material.color.setHex(color || 0xb6ff2e);
  s.mesh.scale.setScalar(size || 1);
  s.mesh.position.copy(player.position);
  s.mesh.position.y = 1.35;
  s.v.copy(dir).setY(0).normalize().multiplyScalar(spd);
  s.mesh.rotation.order = 'YZX';
  s.mesh.rotation.set(0, -Math.atan2(s.v.z, s.v.x), -Math.PI / 2);
  s.dmg = dmg; s.pierce = pierce; s.life = 2.1;
  s.hit.clear();
  return s;
}

/* ---------------- enemy ordnance ---------------- */
const boltGeo = new THREE.IcosahedronGeometry(0.28, 0);
export const eshots = Pool(() => {
  const m = new THREE.Mesh(boltGeo, new THREE.MeshBasicMaterial({ color: 0xc04bff }));
  scene.add(m);
  return { mesh: m, v: new THREE.Vector3() };
});

/**
 * @param {string} kind  bolt | lob | web | spine
 */
export function enemyShot(kind, from, dir, opts) {
  const o = opts || {};
  const s = eshots.get();
  s.kind = kind;
  s.mesh.position.copy(from);
  s.mesh.position.y = o.y === undefined ? 1.1 : o.y;
  s.mesh.scale.setScalar(o.size || 1);
  s.dmg = o.dmg || 8;
  s.life = o.life || 3;
  s.src = o.src || null;
  s.hazard = o.hazard || null;
  s.radius = o.radius || 3;

  const col = { bolt: 0xc04bff, lob: 0x9bff4d, web: 0xdfe9ff, spine: 0xffb020 }[kind] || 0xc04bff;
  s.mesh.material = s.mesh.material.clone();
  s.mesh.material.color.setHex(col);

  if (kind === 'lob') {
    /* ballistic: aim at a point, solve for the arc */
    const dist = o.dist || 10;
    const speed = o.speed || 14;
    s.v.copy(dir).setY(0).normalize().multiplyScalar(speed);
    s.v.y = (dist / speed) * 9.8 * 0.5 + 2;
    s.grav = 9.8;
  } else {
    s.v.copy(dir).setY(0).normalize().multiplyScalar(o.speed || 15);
    s.grav = 0;
  }
  return s;
}

export function updateShots(dt, enemies) {
  /* --- player thorns --- */
  shots.each(s => {
    s.life -= dt;
    if (s.life <= 0) return shots.put(s);
    s.mesh.position.addScaledVector(s.v, dt);
    for (const e of enemies) {
      if (s.hit.has(e.id) || e.invuln > 0 || e.emerge > 0) continue;
      if (s.mesh.position.distanceToSquared(e.mesh.position) < (e.r + 0.55) * (e.r + 0.55)) {
        s.hit.add(e.id);
        hurtEnemy(e, s.dmg);
        burst(s.mesh.position, 0xb6ff2e, 3, 5, 0.16);
        if (s.hit.size > s.pierce) return shots.put(s);
      }
    }
  });

  /* --- enemy ordnance --- */
  eshots.each(s => {
    s.life -= dt;
    if (s.life <= 0) return eshots.put(s);
    if (s.grav) s.v.y -= s.grav * dt;
    s.mesh.position.addScaledVector(s.v, dt);
    s.mesh.rotation.x += dt * 6;
    s.mesh.rotation.y += dt * 5;

    if (s.kind === 'lob' && s.mesh.position.y <= 0.3) {           // splashdown
      if (s.hazard) spawnHazard(s.hazard, s.mesh.position, s.radius, s.dmg);
      burst(s.mesh.position, 0x9bff4d, 12, 6, 0.22, 2);
      SFX.pop();
      return eshots.put(s);
    }
    if (s.mesh.position.distanceToSquared(player.position) < 1.6) {
      if (s.kind === 'web') {
        addBuff('web', 2.6);
        flash(t('flash.webbed'));
        SFX.web();
        hurtPlayer(s.dmg * 0.4, s.src);
      } else {
        hurtPlayer(s.dmg, s.src);
      }
      burst(s.mesh.position, 0xff3a6e, 8, 5, 0.2);
      return eshots.put(s);
    }
  });
}

export function clearProjectiles() {
  shots.clear();
  eshots.clear();
}

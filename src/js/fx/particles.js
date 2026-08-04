/* ROTVEIN — pooled particle bursts. */

import { Pool } from '../core/pool.js';
import { scene } from '../world/scene.js';
import { rnd } from '../core/util.js';

const partGeo = new THREE.OctahedronGeometry(0.2, 0);
export const particles = Pool(() => {
  const m = new THREE.Mesh(partGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
  scene.add(m);
  return { mesh: m, v: new THREE.Vector3() };
});

/**
 * @param {THREE.Vector3} pos  world position
 * @param {number} color       hex
 * @param {number} n           count
 * @param {number} spd         initial speed
 * @param {number} size        scale
 * @param {number} [up]        bias upward (1 = neutral, 3 = fountain)
 * @param {number} [grav]      gravity, default 14
 */
export function burst(pos, color, n, spd, size, up, grav) {
  for (let i = 0; i < n; i++) {
    const p = particles.get();
    p.mesh.material.color.setHex(color);
    p.mesh.material.opacity = 1;
    p.mesh.position.copy(pos);
    p.mesh.scale.setScalar(size * rnd(0.6, 1.4));
    p.v.set(rnd(-1, 1), rnd(0.2, 1) * (up || 1), rnd(-1, 1)).normalize().multiplyScalar(spd * rnd(0.5, 1.3));
    p.life = rnd(0.3, 0.7);
    p.max = p.life;
    p.grav = grav === undefined ? 14 : grav;
  }
}

/** flat ring of debris kicked out of the soil — used when things emerge */
export function dirtRing(pos, color, n, spd, size) {
  for (let i = 0; i < n; i++) {
    const p = particles.get();
    p.mesh.material.color.setHex(color);
    p.mesh.material.opacity = 1;
    p.mesh.position.copy(pos);
    p.mesh.position.y = 0.15;
    p.mesh.scale.setScalar(size * rnd(0.6, 1.5));
    const a = (i / n) * Math.PI * 2 + rnd(-0.2, 0.2);
    p.v.set(Math.cos(a), rnd(0.5, 1.2), Math.sin(a)).multiplyScalar(spd * rnd(0.6, 1.2));
    p.life = rnd(0.35, 0.8);
    p.max = p.life;
    p.grav = 16;
  }
}

/** slow drifting motes, for spore clouds and hive breath */
export function drift(pos, color, n, size, spread) {
  for (let i = 0; i < n; i++) {
    const p = particles.get();
    p.mesh.material.color.setHex(color);
    p.mesh.material.opacity = 0.9;
    p.mesh.position.copy(pos);
    p.mesh.position.x += rnd(-spread, spread);
    p.mesh.position.z += rnd(-spread, spread);
    p.mesh.scale.setScalar(size * rnd(0.7, 1.5));
    p.v.set(rnd(-0.4, 0.4), rnd(0.2, 0.7), rnd(-0.4, 0.4));
    p.life = rnd(0.8, 1.6);
    p.max = p.life;
    p.grav = -1.5;                                   // floats
  }
}

export function updateParticles(dt) {
  particles.each(p => {
    p.life -= dt;
    if (p.life <= 0) return particles.put(p);
    p.v.y -= p.grav * dt;
    p.mesh.position.addScaledVector(p.v, dt);
    const k = p.life / p.max;
    p.mesh.material.opacity = k;
    p.mesh.scale.setScalar(p.mesh.scale.x * (1 - dt * 0.9));
  });
}

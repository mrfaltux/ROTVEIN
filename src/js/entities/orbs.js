/* ROTVEIN — experience orbs. They fall where a creature died and are dragged
   in once you are inside your magnet radius. */

import { Pool } from '../core/pool.js';
import { scene } from '../world/scene.js';
import { player } from './player.js';
import { G } from '../core/state.js';
import { SFX } from '../core/audio.js';
import { rnd } from '../core/util.js';

const orbGeo = new THREE.OctahedronGeometry(0.3, 0);
export const orbMat = new THREE.MeshBasicMaterial({ color: 0x2ee6ff });
export const orbMat2 = new THREE.MeshBasicMaterial({ color: 0xb6ff2e });
export const orbMat3 = new THREE.MeshBasicMaterial({ color: 0xffb020 });

export const orbs = Pool(() => {
  const m = new THREE.Mesh(orbGeo, orbMat);
  scene.add(m);
  return { mesh: m, v: new THREE.Vector3() };
});

export function dropOrb(pos, value, tier) {
  const o = orbs.get();
  o.mesh.material = tier >= 2 ? orbMat3 : tier === 1 ? orbMat2 : orbMat;
  o.mesh.scale.setScalar(tier >= 2 ? 1.5 : tier === 1 ? 1.2 : 1);
  o.mesh.position.copy(pos);
  o.mesh.position.y = 0.6;
  o.v.set(rnd(-1, 1), rnd(1, 2), rnd(-1, 1)).multiplyScalar(4);
  o.value = value;
  o.t = 0;
}

/** @param {(n:number)=>void} onGain called with the xp collected */
export function updateOrbs(dt, onGain) {
  orbs.each(o => {
    o.t += dt;
    const d = o.mesh.position.distanceTo(player.position);
    if (d < G.magnet) {
      const dir = player.position.clone().sub(o.mesh.position).normalize();
      o.mesh.position.addScaledVector(dir, (16 + (G.magnet - d) * 4) * dt);
    } else {
      o.v.y -= 22 * dt;
      o.mesh.position.addScaledVector(o.v, dt);
      if (o.mesh.position.y < 0.4) { o.mesh.position.y = 0.4; o.v.set(0, 0, 0); }
    }
    o.mesh.rotation.y += dt * 4;
    o.mesh.rotation.x += dt * 2;
    if (d < 1.1) {
      orbs.put(o);
      SFX.orb();
      onGain(o.value * G.xpMul);
    }
  });
}

/* ROTVEIN — endless jungle dressing.
   Every prop is an InstancedMesh entry living inside one TILE-sized square that
   is re-wrapped around the player each frame, so running in any direction for
   an hour still costs the same handful of draw calls. */

import { rnd, TAU, TILE, IS_TOUCH } from '../core/util.js';
import { scene } from './scene.js';

const fields = [];
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(),
      P = new THREE.Vector3(), S = new THREE.Vector3();

function makeField(geo, mat, count, cfg) {
  const n = Math.round(count * (IS_TOUCH ? 0.7 : 1));
  const im = new THREE.InstancedMesh(geo, mat, n);
  im.frustumCulled = false;
  scene.add(im);
  const items = [];
  for (let i = 0; i < n; i++) {
    items.push({
      x: rnd(-TILE / 2, TILE / 2), z: rnd(-TILE / 2, TILE / 2),
      y: cfg.y(), s: cfg.s(), r: rnd(0, TAU), t: rnd(0, TAU),
    });
  }
  fields.push({ im, items, cfg });
  return im;
}

function wrap(c, p) {
  let d = c - p;
  d = ((d + TILE / 2) % TILE + TILE) % TILE - TILE / 2;
  return p + d;
}

const barkM   = new THREE.MeshLambertMaterial({ color: 0x4a3520 });
const leafM   = new THREE.MeshLambertMaterial({ color: 0x1d6b33, flatShading: true });
const leaf2M  = new THREE.MeshLambertMaterial({ color: 0x2b8f3f, flatShading: true });
const bushM   = new THREE.MeshLambertMaterial({ color: 0x175229, flatShading: true });
const rockM   = new THREE.MeshLambertMaterial({ color: 0x4b5550, flatShading: true });
const grassM  = new THREE.MeshLambertMaterial({ color: 0x2f7d3a, flatShading: true });
const fungM   = new THREE.MeshLambertMaterial({ color: 0x7a4a8f, flatShading: true });
const boneM   = new THREE.MeshLambertMaterial({ color: 0xcfc7a8, flatShading: true });

makeField(new THREE.CylinderGeometry(0.45, 0.85, 15, 6), barkM,  150, { y: () => 7.5,          s: () => rnd(0.7, 1.5), sway: 0 });
makeField(new THREE.IcosahedronGeometry(3.4, 0),         leafM,  150, { y: () => rnd(12, 16),  s: () => rnd(0.8, 1.7), sway: 0.05 });
makeField(new THREE.IcosahedronGeometry(2.6, 0),         leaf2M, 110, { y: () => rnd(9, 13),   s: () => rnd(0.6, 1.3), sway: 0.06 });
makeField(new THREE.IcosahedronGeometry(1.3, 0),         bushM,  190, { y: () => rnd(0.5, 1.1), s: () => rnd(0.6, 1.6), sway: 0.03 });
makeField(new THREE.DodecahedronGeometry(1.1, 0),        rockM,   55, { y: () => rnd(0.1, 0.5), s: () => rnd(0.5, 1.7), sway: 0 });
makeField(new THREE.ConeGeometry(0.5, 1.6, 4),           grassM, 320, { y: () => 0.8,          s: () => rnd(0.5, 1.3), sway: 0.12 });
/* new dressing: glowing fungus shelves and the bones of earlier runs */
makeField(new THREE.CylinderGeometry(0.7, 0.15, 0.5, 7), fungM,   60, { y: () => rnd(0.3, 1.4), s: () => rnd(0.5, 1.2), sway: 0.02 });
makeField(new THREE.CylinderGeometry(0.09, 0.09, 1.5, 5), boneM,  36, { y: () => 0.12,          s: () => rnd(0.6, 1.3), sway: 0, lie: true });

export function updateScenery(px, pz, time) {
  for (const f of fields) {
    for (let i = 0; i < f.items.length; i++) {
      const it = f.items[i];
      it.x = wrap(it.x, px);
      it.z = wrap(it.z, pz);
      const sway = f.cfg.sway ? Math.sin(time * 1.1 + it.t) * f.cfg.sway : 0;
      if (f.cfg.lie) E.set(Math.PI / 2, it.r, sway);
      else E.set(sway, it.r, sway * 0.7);
      Q.setFromEuler(E);
      P.set(it.x, it.y, it.z);
      S.set(it.s, it.s, it.s);
      M.compose(P, Q, S);
      f.im.setMatrixAt(i, M);
    }
    f.im.instanceMatrix.needsUpdate = true;
  }
}

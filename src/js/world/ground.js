/* ROTVEIN — the forest floor. One big plane that rides along under the player
   with a scrolling canvas texture, so the world never runs out. */

import { rnd, rndi, TAU } from '../core/util.js';
import { scene } from './scene.js';

function groundTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#123122';
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    x.fillStyle = ['#0e2619', '#17402a', '#1c4d31', '#0b1f14', '#204d2c'][rndi(0, 4)];
    x.globalAlpha = rnd(0.25, 0.8);
    x.beginPath();
    x.ellipse(rnd(0, 256), rnd(0, 256), rnd(3, 20), rnd(3, 14), rnd(0, TAU), 0, TAU);
    x.fill();
  }
  x.globalAlpha = 0.5;
  for (let i = 0; i < 40; i++) {                    // fallen bark
    x.fillStyle = '#3a2c17';
    x.beginPath();
    x.ellipse(rnd(0, 256), rnd(0, 256), rnd(6, 22), rnd(4, 12), rnd(0, TAU), 0, TAU);
    x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(220, 220);
  return t;
}

export const gTex = groundTexture();
export const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(2200, 2200),
  new THREE.MeshLambertMaterial({ map: gTex })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

export function updateGround(px, pz) {
  ground.position.set(px, 0, pz);
  gTex.offset.set(px / 10, -pz / 10);
}

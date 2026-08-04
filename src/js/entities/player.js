/* ROTVEIN — the survivor: model, walk cycle, dash and the aim vector. */

import { scene } from '../world/scene.js';
import { G } from '../core/state.js';
import { input, mouseAiming } from '../core/input.js';
import { TAU, lerp, angleDelta } from '../core/util.js';
import { burst } from '../fx/particles.js';
import { SFX } from '../core/audio.js';

export const player = new THREE.Group();
scene.add(player);

{
  const skin  = new THREE.MeshLambertMaterial({ color: 0xd8a276 });
  const cloth = new THREE.MeshLambertMaterial({ color: 0x2f6b4a });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 1.15, 8), cloth);
  torso.position.y = 1.28; player.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), skin);
  head.position.y = 2.12; player.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.335, 10, 8, 0, TAU, 0, 1.1),
    new THREE.MeshLambertMaterial({ color: 0x241a12 }));
  hair.position.y = 2.15; player.add(hair);

  const hip = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.28, 0.9, 8),
    new THREE.MeshLambertMaterial({ color: 0x3a3021 }));
  hip.position.y = 0.5; player.add(hip);

  player.legL = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.95, 6), skin);
  player.legL.position.set(-0.17, 0.48, 0); player.add(player.legL);
  player.legR = player.legL.clone(); player.legR.position.x = 0.17; player.add(player.legR);

  player.armL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.85, 6), skin);
  player.armL.position.set(-0.5, 1.42, 0); player.add(player.armL);
  player.armR = player.armL.clone(); player.armR.position.x = 0.5; player.add(player.armR);

  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.9, 0.22),
    new THREE.MeshLambertMaterial({ color: 0xb9c6bd }));
  blade.position.set(0.56, 1.05, 0.12); blade.rotation.z = 0.25;
  player.add(blade); player.blade = blade;

  /* magnet radius, also flashes during i-frames */
  const aura = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.95, 24),
    new THREE.MeshBasicMaterial({ color: 0xb6ff2e, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
  aura.rotation.x = -Math.PI / 2; aura.position.y = 0.06;
  player.add(aura); player.aura = aura;

  /* silk shroud shown while webbed */
  const silk = new THREE.Mesh(new THREE.SphereGeometry(1.05, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xdfe9ff, transparent: true, opacity: 0.18, wireframe: true }));
  silk.position.y = 1.1; silk.visible = false;
  player.add(silk); player.silk = silk;
}

export function dash() {
  if (G.dashT > 0 || !G.alive || G.paused) return;
  G.dashT = G.dashCd * G.cdMul;
  G.iframe = 0.42;
  G.dodged++;
  const d = input.dir.clone();
  if (d.lengthSq() < 0.01) d.set(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y));
  G.dashV = d.normalize().multiplyScalar(34);
  G.dashTime = 0.22;
  delete G.buffs.web;                                   // a dash tears you free of silk
  burst(player.position, 0xb6ff2e, 12, 6, 0.2);
  SFX.dash();
}

/** where an ability should be aimed this frame */
export function aimDir(fallbackTarget) {
  const dir = new THREE.Vector3();
  if (mouseAiming()) {
    dir.copy(input.aim).sub(player.position).setY(0);
    if (dir.lengthSq() > 0.5) return dir.normalize();
  }
  if (fallbackTarget) {
    dir.copy(fallbackTarget.mesh.position).sub(player.position).setY(0);
    if (dir.lengthSq() > 0.01) return dir.normalize();
  }
  return dir.set(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y)).normalize();
}

export function updatePlayer(dt) {
  const dir = input.dir;
  const sp = G.speed * G.spdMul();

  if (G.dashTime > 0) {
    G.dashTime -= dt;
    player.position.addScaledVector(G.dashV, dt * (G.dashTime / 0.22 + 0.35));
  } else if (dir.lengthSq() > 0) {
    player.position.addScaledVector(dir, sp * dt);
  }

  if (dir.lengthSq() > 0) {
    const want = Math.atan2(dir.x, dir.z);
    player.rotation.y += angleDelta(player.rotation.y, want) * Math.min(1, dt * 16);
    const w = G.time * 11;
    player.legL.rotation.x = Math.sin(w) * 0.7;
    player.legR.rotation.x = -Math.sin(w) * 0.7;
    player.armL.rotation.x = -Math.sin(w) * 0.5;
    player.position.y = Math.abs(Math.sin(w)) * 0.06;
  } else {
    player.legL.rotation.x *= 0.85;
    player.legR.rotation.x *= 0.85;
    player.armL.rotation.x *= 0.85;
    player.position.y = Math.sin(G.time * 2.4) * 0.03;
  }

  player.blade.rotation.z = lerp(player.blade.rotation.z, 0.25, dt * 7);
  player.aura.material.opacity = G.iframe > 0 ? 0.8 : 0.18 + Math.sin(G.time * 4) * 0.06;
  player.aura.scale.setScalar(G.magnet / 4.2);
  player.silk.visible = !!G.buffs.web;
  if (G.buffs.web) player.silk.rotation.y += dt * 1.5;
}

export function resetPlayer() {
  player.position.set(0, 0, 0);
  player.rotation.set(0, 0, 0);
}

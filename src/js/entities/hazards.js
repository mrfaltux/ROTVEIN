/* ROTVEIN — ground the jungle takes away from you.
   Acid pools, spore clouds and silk mats persist after the creature that made
   them is dead, so area denial is a real tactic and not just a visual. */

import { scene } from '../world/scene.js';
import { player } from './player.js';
import { G, addBuff } from '../core/state.js';
import { drainPlayer } from '../systems/combat.js';
import { drift } from '../fx/particles.js';
import { rnd, TAU, clamp } from '../core/util.js';

export const hazards = [];

const DEF = {
  acid:  { color: 0x9bff4d, life: 7.5,  dps: 9,  y: 0.05, cloud: false },
  spore: { color: 0xc04bff, life: 8.5,  dps: 4,  y: 0.9,  cloud: true },
  web:   { color: 0xdfe9ff, life: 11,   dps: 0,  y: 0.04, cloud: false },
  blood: { color: 0xff3a6e, life: 6,    dps: 14, y: 0.05, cloud: false },
};

export function spawnHazard(type, pos, radius, dmgScale) {
  const d = DEF[type] || DEF.acid;
  const g = new THREE.Group();

  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 24),
    new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0.34, side: THREE.DoubleSide })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.03;
  g.add(disc);

  const rim = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.92, radius, 24),
    new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
  );
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.05;
  g.add(rim);

  if (type === 'web') {                                   // strands across the mat
    for (let i = 0; i < 7; i++) {
      const s = new THREE.Mesh(
        new THREE.BoxGeometry(radius * 2, 0.02, 0.06),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })
      );
      s.position.y = 0.07;
      s.rotation.y = (i / 7) * TAU;
      g.add(s);
    }
  }
  if (d.cloud) {
    for (let i = 0; i < 5; i++) {
      const puff = new THREE.Mesh(
        new THREE.IcosahedronGeometry(radius * rnd(0.35, 0.6), 0),
        new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0.2 })
      );
      const a = rnd(0, TAU), rr = rnd(0, radius * 0.5);
      puff.position.set(Math.cos(a) * rr, rnd(0.6, 1.5), Math.sin(a) * rr);
      g.add(puff);
    }
  }

  g.position.set(pos.x, 0, pos.z);
  scene.add(g);
  hazards.push({
    mesh: g, type, r: radius, life: d.life, max: d.life,
    dps: d.dps * (dmgScale ? clamp(dmgScale / 12, 0.6, 2.4) : 1),
    t: rnd(0, TAU), disc, rim,
  });
  if (hazards.length > 40) removeHazard(0);               // hard cap, oldest first
}

function removeHazard(i) {
  scene.remove(hazards[i].mesh);
  hazards.splice(i, 1);
}

export function updateHazards(dt) {
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];
    h.life -= dt;
    h.t += dt;
    const k = clamp(h.life / h.max, 0, 1);
    h.disc.material.opacity = 0.12 + k * 0.24 + Math.sin(h.t * 3) * 0.03;
    h.rim.material.opacity = k * 0.6;

    if (h.type === 'spore' && Math.random() < dt * 6) {
      drift(h.mesh.position, 0xc04bff, 1, 0.16, h.r * 0.7);
    }

    const dx = player.position.x - h.mesh.position.x;
    const dz = player.position.z - h.mesh.position.z;
    if (dx * dx + dz * dz < h.r * h.r && G.alive) {
      if (h.type === 'acid')  drainPlayer(h.dps * dt, 'spitter');
      if (h.type === 'blood') drainPlayer(h.dps * dt, 'apex');
      if (h.type === 'spore') { addBuff('venom', 2.2); addBuff('chill', 1.2); }
      if (h.type === 'web')   addBuff('web', 0.35);
    }
    if (h.life <= 0) removeHazard(i);
  }
}

export function clearHazards() {
  for (let i = hazards.length - 1; i >= 0; i--) removeHazard(i);
}

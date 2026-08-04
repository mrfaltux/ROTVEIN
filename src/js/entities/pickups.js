/* ROTVEIN — things growing out of the floor.
   Gold and glowing: eat it. Purple and spiked: leave it, or pay for it. */

import { scene } from '../world/scene.js';
import { player } from './player.js';
import { G, addBuff } from '../core/state.js';
import { burst } from '../fx/particles.js';
import { SFX } from '../core/audio.js';
import { flash } from '../systems/hud.js';
import { grantAbility, lockedAbilities, abilityName } from '../systems/abilities.js';
import { t } from '../core/i18n.js';
import { rnd, pick, TAU } from '../core/util.js';

export const GOOD = [
  { id: 'sun',   color: 0xffcc33 },
  { id: 'power', color: 0xff4d4d },
  { id: 'swift', color: 0x2ee6ff },
  { id: 'rage',  color: 0xffb020 },
  { id: 'bark',  color: 0x9c7b3f },
];
export const BAD = [
  { id: 'rot',   color: 0x8b2ec9 },
  { id: 'venom', color: 0x6a1fb0 },
  { id: 'curse', color: 0xa03ad8 },
  { id: 'chill', color: 0x6ad4ff },
];

export const pickups = [];

export function spawnPickup(kind) {
  const g = new THREE.Group();
  const a = rnd(0, TAU), d = rnd(22, 48);
  g.position.set(player.position.x + Math.cos(a) * d, 0, player.position.z + Math.sin(a) * d);

  let def, good;
  if (kind === 'ability') {
    good = true;
    def = { id: 'ability', color: 0xb6ff2e };
    const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), new THREE.MeshBasicMaterial({ color: 0xd6ff7a }));
    c.position.y = 1.1; g.add(c);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.06, 6, 18),
      new THREE.MeshBasicMaterial({ color: 0xb6ff2e, transparent: true, opacity: 0.8 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 1.1; g.add(ring);
    g.spin = ring;
  } else if (kind === 'good') {
    good = true;
    def = pick(GOOD);
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), new THREE.MeshBasicMaterial({ color: def.color }));
    body.position.y = 0.95; g.add(body);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x2f6b3a }));
    stem.position.y = 0.4; g.add(stem);
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.78, 18),
      new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
    halo.rotation.x = -Math.PI / 2; halo.position.y = 0.08; g.add(halo);
  } else {
    good = false;
    def = pick(BAD);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.7, 6),
      new THREE.MeshLambertMaterial({ color: def.color, flatShading: true }));
    cap.position.y = 1; g.add(cap);
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.75, 6),
      new THREE.MeshLambertMaterial({ color: 0x3a2b48 }));
    stalk.position.y = 0.42; g.add(stalk);
    for (let i = 0; i < 4; i++) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.42, 4), new THREE.MeshBasicMaterial({ color: 0x2b0f3d }));
      const a2 = i / 4 * TAU;
      sp.position.set(Math.cos(a2) * 0.4, 1.15, Math.sin(a2) * 0.4);
      sp.rotation.z = Math.cos(a2) * 0.6;
      sp.rotation.x = -Math.sin(a2) * 0.6;
      g.add(sp);
    }
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.76, 18),
      new THREE.MeshBasicMaterial({ color: 0x2b0f3d, transparent: true, opacity: 0.75, side: THREE.DoubleSide }));
    halo.rotation.x = -Math.PI / 2; halo.position.y = 0.06; g.add(halo);
  }

  scene.add(g);
  pickups.push({ mesh: g, def, good, t: rnd(0, 6), life: 34 });
}

function eat(p) {
  const d = p.def;
  burst(p.mesh.position, d.color, 16, 7, 0.25, 1);
  G.eaten++;
  if (p.good) {
    switch (d.id) {
      case 'ability': {
        const locked = lockedAbilities();
        const id = locked.length ? pick(locked) : pick(G.owned);
        grantAbility(id);
        flash(t('flash.absorbed', { name: abilityName(id) }));
        break;
      }
      case 'sun':   G.hp = Math.min(G.maxHp, G.hp + 34); flash(t('flash.heal', { n: 34 })); break;
      case 'power': addBuff('power', 13); flash(t('flash.power')); break;
      case 'swift': addBuff('swift', 11); flash(t('flash.swift')); break;
      case 'rage':  addBuff('rage', 9);  flash(t('flash.rage')); break;
      case 'bark':  addBuff('bark', 12); flash(t('flash.bark')); break;
    }
    SFX.eat();
  } else {
    switch (d.id) {
      case 'rot':   G.hp -= 18; addBuff('rot', 5); flash(t('flash.rotten')); break;
      case 'venom': addBuff('venom', 7); flash(t('flash.poisoned')); break;
      case 'curse': addBuff('curse', 9); flash(t('flash.weakened')); break;
      case 'chill': addBuff('chill', 8); flash(t('flash.chilled')); break;
    }
    if (G.hp <= 0) { G.hp = 0; G.pendingDeath = true; }
    SFX.rot();
  }
}

export function updatePickups(dt) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    p.t += dt;
    p.life -= dt;
    p.mesh.rotation.y += dt * 1.4;
    p.mesh.position.y = Math.sin(p.t * 2) * 0.16;
    if (p.mesh.spin) p.mesh.spin.rotation.z += dt * 2.5;

    if (p.mesh.position.distanceTo(player.position) < 1.6) {
      eat(p);
      scene.remove(p.mesh);
      pickups.splice(i, 1);
      continue;
    }
    if (p.life <= 0 || p.mesh.position.distanceToSquared(player.position) > 120 * 120) {
      scene.remove(p.mesh);
      pickups.splice(i, 1);
    }
  }
}

export function clearPickups() {
  for (const p of pickups) scene.remove(p.mesh);
  pickups.length = 0;
}

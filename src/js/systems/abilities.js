/* ROTVEIN — the seven powers.
   A power is a definition (cooldown, icon, cast function) plus a live effect
   list updated here. Names and descriptions come from the locale files. */

import { G } from '../core/state.js';
import { player, aimDir } from '../entities/player.js';
import { scene } from '../world/scene.js';
import { enemies, nearestEnemy } from '../entities/enemies.js';
import { hurtEnemy } from './combat.js';
import { fireShot } from '../entities/projectiles.js';
import { burst } from '../fx/particles.js';
import { pulse } from '../fx/telegraph.js';
import { buildDock } from './hud.js';
import { SFX, sfx } from '../core/audio.js';
import { t } from '../core/i18n.js';
import { lerp, clamp, TAU, rnd } from '../core/util.js';

export const novas = [], waves = [], snares = [], bolts = [], rings = [], quakes = [];

/* ---------------- definitions ---------------- */
export const ABIL = {
  volley: {
    cd: 2.8, color: 0xb6ff2e,
    icon: '<path d="M4 20 L20 4 M13 4 h7 v7" stroke="#b6ff2e" stroke-width="2.2" fill="none"/><path d="M4 12 L12 4 M4 20 L12 20" stroke="#b6ff2e" stroke-width="1.6" fill="none" opacity=".6"/>',
    use(lv, dir) {
      const n = 5 + lv * 2, spread = 0.85, dmg = (16 + lv * 9) * G.dmgMul();
      for (let i = 0; i < n; i++) {
        const a = Math.atan2(dir.z, dir.x) + lerp(-spread, spread, n === 1 ? 0.5 : i / (n - 1));
        fireShot(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), dmg, 44, 2 + lv, 0xd6ff7a, 0.3);
      }
      sfx(520, 0.12, 'sawtooth', 0.05, -260);
    },
  },

  nova: {
    cd: 6, color: 0x2ee6ff,
    icon: '<circle cx="12" cy="12" r="3" fill="#2ee6ff"/><circle cx="12" cy="12" r="8" stroke="#2ee6ff" stroke-width="2" fill="none" opacity=".8"/><circle cx="12" cy="12" r="11" stroke="#2ee6ff" stroke-width="1.2" fill="none" opacity=".4"/>',
    use(lv) {
      novas.push({
        pos: player.position.clone(), r: 1, max: 9 + lv * 2.2,
        dmg: (34 + lv * 20) * G.dmgMul(), hit: new Set(), mesh: ringMesh(0x2ee6ff),
      });
      sfx(140, 0.3, 'sine', 0.09, 320);
    },
  },

  storm: {
    cd: 8, color: 0xffe14d,
    icon: '<path d="M13 2 L5 13 h5 l-2 9 8-12h-5z" fill="#ffe14d"/>',
    use(lv) {
      const n = 3 + lv, dmg = (55 + lv * 32) * G.dmgMul();
      const near = enemies
        .filter(e => e.mesh.position.distanceTo(player.position) < 26 && e.invuln <= 0)
        .sort(() => Math.random() - 0.5)
        .slice(0, n);
      near.forEach((e, i) => setTimeout(() => strike(e, dmg), i * 70));
      sfx(900, 0.2, 'square', 0.05, -700);
    },
  },

  wave: {
    cd: 7, color: 0xff7a2b,
    icon: '<path d="M4 18 q4-10 8 0 q4-10 8 0" stroke="#ff7a2b" stroke-width="2.4" fill="none"/><path d="M4 11 q4-9 8 0 q4-9 8 0" stroke="#ff7a2b" stroke-width="1.6" fill="none" opacity=".5"/>',
    use(lv, dir) {
      waves.push({
        pos: player.position.clone(), dir: dir.clone(), t: 0, life: 1.5,
        dmg: (30 + lv * 18) * G.dmgMul(), w: 5 + lv * 1.2, hit: new Set(), mesh: waveMesh(),
      });
      sfx(200, 0.35, 'sawtooth', 0.07, 180);
    },
  },

  snare: {
    cd: 9, color: 0x7bff9e,
    icon: '<path d="M12 22 C6 16 18 12 12 2" stroke="#7bff9e" stroke-width="2.2" fill="none"/><circle cx="8" cy="16" r="2" fill="#7bff9e"/><circle cx="16" cy="9" r="2" fill="#7bff9e"/>',
    use(lv, dir) {
      const p = player.position.clone().addScaledVector(dir, 7);
      snares.push({
        pos: p, t: 0, life: 2.6 + lv * 0.3, r: 5 + lv * 0.8,
        dmg: (14 + lv * 8) * G.dmgMul(), tick: 0, mesh: snareMesh(5 + lv * 0.8),
      });
      sfx(110, 0.4, 'triangle', 0.07, 60);
    },
  },

  /* ---- new: a personal no-go zone that follows you ---- */
  orbit: {
    cd: 11, color: 0xd6ff7a,
    icon: '<circle cx="12" cy="12" r="7" stroke="#d6ff7a" stroke-width="1.4" fill="none" opacity=".6"/><path d="M12 3 l2 3-2 3-2-3z" fill="#d6ff7a"/><path d="M21 12 l-3 2-3-2 3-2z" fill="#d6ff7a"/><path d="M12 21 l-2-3 2-3 2 3z" fill="#d6ff7a"/><path d="M3 12 l3-2 3 2-3 2z" fill="#d6ff7a"/>',
    use(lv) {
      const count = 2 + lv;
      const grp = new THREE.Group();
      for (let i = 0; i < count; i++) {
        const b = new THREE.Mesh(
          new THREE.ConeGeometry(0.22, 1.1, 4),
          new THREE.MeshBasicMaterial({ color: 0xd6ff7a })
        );
        b.rotation.x = Math.PI / 2;
        grp.add(b);
      }
      scene.add(grp);
      rings.push({
        mesh: grp, t: 0, life: 6 + lv * 0.8, r: 3.4, count,
        dmg: (18 + lv * 11) * G.dmgMul(), cool: new Map(),
      });
      sfx(700, 0.25, 'triangle', 0.05, 240);
    },
  },

  /* ---- new: panic button — stagger everything around you ---- */
  quake: {
    cd: 12, color: 0xffb020,
    icon: '<path d="M2 16 h4 l3-6 3 10 3-8 3 4h4" stroke="#ffb020" stroke-width="2" fill="none" stroke-linejoin="round"/>',
    use(lv) {
      const r = 8 + lv * 1.6, dmg = (40 + lv * 26) * G.dmgMul();
      quakes.push({ pos: player.position.clone(), t: 0, life: 0.5, r });
      pulse(player.position, r, 0.5, 0xffb020);
      burst(player.position, 0x6b3a1f, 22, 9, 0.3, 2);
      G.shake = Math.max(G.shake, 0.7);
      for (const e of enemies) {
        const d = e.mesh.position.distanceTo(player.position);
        if (d < r && e.invuln <= 0) {
          hurtEnemy(e, dmg * (1 - d / r * 0.4), { stun: 1.2 + lv * 0.15, knock: 2.4, from: player.position });
        }
      }
      SFX.slam();
    },
  },
};

export const ABIL_KEYS = Object.keys(ABIL);
export const abCd = id => ABIL[id].cd * Math.pow(0.9, (G.lvls[id] || 1) - 1) * G.cdMul;
export const abilityName = id => t(`abilities.${id}.name`);
export const abilityDesc = id => t(`abilities.${id}.desc`);
export const lockedAbilities = () => ABIL_KEYS.filter(k => !G.owned.includes(k));

export function grantAbility(id) {
  if (G.owned.includes(id)) {
    G.lvls[id] = (G.lvls[id] || 1) + 1;
  } else {
    G.owned.push(id);
    G.lvls[id] = 1;
    G.cds[id] = 0;
    G.sel = G.owned.length - 1;
  }
  buildDock();
}

export function useAbility(i) {
  const id = G.owned[i];
  if (!id || !G.alive || G.paused) return;
  if ((G.cds[id] || 0) > 0) return;
  const lv = G.lvls[id] || 1;
  const dir = aimDir(nearestEnemy(40));
  ABIL[id].use(lv, dir);
  G.cds[id] = abCd(id);
  G.shake = Math.max(G.shake, 0.25);
}

/* ---------------- meshes ---------------- */
function ringMesh(c) {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1, 32),
    new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.4;
  scene.add(m);
  return m;
}
function waveMesh() {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 2.4),
    new THREE.MeshBasicMaterial({ color: 0xff7a2b, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
  );
  m.position.y = 1.2;
  scene.add(m);
  return m;
}
function snareMesh(r) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(r - 0.25, r, 28),
    new THREE.MeshBasicMaterial({ color: 0x7bff9e, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  g.add(ring);
  for (let i = 0; i < 10; i++) {
    const v = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 1.6, 4),
      new THREE.MeshLambertMaterial({ color: 0x2f8f4a, flatShading: true })
    );
    const a = i / 10 * TAU, d = rnd(1, r * 0.85);
    v.position.set(Math.cos(a) * d, 0.8, Math.sin(a) * d);
    v.rotation.z = rnd(-0.3, 0.3);
    g.add(v);
  }
  scene.add(g);
  return g;
}

function strike(e, dmg) {
  if (!G.alive || !e || e.hp <= 0) return;
  const b = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.5, 20, 5),
    new THREE.MeshBasicMaterial({ color: 0xffe14d, transparent: true, opacity: 0.9 })
  );
  b.position.copy(e.mesh.position);
  b.position.y = 10;
  scene.add(b);
  bolts.push({ mesh: b, t: 0 });
  hurtEnemy(e, dmg, { noCrit: true, stun: 0.9 });
  burst(e.mesh.position, 0xffe14d, 10, 7, 0.25);
}

/* ---------------- per-frame ---------------- */
export function updateAbilities(dt) {
  for (const id of G.owned) if (G.cds[id] > 0) G.cds[id] -= dt;

  /* spore novas */
  for (let i = novas.length - 1; i >= 0; i--) {
    const n = novas[i];
    n.r += dt * 26;
    n.mesh.position.set(n.pos.x, 0.4, n.pos.z);
    n.mesh.scale.setScalar(n.r);
    n.mesh.material.opacity = clamp(1 - n.r / n.max, 0, 1) * 0.85;
    for (const e of enemies) {
      if (n.hit.has(e.id)) continue;
      if (e.mesh.position.distanceTo(n.pos) < n.r) {
        n.hit.add(e.id);
        hurtEnemy(e, n.dmg, { knock: 2.6, from: n.pos });
      }
    }
    if (n.r >= n.max) { scene.remove(n.mesh); novas.splice(i, 1); }
  }

  /* ember waves */
  for (let i = waves.length - 1; i >= 0; i--) {
    const w = waves[i];
    w.t += dt;
    w.pos.addScaledVector(w.dir, 16 * dt);
    w.mesh.position.set(w.pos.x, 1.2, w.pos.z);
    w.mesh.scale.set(w.w, 1, 1);
    w.mesh.rotation.y = Math.atan2(w.dir.x, w.dir.z) + Math.PI / 2;
    w.mesh.material.opacity = clamp(1 - w.t / w.life, 0, 1) * 0.8;
    if (Math.random() < 0.6) burst(w.mesh.position, 0xff7a2b, 1, 3, 0.2);
    for (const e of enemies) {
      if (w.hit.has(e.id)) continue;
      if (e.mesh.position.distanceTo(w.pos) < w.w * 0.55 + e.r) {
        w.hit.add(e.id);
        hurtEnemy(e, w.dmg, { poison: 2.5, pdmg: w.dmg * 0.16 });
      }
    }
    if (w.t >= w.life) { scene.remove(w.mesh); waves.splice(i, 1); }
  }

  /* strangle vines */
  for (let i = snares.length - 1; i >= 0; i--) {
    const s = snares[i];
    s.t += dt;
    s.tick -= dt;
    s.mesh.position.set(s.pos.x, 0, s.pos.z);
    s.mesh.children.forEach((c, k) => { if (k) c.scale.y = 0.6 + Math.sin(s.t * 6 + k) * 0.35; });
    if (s.tick <= 0) {
      s.tick = 0.45;
      for (const e of enemies) {
        if (e.mesh.position.distanceTo(s.pos) < s.r + e.r) {
          hurtEnemy(e, s.dmg, { noCrit: true, stun: 0.5 });
        }
      }
    }
    if (s.t >= s.life) { scene.remove(s.mesh); snares.splice(i, 1); }
  }

  /* lightning stubs */
  for (let i = bolts.length - 1; i >= 0; i--) {
    const b = bolts[i];
    b.t += dt;
    b.mesh.material.opacity = 1 - b.t / 0.22;
    if (b.t >= 0.22) { scene.remove(b.mesh); bolts.splice(i, 1); }
  }

  /* ring of thorns */
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    r.t += dt;
    const spin = r.t * 3.4;
    r.mesh.position.copy(player.position);
    r.mesh.children.forEach((b, k) => {
      const a = spin + (k / r.count) * TAU;
      b.position.set(Math.cos(a) * r.r, 1.1, Math.sin(a) * r.r);
      b.rotation.y = -a;
    });
    for (const e of enemies) {
      const until = r.cool.get(e.id) || 0;
      if (r.t < until) continue;
      const d = e.mesh.position.distanceTo(player.position);
      if (Math.abs(d - r.r) < e.r + 0.8) {
        r.cool.set(e.id, r.t + 0.45);
        hurtEnemy(e, r.dmg, { knock: 0.6, from: player.position });
        burst(e.mesh.position, 0xd6ff7a, 3, 4, 0.16);
      }
    }
    if (r.t >= r.life) { scene.remove(r.mesh); rings.splice(i, 1); }
  }

  /* quake shockwave is instant; this is only the dust */
  for (let i = quakes.length - 1; i >= 0; i--) {
    const q = quakes[i];
    q.t += dt;
    if (q.t >= q.life) quakes.splice(i, 1);
  }
}

export function clearAbilityFx() {
  for (const list of [novas, waves, snares, bolts, rings]) {
    for (const o of list) scene.remove(o.mesh);
    list.length = 0;
  }
  quakes.length = 0;
}

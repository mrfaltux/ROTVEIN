/* ROTVEIN — body recipes.
   One builder per creature so a Hornet never reads as a re-coloured beetle.
   Each builder returns a Group carrying the parts the animator needs:
   .body .head .legs .wings .tail .glowPart, plus .mats for the hit flash. */

import { TAU, rnd } from '../core/util.js';
import { scene } from '../world/scene.js';

const lam = (c) => new THREE.MeshLambertMaterial({ color: c, flatShading: true });
const basic = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: o !== undefined, opacity: o === undefined ? 1 : o });

/* ---------------- shared parts ---------------- */
function legs(g, mat, count, spread, len, y) {
  const grp = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, len), mat);
    const side = i % 2 ? 1 : -1;
    const row = Math.floor(i / 2) - (count / 4 - 0.5);
    l.position.set(side * spread, y, row * 0.5);
    l.rotation.y = side * 0.9;
    grp.add(l);
  }
  g.add(grp);
  g.legs = grp;
  return grp;
}

function wings(g, w, h, y, z, color, opacity) {
  const geo = new THREE.PlaneGeometry(w, h);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide });
  const a = new THREE.Mesh(geo, mat); a.position.set(-w / 2, y, z || 0);
  const b = new THREE.Mesh(geo, mat); b.position.set(w / 2, y, z || 0);
  g.add(a, b);
  g.wings = [a, b];
  return [a, b];
}

function antennae(g, mat, y, z, len) {
  for (const s of [-1, 1]) {
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, len, 4), mat);
    a.position.set(s * 0.16, y + len * 0.35, z);
    a.rotation.set(-0.7, 0, s * 0.5);
    g.add(a);
  }
}

/* ---------------- builders ---------------- */
const BUILD = {
  beetle(g, m, a) {
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 0), m);
    body.scale.set(1, 0.72, 1.35); body.position.y = 0.75; g.add(body); g.body = body;
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.62, 8, 6, 0, TAU, 0, 1.2), m);
    shell.position.set(0, 0.95, -0.1); shell.scale.set(1, 0.6, 1.4); g.add(shell);
    const split = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 1.5), a);   // wing-case seam
    split.position.set(0, 1.28, -0.1); g.add(split);
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), a);
    head.position.set(0, 0.82, 0.9); g.add(head); g.head = head;
    antennae(g, a, 0.95, 1.1, 0.6);
    legs(g, m, 6, 0.6, 1.15, 0.38);
  },

  tick(g, m, a) {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), m);
    body.scale.set(1, 0.8, 1.1); body.position.y = 0.5; g.add(body); g.body = body;
    const sack = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), a);
    sack.position.set(0, 0.62, -0.35); g.add(sack); g.glowPart = sack;
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 5), a);
    head.position.set(0, 0.5, 0.55); head.rotation.x = Math.PI / 2; g.add(head); g.head = head;
    legs(g, m, 8, 0.42, 0.8, 0.24);
  },

  hornet(g, m, a) {
    const thorax = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), m);
    thorax.position.y = 0.9; g.add(thorax); g.body = thorax;
    const abd = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), m);
    abd.scale.set(1, 0.9, 1.6); abd.position.set(0, 0.86, -0.85); g.add(abd);
    for (let i = 0; i < 3; i++) {                       // warning stripes
      const st = new THREE.Mesh(new THREE.TorusGeometry(0.36 - i * 0.05, 0.07, 5, 10), a);
      st.rotation.x = Math.PI / 2; st.position.set(0, 0.86, -0.55 - i * 0.42); g.add(st);
    }
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), a);
    head.position.set(0, 0.92, 0.55); g.add(head); g.head = head;
    const sting = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.7, 5), a);
    sting.position.set(0, 0.86, -1.75); sting.rotation.x = Math.PI / 2; g.add(sting);
    wings(g, 1.5, 0.6, 1.35, -0.2, 0xd9f2ff, 0.45);
    legs(g, m, 4, 0.34, 0.55, 0.55);
  },

  firefly(g, m, a) {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), m);
    body.scale.set(1, 0.9, 1.4); body.position.y = 0.9; g.add(body); g.body = body;
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), basic(0xffd34d));
    lamp.position.set(0, 0.78, -0.5); g.add(lamp); g.glowPart = lamp;
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), basic(0xffd34d, 0.25));
    halo.position.copy(lamp.position); g.add(halo); g.halo = halo;
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 0), a);
    head.position.set(0, 0.95, 0.45); g.add(head); g.head = head;
    wings(g, 1.1, 0.45, 1.25, -0.1, 0xfff3c4, 0.3);
  },

  grub(g, m, a) {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 6), m);
    body.scale.set(1, 0.8, 1.5); body.position.y = 0.7; g.add(body); g.body = body;
    for (let i = 0; i < 3; i++) {                        // acid blisters
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 5), a);
      b.position.set(rnd(-0.4, 0.4), 1.05, -0.4 + i * 0.45); g.add(b);
    }
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), a);
    head.position.set(0, 0.75, 1.05); g.add(head); g.head = head;
    const spout = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 5), a);
    spout.position.set(0, 1.0, 1.3); spout.rotation.x = -0.9; g.add(spout); g.spout = spout;
    legs(g, m, 6, 0.6, 0.9, 0.3);
  },

  spider(g, m, a) {
    const abd = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 7), m);
    abd.scale.set(1, 0.85, 1.15); abd.position.set(0, 0.9, -0.45); g.add(abd); g.body = abd;
    const ceph = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), m);
    ceph.position.set(0, 0.85, 0.45); g.add(ceph);
    const mark = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), a);
    mark.position.set(0, 1.35, -0.5); g.add(mark);
    for (let i = 0; i < 4; i++) {                        // eye cluster
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 4), a);
      e.position.set(-0.18 + (i % 2) * 0.36, 0.95 + Math.floor(i / 2) * 0.14, 0.78); g.add(e);
    }
    g.head = ceph;
    const grp = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const side = i % 2 ? 1 : -1, row = Math.floor(i / 2);
      const knee = new THREE.Group();
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.95), m);
      upper.position.z = 0.45; upper.rotation.x = 0.5;
      const lower = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.9), m);
      lower.position.set(0, -0.35, 0.85); lower.rotation.x = -0.9;
      knee.add(upper, lower);
      knee.position.set(side * 0.4, 1.0, 0.3 - row * 0.28);
      knee.rotation.y = side * (0.7 + row * 0.32);
      grp.add(knee);
    }
    g.add(grp); g.legs = grp;
  },

  moth(g, m, a) {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), m);
    body.scale.set(1, 1, 2.1); body.position.y = 1.0; g.add(body); g.body = body;
    const fur = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), a);
    fur.position.set(0, 1.05, 0.35); g.add(fur); g.head = fur;
    const geo = new THREE.CircleGeometry(0.95, 7);
    const wm = new THREE.MeshBasicMaterial({ color: 0xc9b8e0, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    const l = new THREE.Mesh(geo, wm), r = new THREE.Mesh(geo, wm);
    l.position.set(-0.85, 1.2, -0.1); l.rotation.set(-0.2, 0, 0.3);
    r.position.set(0.85, 1.2, -0.1); r.rotation.set(-0.2, 0, -0.3);
    g.add(l, r); g.wings = [l, r];
    antennae(g, a, 1.15, 0.6, 0.7);
  },

  mantis(g, m, a) {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), m);
    body.scale.set(1, 1.1, 2.0); body.position.set(0, 1.15, -0.35); g.add(body); g.body = body;
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 0), a);
    head.position.set(0, 1.7, 0.5); g.add(head); g.head = head;
    for (const s of [-1, 1]) {                           // raptorial arms
      const arm = new THREE.Group();
      const up = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.8), a);
      up.position.z = 0.35;
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.0, 4), a);
      blade.position.set(0, 0.1, 0.95); blade.rotation.x = Math.PI / 2 - 0.5;
      arm.add(up, blade);
      arm.position.set(s * 0.34, 1.45, 0.3);
      arm.rotation.y = -s * 0.35;
      g.add(arm);
      if (!g.arms) g.arms = [];
      g.arms.push(arm);
    }
    legs(g, m, 4, 0.4, 1.1, 0.5);
  },

  toad(g, m, a) {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.85, 9, 7), m);
    body.scale.set(1.15, 0.85, 1.05); body.position.y = 0.8; g.add(body); g.body = body;
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 6), a);
      eye.position.set(s * 0.32, 1.42, 0.42); g.add(eye);
      const pup = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), basic(0x0a0a0a));
      pup.position.set(s * 0.32, 1.45, 0.58); g.add(pup);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.95), m);
      leg.position.set(s * 0.7, 0.35, -0.4); leg.rotation.y = s * 0.4; g.add(leg);
    }
    for (let i = 0; i < 5; i++) {                        // toxin warts
      const w = new THREE.Mesh(new THREE.SphereGeometry(0.16, 5, 4), a);
      w.position.set(rnd(-0.6, 0.6), 1.25, rnd(-0.7, 0.3)); g.add(w);
    }
    g.head = body;
  },

  centipede(g, m, a) {
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), a);
    head.position.set(0, 0.65, 0.9); g.add(head); g.head = head;
    for (const s of [-1, 1]) {
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.5, 4), a);
      fang.position.set(s * 0.22, 0.55, 1.35); fang.rotation.x = Math.PI / 2 + 0.3; g.add(fang);
    }
    g.segs = [];
    for (let i = 0; i < 7; i++) {                        // body segments trail behind
      const seg = new THREE.Mesh(new THREE.IcosahedronGeometry(0.44 - i * 0.03, 0), i % 2 ? m : a);
      seg.position.set(0, 0.6, 0.2 - i * 0.62);
      g.add(seg); g.segs.push(seg);
      for (const s of [-1, 1]) {                         // legs ride their own segment
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.7), m);
        l.position.set(s * 0.4, -0.25, 0);
        l.rotation.y = s * 0.9;
        seg.add(l);
      }
    }
    g.body = g.segs[0];
  },

  rhino(g, m, a) {
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 0), m);
    body.scale.set(1.1, 0.85, 1.4); body.position.y = 0.95; g.add(body); g.body = body;
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.85, 9, 7, 0, TAU, 0, 1.3), a);
    shell.scale.set(1.05, 0.65, 1.35); shell.position.set(0, 1.15, -0.15); g.add(shell);
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), a);
    head.position.set(0, 0.9, 1.1); g.add(head); g.head = head;
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.5, 6), a);
    horn.position.set(0, 1.3, 1.2); horn.rotation.x = -0.85; g.add(horn); g.horn = horn;
    const eyes = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), basic(0xff3a6e));
    eyes.position.set(0, 1.05, 1.5); g.add(eyes); g.glowPart = eyes;
    legs(g, m, 6, 0.8, 1.3, 0.45);
  },

  scorpion(g, m, a) {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), m);
    body.scale.set(1.1, 0.7, 1.5); body.position.y = 0.6; g.add(body); g.body = body;
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0), m);
    head.position.set(0, 0.6, 0.85); g.add(head); g.head = head;
    for (const s of [-1, 1]) {                           // pincers
      const claw = new THREE.Group();
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.7), m); arm.position.z = 0.3;
      const jaw = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 5), a);
      jaw.position.z = 0.8; jaw.rotation.x = Math.PI / 2;
      claw.add(arm, jaw);
      claw.position.set(s * 0.5, 0.55, 0.7); claw.rotation.y = -s * 0.5;
      g.add(claw);
      (g.claws = g.claws || []).push(claw);
    }
    const tail = new THREE.Group();                      // segmented sting
    for (let i = 0; i < 5; i++) {
      const seg = new THREE.Mesh(new THREE.SphereGeometry(0.22 - i * 0.02, 6, 5), m);
      seg.position.set(0, 0.35 + i * 0.3, -0.6 - i * 0.12);
      tail.add(seg);
    }
    const sting = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.6, 5), a);
    sting.position.set(0, 1.75, -1.05); sting.rotation.x = 1.9;
    tail.add(sting);
    g.add(tail); g.tail = tail;
    legs(g, m, 8, 0.62, 0.95, 0.3);
  },

  serpent(g, m, a) {
    g.segs = [];
    for (let i = 0; i < 8; i++) {
      const r = 0.42 - i * 0.035;
      const seg = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 6), i % 2 ? m : a);
      seg.position.set(0, 0.55, -i * 0.55);
      g.add(seg); g.segs.push(seg);
    }
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 0), a);
    head.scale.set(1, 0.75, 1.4); head.position.set(0, 0.6, 0.65); g.add(head); g.head = head;
    const hood = new THREE.Mesh(new THREE.CircleGeometry(0.8, 6), lam(0x2f8f4a));
    hood.position.set(0, 0.75, 0.2); hood.rotation.x = -1.1; g.add(hood); g.hood = hood;
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 5, 4), basic(0xffd34d));
      eye.position.set(s * 0.18, 0.72, 0.95); g.add(eye);
    }
    g.body = g.segs[0];
  },

  sac(g, m, a) {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.95, 10, 8), m);
    body.scale.set(1, 1.2, 1); body.position.y = 1.1; g.add(body); g.body = body;
    const skin = new THREE.Mesh(new THREE.SphereGeometry(1.02, 10, 8), basic(0xff9ee0, 0.22));
    skin.position.y = 1.1; g.add(skin); g.halo = skin;
    for (let i = 0; i < 6; i++) {                        // larvae visible inside
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.2, 5, 4), a);
      const ang = (i / 6) * TAU;
      l.position.set(Math.cos(ang) * 0.5, 0.8 + (i % 3) * 0.4, Math.sin(ang) * 0.5);
      g.add(l);
    }
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.45, 0.9, 6), m);
    stalk.position.y = 0.35; g.add(stalk);
    for (let i = 0; i < 5; i++) {                        // root anchors
      const r = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.7, 4), m);
      const ang = (i / 5) * TAU;
      r.position.set(Math.cos(ang) * 0.55, 0.2, Math.sin(ang) * 0.55);
      r.rotation.set(Math.cos(ang) * 0.7, 0, -Math.sin(ang) * 0.7);
      g.add(r);
    }
    g.head = body;
  },

  apex(g, m, a) {
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 0), m);
    body.scale.set(1.2, 0.9, 1.5); body.position.y = 1.1; g.add(body); g.body = body;
    const carapace = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 0), a);
    carapace.scale.set(1.05, 0.55, 1.3); carapace.position.set(0, 1.6, -0.2); g.add(carapace);
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 0), a);
    head.position.set(0, 1.15, 1.4); g.add(head); g.head = head;
    for (const s of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.6, 6), a);
      horn.position.set(s * 0.35, 1.9, 1.0); horn.rotation.set(-0.9, 0, -s * 0.3); g.add(horn);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), basic(0xff3a6e));
      eye.position.set(s * 0.28, 1.35, 1.85); g.add(eye);
    }
    const sacs = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 6), basic(0xff3a6e, 0.4));
    sacs.position.set(0, 1.3, -1.4); g.add(sacs); g.glowPart = sacs;
    legs(g, m, 8, 1.0, 1.8, 0.55);
    const aura = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.5, 24), basic(0xff3a6e, 0.5));
    aura.rotation.x = -Math.PI / 2; aura.position.y = 0.05; g.add(aura); g.aura = aura;
  },

  brood(g, m, a) {
    const abd = new THREE.Mesh(new THREE.SphereGeometry(1.25, 10, 8), m);
    abd.scale.set(1, 1.05, 1.25); abd.position.set(0, 1.5, -1.0); g.add(abd); g.body = abd;
    const eggs = new THREE.Mesh(new THREE.SphereGeometry(1.28, 10, 8), basic(0xdfe9ff, 0.18));
    eggs.position.copy(abd.position); g.add(eggs); g.halo = eggs;
    const ceph = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 7), m);
    ceph.position.set(0, 1.3, 0.7); g.add(ceph); g.head = ceph;
    for (let i = 0; i < 6; i++) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 4), basic(0xff3a6e));
      e.position.set(-0.3 + (i % 3) * 0.3, 1.5 + Math.floor(i / 3) * 0.2, 1.35); g.add(e);
    }
    const grp = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const side = i % 2 ? 1 : -1, row = Math.floor(i / 2);
      const knee = new THREE.Group();
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 1.5), m);
      upper.position.z = 0.75; upper.rotation.x = 0.55;
      const lower = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.4), m);
      lower.position.set(0, -0.6, 1.35); lower.rotation.x = -1.0;
      knee.add(upper, lower);
      knee.position.set(side * 0.7, 1.9, 0.5 - row * 0.45);
      knee.rotation.y = side * (0.6 + row * 0.3);
      grp.add(knee);
    }
    g.add(grp); g.legs = grp;
    const aura = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.7, 24), basic(0xdfe9ff, 0.4));
    aura.rotation.x = -Math.PI / 2; aura.position.y = 0.05; g.add(aura); g.aura = aura;
  },
};

export function buildEnemy(type, def) {
  const g = new THREE.Group();
  const bodyM = lam(def.color);
  const accM = lam(def.acc);
  g.mats = [bodyM, accM];
  (BUILD[def.build] || BUILD.beetle)(g, bodyM, accM);
  g.scale.setScalar(def.scale);
  g.visible = false;
  scene.add(g);
  return g;
}

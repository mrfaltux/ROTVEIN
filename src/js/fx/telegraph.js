/* ROTVEIN — read-the-attack markers.
   Nothing in this game one-shots you without drawing on the floor first:
   charge lines, landing circles, eruption rings and lunge paths all live here. */

import { scene } from '../world/scene.js';
import { clamp } from '../core/util.js';

const marks = [];

function add(mesh, life, mode, extra) {
  mesh.renderOrder = 2;
  scene.add(mesh);
  const m = Object.assign({ mesh, t: 0, life, mode }, extra);
  marks.push(m);
  return m;
}

/** shrinking circle: the ground where something is about to land or erupt */
export function markCircle(pos, radius, life, color = 0xff3a6e) {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.RingGeometry(radius - 0.14, radius, 32),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
  );
  const inner = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 32),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.14, side: THREE.DoubleSide })
  );
  outer.rotation.x = inner.rotation.x = -Math.PI / 2;
  inner.position.y = 0.03; outer.position.y = 0.05;
  g.add(inner, outer);
  g.position.set(pos.x, 0, pos.z);
  return add(g, life, 'circle', { inner, radius });
}

/** stretched bar showing the lane a charger or lunger is about to cross */
export function markLine(pos, dir, length, width, life, color = 0xff3a6e) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(width, length),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(pos.x + dir.x * length / 2, 0.04, pos.z + dir.z * length / 2);
  m.rotation.z = -Math.atan2(dir.x, dir.z);
  return add(m, life, 'line');
}

/** expanding pulse — impacts, blasts, hive births */
export function pulse(pos, maxR, life, color = 0xb6ff2e, y = 0.06) {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(0.82, 1, 28),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(pos.x, y, pos.z);
  return add(m, life, 'pulse', { maxR });
}

export function updateTelegraphs(dt) {
  for (let i = marks.length - 1; i >= 0; i--) {
    const m = marks[i];
    m.t += dt;
    const k = clamp(m.t / m.life, 0, 1);
    if (m.mode === 'circle') {
      m.inner.scale.setScalar(k);                        // fills up as the timer runs out
      m.mesh.children[1].material.opacity = 0.4 + Math.sin(m.t * 22) * 0.35;
    } else if (m.mode === 'pulse') {
      m.mesh.scale.setScalar(1 + k * m.maxR);
      m.mesh.material.opacity = (1 - k) * 0.9;
    } else {
      m.mesh.material.opacity = (0.18 + Math.sin(m.t * 20) * 0.14) * (1 - k * 0.5);
    }
    if (m.t >= m.life) { scene.remove(m.mesh); marks.splice(i, 1); }
  }
}

export function clearTelegraphs() {
  for (const m of marks) scene.remove(m.mesh);
  marks.length = 0;
}

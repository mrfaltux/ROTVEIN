/* ROTVEIN — keyboard, mouse and a one-finger invisible joystick.
   Gameplay never reads raw events; it reads input.dir / input.aim and
   subscribes to the semantic actions below. */

import { renderer, camera } from '../world/scene.js';
import { IS_TOUCH } from './util.js';

const listeners = { cast: [], dash: [], slot: [], card: [], pause: [], restart: [] };
export const on = (what, fn) => listeners[what].push(fn);
const emit = (what, arg) => { for (const fn of listeners[what]) fn(arg); };

export const keys = {};
const stickVec = new THREE.Vector2();
export const input = {
  dir: new THREE.Vector3(),
  aim: new THREE.Vector3(1, 0, 0),
  hasMouse: false,
  usingStick: false,
};

/* ---------------- keyboard ---------------- */
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space') { e.preventDefault(); emit('cast'); }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') emit('dash');
  if (/^Digit[1-7]$/.test(e.code)) {
    const i = +e.code.slice(5) - 1;
    emit('card', i);
    emit('slot', i);
  }
  if (e.code === 'KeyP' || e.code === 'Escape') emit('pause');
  if (e.code === 'KeyR') emit('restart');
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

/* ---------------- mouse ---------------- */
const ndc = new THREE.Vector2(0, 0);
const ray = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1);

addEventListener('mousemove', e => {
  input.hasMouse = true;
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1));
});
renderer.domElement.addEventListener('mousedown', e => {
  if (e.button === 0) emit('cast');
  if (e.button === 2) emit('dash');
});
addEventListener('contextmenu', e => e.preventDefault());

/* ---------------- touch: joystick anywhere, second finger dashes ---------------- */
const stickEl = document.getElementById('stick');
const knob = stickEl.firstElementChild;
let stickId = null, sx = 0, sy = 0;

renderer.domElement.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse') return;
  if (stickId !== null) { emit('dash'); return; }
  stickId = e.pointerId; sx = e.clientX; sy = e.clientY;
  input.usingStick = true;
  stickEl.style.left = sx + 'px';
  stickEl.style.top = sy + 'px';
  stickEl.style.opacity = '1';
});
addEventListener('pointermove', e => {
  if (e.pointerId !== stickId) return;
  let dx = e.clientX - sx, dy = e.clientY - sy;
  const d = Math.hypot(dx, dy), max = 52;
  if (d > max) { dx = dx / d * max; dy = dy / d * max; }
  knob.style.transform = `translate(${dx}px,${dy}px)`;
  stickVec.set(dx / max, dy / max);
});
function endStick(e) {
  if (e.pointerId !== stickId) return;
  stickId = null; stickVec.set(0, 0);
  knob.style.transform = ''; stickEl.style.opacity = '0';
}
addEventListener('pointerup', endStick);
addEventListener('pointercancel', endStick);

/* ---------------- per-frame resolve ---------------- */
export function updateInput() {
  const v = input.dir.set(0, 0, 0);
  if (keys.KeyW || keys.ArrowUp) v.z -= 1;
  if (keys.KeyS || keys.ArrowDown) v.z += 1;
  if (keys.KeyA || keys.ArrowLeft) v.x -= 1;
  if (keys.KeyD || keys.ArrowRight) v.x += 1;
  if (stickVec.lengthSq() > 0.01) { v.x += stickVec.x; v.z += stickVec.y; }
  if (v.lengthSq() > 1) v.normalize();

  ray.setFromCamera(ndc, camera);
  ray.ray.intersectPlane(plane, input.aim);
}

/** true when the player should aim with the mouse rather than auto-aim */
export const mouseAiming = () => !IS_TOUCH && input.hasMouse && !input.usingStick;

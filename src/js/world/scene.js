/* ROTVEIN — renderer, scene graph root, camera and lights.
   three.js r128 is loaded as a classic script, so THREE is a global here. */

import { IS_TOUCH } from '../core/util.js';

export const renderer = new THREE.WebGLRenderer({ antialias: !IS_TOUCH, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, IS_TOUCH ? 1.6 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d2a1e);
scene.fog = new THREE.FogExp2(0x0d2a1e, 0.0145);

export const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.5, 400);

scene.add(new THREE.HemisphereLight(0xa8ffd8, 0x0a1c12, 1.05));
export const sun = new THREE.DirectionalLight(0xfff2cc, 0.85);
sun.position.set(30, 60, 20);
scene.add(sun);

/** travels with the player so the canopy floor never goes pitch black */
export const glow = new THREE.PointLight(0xb6ff2e, 1.1, 22, 2);
scene.add(glow);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/** tint the fog + sky, used when a boss changes the mood of the jungle */
export function setMood(hex, density) {
  scene.background.setHex(hex);
  scene.fog.color.setHex(hex);
  scene.fog.density = density;
}
export const MOOD = { normal: [0x0d2a1e, 0.0145], boss: [0x2a0d1c, 0.0175] };

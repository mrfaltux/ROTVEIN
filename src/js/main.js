/* ROTVEIN — entry point. Wires the systems together and owns the frame loop.

   modules
     core/      state, input, audio, i18n, pooling, maths
     world/     renderer, ground, endless scenery
     entities/  player, enemies, tactics, projectiles, hazards, pickups, orbs
     systems/   combat, abilities, upgrades, director, hud, screens
     fx/        particles, telegraphs
*/

import { G, resetState, tickBuffs, recordRun, PROFILE } from './core/state.js';
import { renderer, scene, camera, glow, setMood, MOOD } from './world/scene.js';
import { updateGround } from './world/ground.js';
import { updateScenery } from './world/scenery.js';
import { updateInput, on as onInput } from './core/input.js';
import { detectLang, setLang, t, onLang } from './core/i18n.js';
import { SFX, toggleMute } from './core/audio.js';
import { rnd } from './core/util.js';

import { player, updatePlayer, resetPlayer, dash } from './entities/player.js';
import { enemies, updateEnemies, clearEnemies } from './entities/enemies.js';
import { trackPlayerVelocity } from './entities/tactics.js';
import { updateShots, clearProjectiles } from './entities/projectiles.js';
import { updateHazards, clearHazards } from './entities/hazards.js';
import { updatePickups, clearPickups } from './entities/pickups.js';
import { updateOrbs, orbs } from './entities/orbs.js';
import { updateParticles, particles } from './fx/particles.js';
import { updateTelegraphs, clearTelegraphs } from './fx/telegraph.js';

import { autoAttack } from './systems/combat.js';
import { updateAbilities, clearAbilityFx, grantAbility, useAbility } from './systems/abilities.js';
import { rollCards } from './systems/upgrades.js';
import { director, resetDirector } from './systems/director.js';
import { updateHUD, buildDock, bossBar } from './systems/hud.js';
import { initScreens, showLevelUp, showGameOver, show, hideAll, isShowing, chooseCard } from './systems/screens.js';

/* ---------------- boot ---------------- */
await setLang(detectLang());

initScreens({
  onPlay: startRun,
  onResume: () => setPaused(false),
  onQuit: () => { endRun(false); clearWorld(); resetPlayer(); show('start'); },
});
buildDock(i => { G.sel = i; buildDock(); useAbility(i); });
onLang(() => buildDock());

const muteBtn = document.getElementById('mute');
muteBtn.onclick = () => {
  const m = toggleMute();
  muteBtn.textContent = t(m ? 'ui.soundOff' : 'ui.soundOn');
  muteBtn.style.opacity = m ? 0.2 : 0.4;
};
muteBtn.textContent = t(PROFILE.muted ? 'ui.soundOff' : 'ui.soundOn');
document.getElementById('pausebtn').onclick = () => setPaused(!G.paused);

/* ---------------- input wiring ---------------- */
onInput('cast', () => { if (G.alive && !G.paused) useAbility(G.sel); });
onInput('dash', () => { if (G.alive && !G.paused) dash(); });
onInput('slot', i => {
  if (isShowing('levelup')) return;
  if (G.alive && !G.paused && i < G.owned.length) { G.sel = i; buildDock(); useAbility(i); }
});
onInput('card', i => { if (isShowing('levelup')) chooseCard(i); });
onInput('pause', () => { if (G.alive && !isShowing('levelup')) setPaused(!G.paused); });
onInput('restart', () => { if (!G.alive) startRun(); });

/* ---------------- run flow ---------------- */
function startRun() {
  clearWorld();
  resetState();
  resetDirector();
  resetPlayer();
  G.alive = true;
  G.paused = false;
  grantAbility('volley');
  buildDock();
  hideAll();
  setMood(MOOD.normal[0], MOOD.normal[1]);
}

function endRun(dead) {
  G.alive = false;
  G.paused = true;
  if (dead) {
    recordRun();
    SFX.die();
    showGameOver();
  }
  bossBar(false);
}

function setPaused(v) {
  if (!G.alive) return;
  G.paused = v;
  if (v) show('pause'); else hideAll();
}

function clearWorld() {
  clearEnemies();
  clearProjectiles();
  clearHazards();
  clearPickups();
  clearAbilityFx();
  clearTelegraphs();
  orbs.clear();
  particles.clear();
}

function levelUp() {
  G.level++;
  G.xp -= G.xpNext;
  G.xpNext = Math.round(6 + G.level * 4.2 + G.level * G.level * 0.28);
  G.hp = Math.min(G.maxHp, G.hp + 6);
  SFX.level();
  G.paused = true;
  showLevelUp(rollCards(), () => {
    G.paused = false;
    buildDock();
    if (G.xp >= G.xpNext) levelUp();
  });
}

/* ---------------- frame ---------------- */
const clock = new THREE.Clock();
const camOff = new THREE.Vector3(0, 11.5, 13.5);
const tmp = new THREE.Vector3();
const camPos = new THREE.Vector3(0, 12, 14);

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const now = clock.elapsedTime;

  updateInput();
  if (!G.paused && G.alive) step(dt);

  /* camera keeps living even on the menus so the jungle never looks frozen */
  tmp.copy(player.position).add(camOff);
  camPos.lerp(tmp, 1 - Math.pow(0.0016, dt));
  camera.position.copy(camPos);
  if (G.shake > 0) {
    camera.position.x += rnd(-1, 1) * G.shake;
    camera.position.y += rnd(-1, 1) * G.shake * 0.6;
    camera.position.z += rnd(-1, 1) * G.shake;
    G.shake = Math.max(0, G.shake - dt * 2.4);
  }
  camera.lookAt(player.position.x, player.position.y + 1.6, player.position.z - 1.5);

  updateGround(player.position.x, player.position.z);
  updateScenery(player.position.x, player.position.z, now);
  glow.position.set(player.position.x, 4, player.position.z);

  updateHUD();
  renderer.render(scene, camera);
}

function step(dt) {
  G.time += dt;
  trackPlayerVelocity(dt);
  director(dt);

  tickBuffs(dt);
  if (G.buffs.venom) G.hp -= 3.5 * dt;
  if (G.regen) G.hp = Math.min(G.maxHp, G.hp + G.regen * dt);
  if (G.iframe > 0) G.iframe -= dt;
  if (G.dashT > 0) G.dashT -= dt;
  if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) G.combo = 0; }

  updatePlayer(dt);
  autoAttack(dt);
  updateEnemies(dt);
  updateShots(dt, enemies);
  updateAbilities(dt);
  updateHazards(dt);
  updateOrbs(dt, gain => { G.xp += gain; if (G.xp >= G.xpNext) levelUp(); });
  updatePickups(dt);
  updateTelegraphs(dt);
  updateParticles(dt);

  /* boss presence tints the whole jungle */
  const mood = G.boss ? MOOD.boss : MOOD.normal;
  scene.fog.color.lerp(new THREE.Color(mood[0]), dt * 1.5);
  scene.background.lerp(new THREE.Color(mood[0]), dt * 1.5);
  scene.fog.density += (mood[1] - scene.fog.density) * dt;

  if (G.hp <= 0 || G.pendingDeath) {
    G.hp = 0;
    G.pendingDeath = false;
    endRun(true);
  }
}

tick();

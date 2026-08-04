/* ROTVEIN — one behaviour per creature.
   A tactic is a tiny state machine: `update(e, c)` runs every frame with
   c = { dt, d (distance to player), to (unit vector toward player), p (player pos) }.
   Anything that can seriously hurt you telegraphs first — see fx/telegraph.js. */

import { player } from './player.js';
import { G, addBuff } from '../core/state.js';
import { hurtPlayer, drainPlayer, reflect } from '../systems/combat.js';
import { enemyShot } from './projectiles.js';
import { spawnHazard } from './hazards.js';
import { spawnEnemy } from './enemies.js';
import { burst, dirtRing, drift } from '../fx/particles.js';
import { markCircle, markLine, pulse } from '../fx/telegraph.js';
import { flash, threat } from '../systems/hud.js';
import { t } from '../core/i18n.js';
import { SFX } from '../core/audio.js';
import { rnd, clamp, TAU, chance, pick } from '../core/util.js';

/* ---------------- shared helpers ---------------- */
const V = new THREE.Vector3(), V2 = new THREE.Vector3();

export function moveTo(e, dir, spd, dt) {
  e.mesh.position.x += dir.x * spd * dt;
  e.mesh.position.z += dir.z * spd * dt;
}
function face(e, dir) {
  e.mesh.rotation.y = Math.atan2(dir.x, dir.z);
}
/** perpendicular of a flat direction */
function perp(dir, out) {
  return out.set(-dir.z, 0, dir.x);
}
function touch(e, c, mult, extraR) {
  if (c.d < e.r + (extraR === undefined ? 0.9 : extraR)) {
    e.hitcd -= c.dt;
    if (e.hitcd <= 0) {
      e.hitcd = 0.7;
      hurtPlayer(e.dmg * (mult || 1), e.type);
      reflect(e);
      return true;
    }
  }
  return false;
}
/** hold a preferred band of distance: closes when far, backs off when near */
function keepRange(e, c, near, far, spd) {
  if (c.d < near) moveTo(e, c.to, -spd, c.dt);
  else if (c.d > far) moveTo(e, c.to, spd, c.dt);
  else {
    perp(c.to, V2);
    moveTo(e, V2, spd * 0.6 * e.side, c.dt);
  }
  face(e, c.to);
}
/** where the player will probably be in `lead` seconds */
function leadPoint(lead, out) {
  return out.copy(player.position).addScaledVector(playerVel, lead);
}
const playerVel = new THREE.Vector3();
let lastP = new THREE.Vector3();
export function trackPlayerVelocity(dt) {
  if (dt > 0) playerVel.copy(player.position).sub(lastP).divideScalar(dt);
  lastP.copy(player.position);
}

/* ---------------- tactics ---------------- */
export const TACTICS = {

  /* ---- ROACH CRAWLER: no plan at all, but there are always more ---- */
  swarm: {
    update(e, c) {
      V.copy(c.to);
      const wob = Math.sin(G.time * 3 + e.id) * 0.25;      // drunken weave
      V.x += -c.to.z * wob; V.z += c.to.x * wob;
      V.normalize();
      moveTo(e, V, e.spd, c.dt);
      face(e, c.to);
      touch(e, c);
    },
  },

  /* ---- BLOOD TICK: rides you and drains until you dash ---- */
  latch: {
    init(e) { e.st = 'seek'; e.t = 0; e.cd = 0; e.vec = new THREE.Vector3(); },
    update(e, c) {
      if (e.st === 'seek') {
        moveTo(e, c.to, e.spd, c.dt);
        face(e, c.to);
        e.cd -= c.dt;
        /* it cannot outrun you, so it jumps the last stretch */
        if (c.d < 11 && e.cd <= 0) { e.st = 'pounce'; e.t = 0.6; e.vec.copy(c.to); }
        if (c.d < e.r + 1.0) {
          e.st = 'on'; e.t = 0;
          e.off = rnd(0, TAU);
          flash(t('flash.latched'));
          SFX.hiss();
        }
      } else if (e.st === 'pounce') {
        e.t -= c.dt;
        moveTo(e, e.vec, 16, c.dt);
        e.mesh.position.y = Math.sin((1 - e.t / 0.6) * Math.PI) * 1.4;
        if (c.d < e.r + 1.2) {
          e.st = 'on'; e.t = 0; e.off = rnd(0, TAU);
          flash(t('flash.latched'));
          SFX.hiss();
        } else if (e.t <= 0) {
          e.st = 'seek'; e.cd = 1.4;
          e.mesh.position.y = 0;
        }
      } else {
        e.t += c.dt;
        e.off += c.dt * 1.6;
        const m = e.mesh.position;
        m.set(
          player.position.x + Math.cos(e.off) * 0.85,
          1.25 + Math.sin(e.t * 6) * 0.1,
          player.position.z + Math.sin(e.off) * 0.85
        );
        e.mesh.rotation.y = -e.off;
        drainPlayer(e.dmg * c.dt, e.type);
        addBuff('drain', 0.3);
        if (chance(c.dt * 6)) burst(m, 0xff3a6e, 1, 2, 0.12);
        /* a dash tears it off, and it cannot re-attach immediately */
        if (G.dashTime > 0 || e.t > 6) {
          e.st = 'seek'; e.stun = 0.8;
          e.mesh.position.y = 0;
          moveTo(e, c.to, -3, 1);
          burst(e.mesh.position, 0xff6b6b, 8, 5, 0.2);
        }
      }
    },
  },

  /* ---- HORNET: orbits, commits to one straight dive, must loop to retry ---- */
  divebomb: {
    init(e) { e.st = 'circle'; e.t = rnd(1.2, 2.6); e.vec = new THREE.Vector3(); },
    update(e, c) {
      if (e.st === 'circle') {
        perp(c.to, V2).multiplyScalar(e.side);               // tangent
        V.copy(c.to).multiplyScalar(clamp((c.d - 9) * 0.25, -1, 1)).add(V2).normalize();
        moveTo(e, V, e.spd, c.dt);
        face(e, c.to);
        e.t -= c.dt;
        if (e.t <= 0 && c.d < 18) {
          e.st = 'aim'; e.t = 0.55;
          e.vec.copy(c.to);
          markLine(e.mesh.position, e.vec, c.d + 6, 1.6, 0.55, 0xffd34d);
          threat(t('flash.dive'));
          SFX.warn();
        }
      } else if (e.st === 'aim') {
        e.t -= c.dt;
        face(e, e.vec);
        if (e.t <= 0) { e.st = 'dive'; e.t = 0.85; SFX.wing(); }
      } else if (e.st === 'dive') {
        e.t -= c.dt;
        moveTo(e, e.vec, 17, c.dt);
        e.mesh.position.y = Math.max(0.7, e.mesh.position.y - c.dt * 3);
        if (touch(e, c, 1.6, 0.7) || e.t <= 0) { e.st = 'climb'; e.t = 1.1; }
      } else {
        e.t -= c.dt;
        moveTo(e, c.to, -e.spd * 1.3, c.dt);
        if (e.t <= 0) { e.st = 'circle'; e.t = rnd(1.4, 2.8); }
      }
    },
  },

  /* ---- EMBER FLY: a walking bomb; killing it early still costs you ---- */
  bomber: {
    init(e) { e.st = 'run'; e.fuse = 0; },
    update(e, c) {
      if (e.st === 'run') {
        moveTo(e, c.to, e.spd, c.dt);
        face(e, c.to);
        const heat = clamp(1 - c.d / 14, 0, 1);
        if (e.mesh.glowPart) e.mesh.glowPart.scale.setScalar(1 + Math.sin(G.time * (6 + heat * 26)) * 0.3 * (0.4 + heat));
        if (c.d < 3.6) {
          e.st = 'fuse'; e.fuse = 0.7;
          markCircle(e.mesh.position, 4.6, 0.7, 0xffd34d);
          SFX.warn();
        }
      } else {
        e.fuse -= c.dt;
        e.mesh.scale.multiplyScalar(1 + c.dt * 0.6);
        if (e.fuse <= 0) detonate(e);
      }
    },
    onDeath(e) { detonate(e, true); },
  },

  /* ---- ACID SPITTER: never closes; paints the floor instead ---- */
  artillery: {
    init(e) { e.cd = rnd(1.2, 2.4); },
    update(e, c) {
      keepRange(e, c, 12, 19, e.spd);
      e.cd -= c.dt;
      if (e.cd <= 0 && c.d < 26) {
        e.cd = rnd(2.6, 3.8);
        leadPoint(0.8, V);
        V.sub(e.mesh.position).setY(0);
        const dist = V.length();
        markCircle(leadPoint(0.8, V2), 3.2, 0.9, 0x9bff4d);
        enemyShot('lob', e.mesh.position, V.normalize(), {
          dmg: e.dmg, dist, speed: 15, y: 1.4, hazard: 'acid', radius: 3.2, src: e.type, size: 1.2,
        });
        SFX.pop();
        if (e.mesh.spout) e.mesh.spout.rotation.x = -1.6;
      }
      if (e.mesh.spout) e.mesh.spout.rotation.x += (-0.9 - e.mesh.spout.rotation.x) * c.dt * 5;
      touch(e, c, 0.6);
    },
  },

  /* ---- SILK SPIDER: takes your mobility away, then lets the swarm arrive ---- */
  webber: {
    init(e) { e.cd = rnd(1.5, 3); e.mat = rnd(2, 5); },
    update(e, c) {
      if (G.buffs.web && c.d > 3) {                       // you are stuck: it closes in
        moveTo(e, c.to, e.spd * 1.3, c.dt);
        face(e, c.to);
      } else {
        keepRange(e, c, 9, 15, e.spd);
      }
      e.cd -= c.dt;
      if (e.cd <= 0 && c.d < 20) {
        e.cd = rnd(3.2, 4.6);
        leadPoint(0.35, V).sub(e.mesh.position).setY(0).normalize();
        enemyShot('web', e.mesh.position, V, { dmg: e.dmg, speed: 17, src: e.type, size: 0.9 });
        SFX.web();
      }
      e.mat -= c.dt;
      if (e.mat <= 0) {                                    // lays a silk mat under itself
        e.mat = rnd(5, 8);
        spawnHazard('web', e.mesh.position, 3.4);
      }
      touch(e, c, 0.7);
    },
  },

  /* ---- SPORE MOTH: never fights, just poisons the ground you wanted ---- */
  polluter: {
    init(e) { e.cd = rnd(1, 2.5); e.wander = rnd(0, TAU); },
    update(e, c) {
      e.wander += c.dt * rnd(0.5, 1.5);
      V.copy(c.to);
      V.x += Math.cos(e.wander) * 0.8; V.z += Math.sin(e.wander) * 0.8;
      V.normalize();
      if (c.d < 6) moveTo(e, c.to, -e.spd, c.dt);          // stays out of reach
      else moveTo(e, V, e.spd, c.dt);
      face(e, c.to);
      e.cd -= c.dt;
      if (e.cd <= 0) {
        e.cd = rnd(3, 4.5);
        spawnHazard('spore', e.mesh.position, 3.6);
        drift(e.mesh.position, 0xc04bff, 8, 0.2, 1.2);
        SFX.hiss();
      }
    },
  },

  /* ---- BLADE MANTIS: circles at knife range, rears, then lunges ---- */
  duelist: {
    init(e) { e.st = 'circle'; e.t = rnd(1.4, 2.6); e.vec = new THREE.Vector3(); },
    update(e, c) {
      if (e.st === 'circle') {
        keepRange(e, c, 4.5, 7.5, e.spd);
        e.t -= c.dt;
        if (e.t <= 0 && c.d < 11) {
          e.st = 'rear'; e.t = 0.55;
          e.vec.copy(c.to);
          markLine(e.mesh.position, e.vec, 11, 1.8, 0.55);
          SFX.warn();
        }
      } else if (e.st === 'rear') {
        e.t -= c.dt;
        face(e, e.vec);
        if (e.mesh.arms) for (const a of e.mesh.arms) a.rotation.x = -1.1 * (1 - e.t / 0.55);
        if (e.t <= 0) { e.st = 'lunge'; e.t = 0.4; e.hitOnce = false; SFX.hiss(); }
      } else if (e.st === 'lunge') {
        e.t -= c.dt;
        moveTo(e, e.vec, 19, c.dt);
        if (e.mesh.arms) for (const a of e.mesh.arms) a.rotation.x = 0.5;
        if (!e.hitOnce && c.d < e.r + 1.4) {
          e.hitOnce = true;
          hurtPlayer(e.dmg * 1.5, e.type);
          reflect(e);
          burst(player.position, 0xd6ff7a, 10, 6, 0.22);
        }
        if (e.t <= 0) { e.st = 'recover'; e.t = 0.85; }
      } else {
        e.t -= c.dt;                                       // wide open while it resets
        if (e.mesh.arms) for (const a of e.mesh.arms) a.rotation.x *= 0.9;
        if (e.t <= 0) { e.st = 'circle'; e.t = rnd(1.6, 2.8); }
      }
    },
  },

  /* ---- TOXIN TOAD: readable arcs that splash where they land ---- */
  hopper: {
    init(e) { e.st = 'crouch'; e.t = rnd(0.6, 1.4); e.from = new THREE.Vector3(); e.to = new THREE.Vector3(); },
    update(e, c) {
      if (e.st === 'crouch') {
        e.t -= c.dt;
        e.mesh.scale.y = e.baseScale * (0.75 + 0.25 * clamp(e.t, 0, 1));
        face(e, c.to);
        if (e.t <= 0) {
          e.st = 'air'; e.t = 0; e.dur = clamp(c.d / 9, 0.5, 1.1);
          e.from.copy(e.mesh.position);
          leadPoint(e.dur * 0.6, e.to);
          if (e.to.distanceTo(e.from) > 13) {              // never leaps further than it can see
            e.to.sub(e.from).setY(0).normalize().multiplyScalar(13).add(e.from);
          }
          markCircle(e.to, 3.4, e.dur, 0xb8e04d);
          SFX.pop();
        }
      } else if (e.st === 'air') {
        e.t += c.dt;
        const k = clamp(e.t / e.dur, 0, 1);
        e.mesh.position.lerpVectors(e.from, e.to, k);
        e.mesh.position.y = Math.sin(k * Math.PI) * 4.5;
        e.mesh.scale.y = e.baseScale * (1 + Math.sin(k * Math.PI) * 0.15);
        if (k >= 1) {
          e.st = 'land'; e.t = 0.9;
          e.mesh.position.y = 0;
          SFX.slam();
          pulse(e.mesh.position, 4, 0.45, 0xb8e04d);
          dirtRing(e.mesh.position, 0xb8e04d, 14, 6, 0.24);
          spawnHazard('acid', e.mesh.position, 3.2, e.dmg);
          if (player.position.distanceTo(e.mesh.position) < 3.6) {
            hurtPlayer(e.dmg, e.type);
          }
          G.shake = Math.max(G.shake, 0.35);
        }
      } else {
        e.t -= c.dt;
        e.mesh.scale.y += (e.baseScale - e.mesh.scale.y) * c.dt * 6;
        touch(e, c, 0.5);
        if (e.t <= 0) { e.st = 'crouch'; e.t = rnd(0.5, 1.0); }
      }
    },
  },

  /* ---- ROT CENTIPEDE: serpentine rush; leading your shots is the puzzle ---- */
  weaver: {
    init(e) { e.phase = rnd(0, TAU); e.t = rnd(0.6, 1.4); e.fast = false; e.trail = []; },
    update(e, c) {
      e.t -= c.dt;
      if (e.t <= 0) { e.fast = !e.fast; e.t = e.fast ? rnd(0.9, 1.5) : rnd(0.5, 0.9); }
      e.phase += c.dt * 4.5;
      perp(c.to, V2);
      V.copy(c.to).addScaledVector(V2, Math.sin(e.phase) * 0.9).normalize();
      moveTo(e, V, e.spd * (e.fast ? 1.9 : 0.7), c.dt);
      face(e, V);
      /* segments follow a breadcrumb trail of past positions */
      e.trail.unshift(e.mesh.position.clone());
      if (e.trail.length > 60) e.trail.pop();
      if (e.mesh.segs) {
        e.mesh.segs.forEach((s, i) => {
          const p = e.trail[Math.min(e.trail.length - 1, 4 + i * 5)];
          if (!p) return;
          s.position.x = (p.x - e.mesh.position.x) / e.mesh.scale.x;
          s.position.z = (p.z - e.mesh.position.z) / e.mesh.scale.z;
          s.position.y = 0.6 + Math.sin(e.phase - i * 0.6) * 0.12;
        });
      }
      touch(e, c, 1, 1.3);                                  // the whole body hurts
    },
  },

  /* ---- RHINO BEETLE: commits to a lane and pays for it ---- */
  charger: {
    init(e) { e.st = 'walk'; e.cd = rnd(1.5, 3); e.vec = new THREE.Vector3(); },
    update(e, c) {
      if (e.st === 'walk') {
        moveTo(e, c.to, e.spd, c.dt);
        face(e, c.to);
        touch(e, c, 0.7);
        e.cd -= c.dt;
        if (e.cd <= 0 && c.d < 17 && c.d > 3) {
          e.st = 'windup'; e.t = 0.85;
          e.vec.copy(c.to);
          markLine(e.mesh.position, e.vec, 26, 3.2, 0.85);
          threat(t('flash.charge'));
          SFX.charge();
        }
      } else if (e.st === 'windup') {
        e.t -= c.dt;
        face(e, e.vec);
        e.mesh.position.addScaledVector(e.vec, -c.dt * 1.4);   // rocks back
        if (e.t <= 0) { e.st = 'charge'; e.t = 1.5; e.hitOnce = false; }
      } else if (e.st === 'charge') {
        e.t -= c.dt;
        moveTo(e, e.vec, 21, c.dt);
        if (chance(c.dt * 30)) dirtRing(e.mesh.position, 0x6b3a1f, 2, 3, 0.2);
        if (!e.hitOnce && c.d < e.r + 1.5) {
          e.hitOnce = true;
          hurtPlayer(e.dmg * 1.4, e.type);
          reflect(e);
          G.shake = Math.max(G.shake, 0.6);
          SFX.slam();
        }
        if (e.t <= 0 || e.hitOnce) { e.st = 'stagger'; e.t = 1.3; }
      } else {
        e.t -= c.dt;                                          // horns in the dirt: free damage
        e.mesh.rotation.x = Math.sin(e.t * 18) * 0.08;
        if (e.t <= 0) { e.mesh.rotation.x = 0; e.st = 'walk'; e.cd = rnd(2, 3.4); }
      }
    },
  },

  /* ---- BARK SCORPION: untouchable underground, deadly on the way up ---- */
  burrower: {
    init(e) { e.st = 'stalk'; e.t = rnd(2, 4); },
    update(e, c) {
      const m = e.mesh;
      if (e.st === 'stalk') {
        moveTo(e, c.to, e.spd, c.dt);
        face(e, c.to);
        if (e.mesh.tail) e.mesh.tail.rotation.x = Math.sin(G.time * 3) * 0.12;
        if (touch(e, c, 1, 1.0)) addBuff('venom', 3);         // sting poisons
        e.t -= c.dt;
        if (e.t <= 0 && c.d > 4) { e.st = 'dig'; e.t = 0.5; SFX.burrow(); }
      } else if (e.st === 'dig') {
        e.t -= c.dt;
        m.position.y = -2.2 * (1 - e.t / 0.5);
        if (chance(c.dt * 40)) dirtRing(m.position, 0x4a3520, 3, 4, 0.22);
        if (e.t <= 0) { e.st = 'under'; e.t = rnd(1.6, 2.6); e.invuln = 99; }
      } else if (e.st === 'under') {
        e.t -= c.dt;
        moveTo(e, c.to, 5.6, c.dt);                           // fast, and nothing can hit it
        m.position.y = -2.2;
        if (chance(c.dt * 25)) dirtRing(V.set(m.position.x, 0.1, m.position.z), 0x4a3520, 2, 3, 0.2);
        if (e.t <= 0 || c.d < 2.2) {
          e.st = 'rise'; e.t = 0.6;
          markCircle(m.position, 4, 0.6, 0xffd34d);
          threat(t('flash.erupt'));
        }
      } else if (e.st === 'rise') {
        e.t -= c.dt;
        if (e.t <= 0) {
          e.st = 'stalk'; e.t = rnd(3, 5); e.invuln = 0;
          m.position.y = 0;
          pulse(m.position, 5, 0.4, 0xffd34d);
          dirtRing(m.position, 0x4a3520, 18, 8, 0.28);
          SFX.slam();
          G.shake = Math.max(G.shake, 0.5);
          if (c.d < 4.2) { hurtPlayer(e.dmg * 1.3, e.type); addBuff('venom', 3); }
        }
      }
    },
  },

  /* ---- VINE SERPENT: crosses the whole gap in one strike ---- */
  striker: {
    init(e) { e.st = 'coil'; e.t = rnd(1.2, 2.4); e.vec = new THREE.Vector3(); },
    update(e, c) {
      if (e.st === 'coil') {
        keepRange(e, c, 9, 15, e.spd);
        if (e.mesh.hood) e.mesh.hood.scale.setScalar(1 + Math.sin(G.time * 3) * 0.06);
        e.t -= c.dt;
        if (e.t <= 0 && c.d < 17) {
          e.st = 'rear'; e.t = 0.6;
          e.vec.copy(c.to);
          markLine(e.mesh.position, e.vec, c.d + 5, 2.2, 0.6, 0xb6ff2e);
          threat(t('flash.strike'));
          SFX.hiss();
        }
      } else if (e.st === 'rear') {
        e.t -= c.dt;
        face(e, e.vec);
        if (e.mesh.hood) e.mesh.hood.scale.setScalar(1 + (1 - e.t / 0.6) * 0.7);
        if (e.t <= 0) { e.st = 'strike'; e.t = 0.45; e.hitOnce = false; }
      } else if (e.st === 'strike') {
        e.t -= c.dt;
        moveTo(e, e.vec, 26, c.dt);
        if (!e.hitOnce && c.d < e.r + 1.5) {
          e.hitOnce = true;
          hurtPlayer(e.dmg, e.type);
          addBuff('venom', 4);
          reflect(e);
        }
        if (e.t <= 0) { e.st = 'retract'; e.t = 0.9; }
      } else {
        e.t -= c.dt;
        moveTo(e, c.to, -e.spd * 1.6, c.dt);
        if (e.mesh.hood) e.mesh.hood.scale.setScalar(1);
        if (e.t <= 0) { e.st = 'coil'; e.t = rnd(1.6, 3); }
      }
    },
  },

  /* ---- LARVA SAC: does nothing but make more of everything else ---- */
  spawner: {
    init(e) { e.cd = 3; e.told = false; },
    update(e, c) {
      moveTo(e, c.to, e.spd, c.dt);
      if (e.mesh.halo) e.mesh.halo.scale.setScalar(1 + Math.sin(G.time * 2.2) * 0.08);
      e.cd -= c.dt;
      if (e.cd <= 0) {
        e.cd = rnd(4, 6);
        pulse(e.mesh.position, 3, 0.5, 0xff9ee0);
        SFX.pop();
        if (!e.told) { flash(t('flash.bloom')); e.told = true; }
        for (let i = 0; i < 2; i++) birth(e, chance(0.35) ? 'tick' : 'crawler');
      }
      touch(e, c, 0.5);
    },
    onDeath(e) {
      for (let i = 0; i < 3; i++) birth(e, 'crawler');
    },
  },

  /* ---- APEX ORGANISM: three phases, three different fights ---- */
  apex: {
    init(e) { e.st = 'walk'; e.cd = 3; e.sum = 6; e.vec = new THREE.Vector3(); e.phase = 1; },
    update(e, c) {
      const frac = e.hp / e.max;
      const want = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
      if (want !== e.phase) {
        e.phase = want;
        e.st = 'walk'; e.cd = 1.2;
        pulse(e.mesh.position, 12, 0.7, 0xff3a6e);
        G.shake = Math.max(G.shake, 0.8);
        SFX.boss();
      }
      if (e.mesh.aura) e.mesh.aura.material.opacity = 0.3 + Math.sin(G.time * 5) * 0.2;
      if (e.mesh.glowPart) e.mesh.glowPart.scale.setScalar(1 + Math.sin(G.time * 4) * 0.12);

      if (e.st === 'walk') {
        moveTo(e, c.to, e.spd * (e.phase === 3 ? 1.5 : 1), c.dt);
        face(e, c.to);
        touch(e, c, 1, 1.4);
        e.cd -= c.dt;
        e.sum -= c.dt;
        if (e.sum <= 0) {                                     // always calling for help
          e.sum = e.phase === 1 ? 8 : 6;
          pulse(e.mesh.position, 8, 0.6, 0xff3a6e);
          const kind = e.phase === 1 ? 'crawler' : e.phase === 2 ? 'wasp' : pick(['wasp', 'tick', 'firefly']);
          for (let i = 0; i < 2 + e.phase; i++) birth(e, kind, 5);
        }
        if (e.cd <= 0) {
          if (e.phase === 1 || (e.phase === 3 && chance(0.5))) {
            e.st = 'windup'; e.t = 0.8; e.vec.copy(c.to);
            markLine(e.mesh.position, e.vec, 34, 5, 0.8);
            threat(t('flash.charge'));
            SFX.charge();
          } else {
            e.st = 'spray'; e.t = 1.4; e.shots = 0;
          }
        }
      } else if (e.st === 'windup') {
        e.t -= c.dt;
        face(e, e.vec);
        if (e.t <= 0) { e.st = 'charge'; e.t = 1.5; e.hitOnce = false; }
      } else if (e.st === 'charge') {
        e.t -= c.dt;
        moveTo(e, e.vec, 19, c.dt);
        if (chance(c.dt * 40)) dirtRing(e.mesh.position, 0x400f2e, 3, 5, 0.3);
        if (!e.hitOnce && c.d < e.r + 2) {
          e.hitOnce = true;
          hurtPlayer(e.dmg * 1.3, e.type);
          G.shake = Math.max(G.shake, 0.8);
          SFX.slam();
        }
        if (e.t <= 0 || e.hitOnce) {
          e.st = 'walk'; e.cd = e.phase === 3 ? 2.4 : 4;
          if (e.phase === 3) spawnHazard('blood', e.mesh.position, 4.5, e.dmg);
        }
      } else {                                                 // spray: radial spore fire
        e.t -= c.dt;
        e.shots -= c.dt;
        if (e.shots <= 0) {
          e.shots = 0.28;
          const n = 10 + e.phase * 2;
          const off = G.time * 1.7;
          for (let i = 0; i < n; i++) {
            const a = (i / n) * TAU + off;
            V.set(Math.cos(a), 0, Math.sin(a));
            enemyShot('bolt', e.mesh.position, V, { dmg: e.dmg * 0.5, speed: 12, y: 1.8, src: e.type, size: 1.1 });
          }
          SFX.pop();
        }
        face(e, c.to);
        if (e.t <= 0) { e.st = 'walk'; e.cd = 3.2; }
      }
    },
  },

  /* ---- BROODMOTHER: fights entirely through the jungle and her children ---- */
  brood: {
    init(e) { e.cd = 2; e.web = 2.5; e.sum = 5; e.sac = 10; },
    update(e, c) {
      keepRange(e, c, 13, 21, e.spd * (c.d < 8 ? 2.2 : 1));
      if (e.mesh.aura) e.mesh.aura.material.opacity = 0.25 + Math.sin(G.time * 3) * 0.15;
      if (e.mesh.halo) e.mesh.halo.scale.setScalar(1 + Math.sin(G.time * 1.6) * 0.06);
      const frac = e.hp / e.max;

      e.web -= c.dt;
      if (e.web <= 0) {                                        // carpets your escape routes
        e.web = frac < 0.5 ? 2.2 : 3.4;
        leadPoint(1.0, V);
        spawnHazard('web', V, 4.2);
      }
      e.cd -= c.dt;
      if (e.cd <= 0 && c.d < 28) {                             // silk volley
        e.cd = frac < 0.5 ? 4 : 6;
        for (let i = -2; i <= 2; i++) {
          const a = Math.atan2(c.to.z, c.to.x) + i * 0.22;
          V.set(Math.cos(a), 0, Math.sin(a));
          enemyShot('web', e.mesh.position, V, { dmg: e.dmg * 0.5, speed: 18, y: 2.2, src: e.type });
        }
        SFX.web();
      }
      e.sum -= c.dt;
      if (e.sum <= 0) {
        e.sum = 5;
        for (let i = 0; i < 3; i++) birth(e, frac < 0.5 ? pick(['spider', 'tick']) : 'tick', 4);
      }
      e.sac -= c.dt;
      if (e.sac <= 0) {
        e.sac = 14;
        flash(t('flash.bloom'));
        birth(e, 'sac', 6);
      }
      touch(e, c, 1, 1.4);
    },
  },
};

/* ---------------- shared behaviour bits ---------------- */
function detonate(e, silent) {
  const R = 4.6;
  pulse(e.mesh.position, R * 1.4, 0.45, 0xffd34d);
  burst(e.mesh.position, 0xffd34d, 26, 11, 0.32, 2);
  if (!silent) SFX.blast(); else SFX.pop();
  G.shake = Math.max(G.shake, 0.55);
  if (player.position.distanceTo(e.mesh.position) < R) {
    hurtPlayer(e.dmg, e.type);
  }
  e.hp = 0;
  e.exploded = true;
}

/** spawn a child right next to its parent */
function birth(e, type, dist) {
  const a = rnd(0, TAU), d = dist || (e.r + 2);
  spawnEnemy(type, null, {
    x: e.mesh.position.x + Math.cos(a) * d,
    z: e.mesh.position.z + Math.sin(a) * d,
    fast: true,
  });
}

export function initTactic(e) {
  const tac = TACTICS[e.def.tactic];
  if (tac && tac.init) tac.init(e);
}
export function runTactic(e, c) {
  const tac = TACTICS[e.def.tactic];
  if (tac) tac.update(e, c);
}
export function deathTactic(e) {
  const tac = TACTICS[e.def.tactic];
  if (tac && tac.onDeath && !e.exploded) tac.onDeath(e);
}

# ROTVEIN — how a frame works

The game is plain ES modules with no framework and no build step. `src/js/main.js` is the only
entry point; everything else is imported from there, directly or transitively.

## Layering

```
        core/            world/            fx/
     state · util      scene · ground   particles
     input · audio     scenery          telegraph
     i18n  · pool
          \               |               /
           +------ entities/ -------------+
           |  player · enemies · tactics  |
           |  projectiles · hazards       |
           |  pickups · orbs              |
           +------------------------------+
                          |
                      systems/
        combat · abilities · upgrades · director
                    hud · screens
                          |
                       main.js
```

`core/` knows nothing about the game. `entities/` owns things that exist in the world.
`systems/` owns rules that act on them. `main.js` owns the order they run in.

A few imports are circular by design — `combat` ↔ `enemies`, `tactics` ↔ `enemies` — because
damage and spawning are mutually recursive concepts. Every function involved is a hoisted
`export function`, so the cycle resolves at call time, never at module-evaluation time. If you add
to those files, keep exports that participate in a cycle as function declarations, not `const`
arrows.

## The frame

`tick()` in `main.js`:

1. `updateInput()` — resolve WASD / joystick into `input.dir`, raycast the mouse onto the ground
   plane into `input.aim`.
2. `step(dt)` if the run is live and unpaused (below).
3. Camera follow, screen shake, fog mood.
4. `updateGround` / `updateScenery` — wrap the endless world around the player.
5. `updateHUD()` and render.

`step(dt)`:

| order | call | why here |
|---|---|---|
| 1 | `trackPlayerVelocity` | tactics lead their shots with it |
| 2 | `director` | spawns before anything moves this frame |
| 3 | buffs, regen, timers | status effects gate everything below |
| 4 | `updatePlayer` | movement and dash |
| 5 | `autoAttack` | fires at the nearest enemy |
| 6 | `updateEnemies` | emerge animation → tactic → separation → animation |
| 7 | `updateShots` | player thorns and enemy ordnance, both collide here |
| 8 | `updateAbilities` | novas, waves, vines, bolts, orbiting blades |
| 9 | `updateHazards` | acid, spores, silk on the floor |
| 10 | `updateOrbs` | XP magnet, may trigger a level-up (which pauses) |
| 11 | `updatePickups`, `updateTelegraphs`, `updateParticles` | cosmetic and pickup passes |
| 12 | death check | `G.pendingDeath` is set by damage, resolved once, here |

Damage never ends the run inline: `hurtPlayer` sets `G.pendingDeath`, and `step` resolves it at the
end of the frame so nothing iterates a world that has already been torn down.

## Enemies

An enemy is a plain object; its mesh is pooled per type and reused forever.

```js
{ id, mesh, type, def, r, hp, max, spd, dmg, xp,
  emerge, emergeMax,      // rising out of the ground
  st, t, cd, vec,         // whatever its tactic needs
  flash, stun, poison, invuln, side }
```

**Emerging.** For the first ~1s a creature is scaled to 18% height and 60% width and sunk slightly
into the soil, then grows to full size with a small overshoot. It does not act and does not touch
you until it finishes. `entities/enemies.js` owns that animation; tactics never see it.

**Tactics.** `entities/tactics.js` maps `def.tactic` → `{ init?, update, onDeath? }`. `update(e, c)`
receives `c = { dt, d, to, p }` — delta time, distance to the player, unit vector toward the player,
and the player position. A tactic is expected to:

- move itself (`moveTo`) and face itself (`face`),
- run its own state machine in `e.st` / `e.t`,
- telegraph before anything that hurts (`markCircle`, `markLine`, `pulse`, `threat`),
- deal damage through `combat.js`, never by touching `G.hp`.

States named in `AIRBORNE` (`enemies.js`) own their own Y position, so the walk-bob animator leaves
them alone — that is how leaps, burrows, dives and latching work.

**Separation** runs after the tactic, so the swarm spreads without any tactic having to think about
its neighbours.

## Adding a creature

1. Add an entry to `src/js/data/enemies.js` (stats, `tactic`, `build`, `unlock`, `weight`, `glyph`).
2. Add a body recipe to `BUILD` in `src/js/entities/enemyMeshes.js`.
3. Add the tactic to `TACTICS` in `src/js/entities/tactics.js` if it is a new one.
4. Add `enemies.<key>.name` / `.desc` to `src/js/data/strings.en.js` (and, if you like, the
   locales — missing keys fall back to English).
5. `npm run check`.

The bestiary screen, the director's spawn table and the death screen all read from that one data
entry, so there is nothing else to register.

## Localisation

English lives in code (`data/strings.en.js`) and is always complete. Other locales are JSON files
fetched on demand and merged on top. `t('a.b.c', { n: 3 })` looks up the current locale, falls back
to English, and interpolates `{placeholders}`. Elements carrying `data-i18n="a.b.c"` are rewritten
whenever the language changes; anything built by JavaScript re-renders through the `onLang`
subscription.

/* ROTVEIN — English is the base dictionary. It is imported (never fetched) so
   the game always has a complete set of strings; every other locale is a JSON
   file in src/locales/ and may translate as much or as little as it likes.
   Missing keys fall back to the values below. */

export const EN = {
  meta: { name: 'ENGLISH', code: 'EN' },

  ui: {
    level: 'LEVEL', survived: 'SURVIVED', kills: 'KILLS', locked: 'LOCKED',
    back: 'BACK', pause: 'PAUSE', soundOn: 'SOUND ON', soundOff: 'SOUND OFF',
    combo: '{n}× SWARM', rank: 'RANK {n}',
  },

  start: {
    sub: 'JUNGLE SWARM SURVIVOR',
    play: 'ENTER THE CANOPY',
    bestiary: 'BESTIARY',
    language: 'LANGUAGE',
    best: 'BEST {time} · LEVEL {level} · {kills} KILLS',
  },

  controls: {
    move: 'move & dodge', cast: 'cast selected power', switch: 'switch power',
    dash: 'dash', aim: 'aim', good: 'eat these', bad: 'never eat these',
    pause: 'pause',
    kMove: 'WASD / ARROWS', kCast: 'SPACE / CLICK', kSwitch: '1 – 7',
    kDash: 'SHIFT / RIGHT-CLICK', kAim: 'MOUSE', kGood: 'GOLD PICKUPS', kBad: 'PURPLE FUNGUS',
    kPause: 'P / ESC',
    tHold: 'HOLD', tHoldD: 'anywhere to move',
    tTap: 'TAP POWER', tTapD: 'cast ability',
    tSecond: '2nd FINGER', tSecondD: 'dodge dash',
    tAuto: 'AUTO', tAutoD: 'you attack on your own',
    hintTouch: 'HOLD ANYWHERE TO MOVE · TAP A POWER TO CAST · SECOND FINGER DODGES',
    hintDesk: 'WASD MOVE · SPACE OR CLICK CASTS · 1–7 SWITCH · SHIFT DODGES',
  },

  levelup: { title: 'MUTATION', sub: 'ABSORB ONE STRAIN' },
  pause: { title: 'HELD BREATH', resume: 'RESUME', quit: 'ABANDON' },
  bestiary: {
    title: 'BESTIARY', sub: 'EVERY CREATURE HUNTS DIFFERENTLY',
    hp: 'HP', spd: 'SPEED', dmg: 'DAMAGE', from: 'FROM {time}',
  },
  gameover: { title: 'CONSUMED', again: 'GROW AGAIN', by: 'KILLED BY {name}', byNothing: 'KILLED BY THE JUNGLE' },

  flash: {
    boss: '{name} AWAKENS',
    elite: 'HEAVY SHELLS INCOMING',
    swarm: 'THE SWARM THICKENS',
    heal: '+{n} HEALTH',
    power: 'DAMAGE SURGE',
    swift: 'SWIFT BLOOD',
    rage: 'FRENZY',
    bark: 'BARK SKIN',
    absorbed: 'POWER ABSORBED — {name}',
    rotten: 'ROTTEN — SLOWED',
    poisoned: 'POISONED',
    weakened: 'WEAKENED',
    chilled: 'STIFFENED',
    latched: 'SOMETHING IS DRAINING YOU',
    webbed: 'CAUGHT IN SILK',
    charge: 'IT IS CHARGING',
    erupt: 'SOMETHING MOVES UNDERFOOT',
    strike: 'IT COILS TO STRIKE',
    bloom: 'THE HIVE IS BIRTHING',
    dive: 'INCOMING DIVE',
  },

  status: {
    power: 'DAMAGE', swift: 'SWIFT', rage: 'FRENZY', bark: 'BARK',
    rot: 'ROTTEN', venom: 'POISON', curse: 'WEAK', web: 'WEBBED',
    chill: 'STIFF', wither: 'WITHERED', drain: 'DRAINED',
  },

  /* ---------------- creatures ---------------- */
  tactics: {
    swarm: 'SWARM', latch: 'PARASITE', divebomb: 'DIVE BOMB', bomber: 'SUICIDE BLAST',
    artillery: 'ARTILLERY', webber: 'TRAPPER', polluter: 'AREA DENIAL', duelist: 'DUELLIST',
    hopper: 'LEAPER', weaver: 'SERPENTINE RUSH', charger: 'CHARGER', burrower: 'AMBUSHER',
    striker: 'LUNGER', spawner: 'BREEDER', apex: 'APEX PREDATOR', brood: 'HIVE QUEEN',
  },

  enemies: {
    crawler:  { name: 'ROACH CRAWLER', desc: 'Cheap, endless, and only dangerous in numbers. It walks straight at you and never thinks again.' },
    tick:     { name: 'BLOOD TICK',    desc: 'Latches onto your back and drains you until you dash it off. Small, quick, infuriating.' },
    wasp:     { name: 'HORNET',        desc: 'Circles just out of reach, then commits to a straight dive. Sidestep the dive and it must loop around again.' },
    firefly:  { name: 'EMBER FLY',     desc: 'Flies at you glowing brighter and brighter, then detonates. Kill it early or leave the blast radius.' },
    spitter:  { name: 'ACID SPITTER',  desc: 'Refuses to close in. Lobs arcing acid that leaves a burning pool where it lands.' },
    spider:   { name: 'SILK SPIDER',   desc: 'Fires silk that slows you to a crawl, then keeps its distance while the swarm arrives.' },
    moth:     { name: 'SPORE MOTH',    desc: 'Drifts overhead trailing spore clouds that poison the ground you were about to use.' },
    mantis:   { name: 'BLADE MANTIS',  desc: 'Circle-strafes at knife range, rears up to telegraph, then lunges with both blades.' },
    toad:     { name: 'TOXIN TOAD',    desc: 'Hops in long arcs you can read, and splashes toxin over everything where it lands.' },
    centipede:{ name: 'ROT CENTIPEDE', desc: 'Weaves left and right as it rushes so your shots lead into empty jungle. Its whole body hurts.' },
    brute:    { name: 'RHINO BEETLE',  desc: 'Plods forward, plants its feet, then charges in a straight line. Step aside and it slams into nothing.' },
    scorpion: { name: 'BARK SCORPION', desc: 'Vanishes underground where nothing can touch it, tracks you, and erupts beneath your feet.' },
    serpent:  { name: 'VINE SERPENT',  desc: 'Coils at range, then crosses the whole gap in one strike and recoils before you can answer.' },
    sac:      { name: 'LARVA SAC',     desc: 'Barely moves. Keeps breathing out crawlers until you burn it down — and bursts into more when it dies.' },
    apex:     { name: 'APEX ORGANISM', desc: 'Charges, calls the swarm, then floods the clearing with spore fire. It changes tactic as it dies.' },
    brood:    { name: 'BROODMOTHER',   desc: 'Never fights you directly. Webs the ground, births sacs, and lets the jungle do the work.' },
  },

  /* ---------------- powers ---------------- */
  abilities: {
    volley: { name: 'THORN VOLLEY',  desc: 'Fires a wide fan of piercing thorns.' },
    nova:   { name: 'SPORE NOVA',    desc: 'Detonates a shockwave that knocks the swarm back.' },
    storm:  { name: 'STORM CALL',    desc: 'Lightning hunts nearby targets and stuns them.' },
    wave:   { name: 'EMBER WAVE',    desc: 'Rolls a wall of fire that burns everything it touches.' },
    snare:  { name: 'STRANGLE VINE', desc: 'Roots erupt underfoot, holding and crushing the swarm.' },
    orbit:  { name: 'RING OF THORNS',desc: 'Blades circle you for a while, shredding anything that closes.' },
    quake:  { name: 'ROOT QUAKE',    desc: 'Slams the ground: everything nearby is staggered and cracked open.' },
    rankUp: 'Stronger effect, shorter cooldown.',
  },

  /* ---------------- level-up cards ---------------- */
  cardKind: { power: 'NEW POWER', rank: 'POWER RANK {n}', stat: 'ADAPTATION' },
  upgrades: {
    dmg:     { name: 'SHARPENED THORNS', desc: '+22% attack damage.' },
    spd:     { name: 'RAPID GROWTH',     desc: '+18% attack speed.' },
    legs:    { name: 'FLEET ROOTS',      desc: '+10% movement speed.' },
    hp:      { name: 'THICK HIDE',       desc: '+28 max health, and heal for the same.' },
    split:   { name: 'SPLIT SEED',       desc: '+1 auto-attack projectile.' },
    pier:    { name: 'BARBED TIPS',      desc: 'Attacks pierce 1 more enemy.' },
    rng:     { name: 'LONG SIGHT',       desc: '+28% attack range.' },
    mag:     { name: 'HUNGRY ROOTS',     desc: '+70% pickup radius.' },
    reg:     { name: 'REGROWTH',         desc: 'Regenerate 1.4 health per second.' },
    crit:    { name: 'PREDATOR EYE',     desc: '+9% critical chance.' },
    critdmg: { name: 'SPLIT SHELL',      desc: '+45% critical damage.' },
    cd:      { name: 'COLD BLOOD',       desc: '-16% ability cooldowns.' },
    dash:    { name: 'SNAP REFLEX',      desc: '-28% dodge cooldown.' },
    velo:    { name: 'TENSED SINEW',     desc: '+30% projectile speed.' },
    leech:   { name: 'VAMPIRE VINE',     desc: 'Heal for 4% of the damage you deal.' },
    armor:   { name: 'BARK SKIN',        desc: 'Take 14% less damage.' },
    thorns:  { name: 'SPINED SHELL',     desc: 'Attackers take 9 damage back.' },
    greed:   { name: 'DEEP APPETITE',    desc: '+25% experience from everything.' },
  },

  /* ---------------- pickups ---------------- */
  pickups: {
    ability: 'SPORE CRYSTAL',
    sun: 'SUNFRUIT', power: 'BLOOD BERRY', swift: 'SWIFT NECTAR', rage: 'RAGE BLOOM', bark: 'IRON BARK',
    rot: 'ROT FUNGUS', venom: 'VENOM POD', curse: 'CURSED BLOOM', chill: 'FROST CAP',
  },
};

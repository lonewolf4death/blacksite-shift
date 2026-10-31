export const BUILD_VERSION = '0.23.0';
export const bayNames = ['INTAKE FLOOR','CROSSFLOW','SPLIT PRESS','OFFSET CHUTE','SERVICE GANTRY','FILTER STACK','REJECTED GOODS'];

// Tile 3 is a low, walkable equipment deck. Its outer half-tile slopes up so
// movement, camera height, and the rendered surface agree at every edge.
export function floorHeightAt(grid,x,y){
  if(!grid||!Number.isFinite(x)||!Number.isFinite(y))return 0;
  const tx=Math.floor(x),ty=Math.floor(y);
  if(grid[ty]?.[tx]!==3)return 0;
  const edges=[grid[ty]?.[tx-1]===3?1:(x-tx)*2,grid[ty]?.[tx+1]===3?1:(tx+1-x)*2,
    grid[ty-1]?.[tx]===3?1:(y-ty)*2,grid[ty+1]?.[tx]===3?1:(ty+1-y)*2];
  return .62*Math.max(0,Math.min(1,...edges));
}

export const workOrders = {
  machine: { name:'CONTROLLED PROCESSING', short:'PROCESS HOSTILES', detail:'Press F near a station and complete its live calibration with A/D and Space. In a normal encounter, strike two distinct hostiles with the warned machine cycle. In a boss encounter, strike the boss once.' },
  speed: { name:'DEADLINE CLEARANCE', short:'CLEAR BEFORE DEADLINE', detail:'Clear a normal encounter within 55 s or a boss encounter within 100 s. The countdown advances only during combat.' },
  intact: { name:'SIGNAL INTEGRITY', short:'KEEP CREW STANDING', detail:'Finish the encounter without any operative being downed. A later revive does not erase a lost signal.' }
};

// Authored encounter orders change which role a crew must prioritize. The
// room geometry stays validated; only these bounded mixes are recombined.
export const encounterOrders = [
  [{id:'pressline',name:'PRESSLINE',detail:'Sentinels hold the lane; welders cut across it.',roles:['brute','sentinel','welder','gunner','mite']},
   {id:'rushline',name:'RUSHLINE',detail:'Chargers and sappers break the flanks.',roles:['charger','sapper','mite','gunner','welder']}],
  [{id:'coldfront',name:'COLD FRONT',detail:'Snipers cover the crossing; purgers deny close ground.',roles:['sniper','gunner','sapper','purger','healer']},
   {id:'recovery',name:'RECOVERY TEAM',detail:'Repair units work behind sentinels and purgers.',roles:['healer','purger','mite','sentinel','charger']}],
  [{id:'lockdown',name:'LOCKDOWN',detail:'Sentinels deny the reactor lane.',roles:['sentinel','gunner','sniper','sapper']},
   {id:'overwatch',name:'OVERWATCH',detail:'Marksmen and sappers force relocation.',roles:['sniper','sapper','healer','brute']}]
];

// The contractor publishes the cost before the crew votes. Each authorization
// applies to one encounter and the host follows the same vote as everyone else.
export const overtimeProtocols = [
  { id:'redline', stage:0, name:'REDLINE FEED', machine:'HYDRAULIC SHEAR',
    hazard:'Unstable power: reinforcements arrive faster and molten floor cycles every 6 seconds for 50% more damage.',
    reward:'An extra augment draft for every surviving crew member on clear.',
    notice:'THERMAL BYPASS AUTHORIZED · KEEP CLEAR OF THE PRESS',cycle:6,warnAt:2.75,activeAt:3.5,activeEnd:5.35,damageScale:1.5,spawnScale:.7 },
  { id:'feeddebt', stage:0, name:'FEED DEBT', machine:'HYDRAULIC SHEAR',
    hazard:'Three extra reinforcements enter this encounter. Machine calibration faults lock the controls for 1.2 seconds; each station takes 21 seconds to recharge.',
    reward:'An extra augment draft for every surviving crew member on clear.',
    notice:'FEED DEBT AUTHORIZED · PROTECT THE CALIBRATION TEAM',cycle:8,warnAt:4,activeAt:5,activeEnd:7,damageScale:1,spawnScale:.85,extraEnemies:3,faultLockout:1.2,machineCooldown:21 },
  { id:'coldchain', stage:1, name:'COLD CHAIN', machine:'CRYOGENIC PURGE',
    hazard:'Coolant valves remain open: frost floors cycle every 6 seconds and slow the crew longer.',
    reward:'An extra augment draft for every surviving crew member on clear.',
    notice:'COOLANT RECOVERY AUTHORIZED · PROTECT YOUR EXIT ROUTE',cycle:6,warnAt:2.75,activeAt:3.5,activeEnd:5.35,slowDuration:2,spawnScale:.7 },
  { id:'whiteout', stage:1, name:'WHITEOUT', machine:'CRYOGENIC PURGE',
    hazard:'Frost floors stay live for 2.4 seconds each 8-second cycle and slow the crew for 3.2 seconds. Two extra reinforcements enter.',
    reward:'An extra augment draft for every surviving crew member on clear.',
    notice:'WHITEOUT AUTHORIZED · KEEP AN EXIT LANE OPEN',cycle:8,warnAt:4,activeAt:5,activeEnd:7.4,slowDuration:3.2,spawnScale:.85,extraEnemies:2 },
  { id:'livegrid', stage:2, name:'LIVE GRID', machine:'CAPACITOR BANK',
    hazard:'The grid stays live: reinforcements arrive faster and reactor floors cycle every 6 seconds for 50% more damage.',
    reward:'An extra augment draft for every surviving crew member on clear.',
    notice:'POWER RECLAMATION AUTHORIZED · STAND OFF THE CONTACTS',cycle:6,warnAt:2.75,activeAt:3.5,activeEnd:5.35,damageScale:1.5,spawnScale:.7 },
  { id:'audit', stage:2, name:'AUDIT SWEEP', machine:'CAPACITOR BANK',
    hazard:'Four extra reinforcements enter quickly. A calibration fault locks controls for 1.1 seconds and each capacitor station takes 23 seconds to recharge.',
    reward:'An extra augment draft for every surviving crew member on clear.',
    notice:'AUDIT SWEEP AUTHORIZED · HOLD THE ACCESS LANES',cycle:8,warnAt:4,activeAt:5,activeEnd:7,damageScale:1,spawnScale:.65,extraEnemies:4,faultLockout:1.1,machineCooldown:23 }
];

export const classes = {
  vanguard: { name: 'VANGUARD', weapon: 'carbine', weaponName: 'M-24 CARBINE', skill: 'BULWARK', skillDetail: 'For 6 s, take 75% less damage and draw hostile targeting within 9 m. Allies within 5 m take 15% less damage.', cooldown: 28, color: '#d6ec53' },
  breacher: { name: 'BREACHER', weapon: 'scatter', weaponName: 'K-6 SCATTERGUN', skill: 'SHOCKWAVE', skillDetail: 'Deal 110 damage within 5.5 m, interrupt windups, delay attacks 1.5 s, and push survivors up to 2 m.', cooldown: 20, color: '#f4924f' },
  runner: { name: 'RUNNER', weapon: 'smg', weaponName: 'V-9 NEEDLER', skill: 'OVERCLOCK', skillDetail: 'Refill the active magazine and reset dash. For 6 s, move 35% faster and fire 75% faster.', cooldown: 26, color: '#75d9bd' },
  medic: { name: 'MEDIC', weapon: 'pulse', weaponName: 'P-12 PULSE RIFLE', skill: 'RALLY PULSE', skillDetail: 'Heal standing crew within 7.5 m for 45 and guard them by 15% for 3 s. Revive downed allies within 4.5 m at 35% health.', cooldown: 32, color: '#b5b0f3' }
};

export const weapons = {
  carbine: { name:'M-24 CARBINE', mag: 24, damage: 18, interval: .115, range: 22, reload: 1.55, speed: 38, radius: .09, bounces: 1, trait: '18 damage per round. One wall bounce lets you cover a lane from behind machinery.' },
  scatter: { name:'K-6 SCATTERGUN', mag: 6, damage: 9, interval: .72, range: 11, reload: 2.1, speed: 26, radius: .11, pellets: 7, spread: .055, trait: 'Seven physical pellets deal 9 each: 63 total if all connect. A hit within 5.5 m briefly staggers a non-boss target; each target resists another stagger for 2.8 s.' },
  smg: { name:'V-9 NEEDLER', mag: 38, damage: 11, interval: .075, range: 16, reload: 1.35, speed: 30, radius: .075, element:'toxin', trait: '11 direct damage. Poison ticks for 3 damage every 0.6 s for 2.4 s; repeat hits refresh its timer.' },
  pulse: { name:'P-12 PULSE RIFLE', mag: 12, damage: 33, interval: .33, range: 26, reload: 1.8, speed: 21, radius: .17, pierce: 1, trait: '33 damage per heavy bolt. Pierces one hostile to strike a second at full damage.' },
  rail: { name:'LONGBOW RAILGUN', mag: 5, damage: 105, interval: 1.05, range: 30, reload: 2.3, speed: 72, radius: .12, pierce: 3, trait: '105 damage. One slug can hit four hostiles; each penetration increases remaining slug damage by 12%. Surviving non-boss targets stagger briefly.' },
  launcher: { name:'CINDER MORTAR', mag: 4, damage: 54, interval: .8, range: 20, reload: 2.4, speed: 16, radius: .22, blast: 2.4, element:'fire', trait: '54 impact damage plus a 2.4 m blast. A direct target takes half blast damage; burning ticks for 4 every 0.6 s for 3 s.' },
  arcgun: { name:'TESLA SPINDLE', mag: 20, damage: 15, interval: .16, range: 18, reload: 1.6, speed: 28, radius: .12, element:'shock', trait: '15 direct damage. Every hit chains 55% of dealt damage to one target within 3.5 m; burning amplifies chain damage by 40%.' },
  cryo: { name:'GLACIER REPEATER', mag: 16, damage: 21, interval: .2, range: 20, reload: 1.75, speed: 28, radius: .12, element:'frost', trait: '21 damage and 38% slow for 2 s. SHATTER ENGINE unlocks bonus direct damage against slowed targets.' },
  saw: { name:'RIPTIDE DISC', mag: 8, damage: 39, interval: .48, range: 22, reload: 1.9, speed: 24, radius: .23, bounces: 3, pierce: 1, trait: '39 damage per contact. A wide disc can hit two hostiles and bounce off walls three times.' },
  burst: { name:'TRIAD BURST', mag: 21, damage: 17, interval: .31, range: 23, reload: 1.5, speed: 40, radius: .09, pellets: 3, spread: .026, trait: 'Three projectiles per trigger, 17 each. Center round always critically hits for 1.8× damage.' },
  harpoon: { name:'TETHER HARPOON', mag: 8, damage: 68, interval: .78, range: 21, reload: 2.05, speed: 34, radius: .14, trait: '68 damage. A surviving non-boss target is pulled up to 2.2 m toward you and marked for 3 s. The next crew hit consumes the mark for 30% more damage.' },
  gravity: { name:'GRAVITY CANISTER', mag: 5, damage: 24, interval: .92, range: 19, reload: 2.2, speed: 17, radius: .2, blast: 2.9, trait: '24 impact damage plus a 2.9 m blast. Survivors in the blast are pulled up to 1.4 m toward its center and slowed 35% for 2 s. Direct targets take half blast damage.' },
  borer: { name:'THERMAL BORER', mag: 24, damage: 13, interval: .12, range: 17, reload: 1.7, speed: 30, radius: .1, pierce: 1, trait: '13-damage cutter bolts pierce one hostile. Each shot adds 12 heat; at 80 heat, bolts widen and slow surviving targets 15% for 1.2 s. At 100 heat it vents for 1.2 s. Heat cools 24/s while idle; precision reload removes 30 heat. Reserve ammo is unlimited.' }
};

export const weaponNotes = {
  carbine:'Reliable recoil, short reload, bankable shots. Put a wall behind a target to recover a miss. One trigger consumes one round.',
  scatter:'One trigger consumes one shell. Pellet spread is about 3.2° between neighbors; ranged hits lose pellets, not per-pellet damage. A close hit interrupts a non-boss windup for 0.48 s; that enemy cannot be staggered again for 2.8 s.',
  smg:'Best sustained cadence. Toxin refreshes duration on repeat hits; the base effect does not stack damage. Fire on a poisoned target triggers a separate reaction.',
  pulse:'The slower, broad bolt carries full direct damage through its first target. Align two hostiles before firing.',
  rail:'The fastest projectile and longest range. The fourth target receives up to 1.12³ times the first-hit raw damage. A surviving non-boss target loses its windup for 0.68 s; it resists another stagger for 2.8 s.',
  launcher:'The shell detonates on a hostile, wall or range limit. Explosions affect visible enemies in radius; solid cover shields a target. The direct target also takes half blast damage.',
  arcgun:'Chains require a second enemy with clear line of sight within 3.5 m. Shock plus frost on the source triggers a separate conduction burst.',
  cryo:'Slow reduces enemy movement to 62% of normal and refreshes for 2 s on hit. Frozen here means slowed by frost.',
  saw:'Disc rebounds only from walls. Its first hostile penetration leaves it active; further direct hits need added pierce.',
  burst:'One trigger consumes one round and launches all three projectiles. The center projectile can still miss; its guaranteed crit does not affect the side rounds.',
  harpoon:'A physical bolt moves its first surviving non-boss victim toward the shooter in safe steps; solid walls stop the pull. Mark lasts 3 s. The next damage event from any crew member consumes it for 30% more damage. Bosses take the hit but resist displacement.',
  gravity:'The canister detonates on a hostile, wall or range limit. The direct target takes 24 impact plus half blast damage. Solid cover blocks the blast. Each surviving visible enemy in radius is drawn toward the explosion in safe steps and moves at 65% speed for 2 s. BLAST JACKET also enlarges this blast.',
  borer:'Fire short bursts to avoid the 1.2 s vent, or reach 80 heat to widen bolts and control a lane. The high-heat effect slows surviving targets to 85% speed for 1.2 s. Swapping weapons lets the Borer cool. A successful precision reload removes 30 heat immediately.'
};

export const enemyIntel = {
  mite:{name:'SCRAP MITE',detail:'Low chassis; rushes the crew for a close attack about every 0.85 s. Sweep the floor and keep moving.'},
  gunner:{name:'SECURITY GUNNER',detail:'Maintains medium range and strafes across a visible firing lane. Fires one 5.4 m/s projectile every 2.6 s when crew are visible within 11 m. Use walls to break its line.'},
  charger:{name:'RAM UNIT',detail:'Marks a charge for 0.5 s, then rushes toward the locked point for up to 0.65 s. Contact deals 12 damage and ends the rush. Baiting it into a wall stuns it for 1.35 s.'},
  brute:{name:'PRESS BRUTE',detail:'Heavy close-range attacker. Within 2.9 m it warns for 0.9 s, then slams a 2.45 m circle for 22 damage. Leaving the ring avoids it; when blocked from slamming, it can strike in melee for 17.'},
  sniper:{name:'SURVEY MARKSMAN',detail:'Marks a shot for 0.95 s, then fires a 12 m/s projectile. A red sightline reveals its aim before firing.'},
  healer:{name:'REPAIR TECH',detail:'Every 2.4 s, restores 22 + 2 per wave health to the most wounded nearby machine within 5 m. Eliminate it before wearing down armored targets.'},
  sentinel:{name:'BULKHEAD SENTINEL',detail:'Front plate takes 60% less direct damage for 4.5 s of every 7 s. Flank it or wait for the shield to dim.'},
  sapper:{name:'CANISTER SAPPER',detail:'Places a 2.1 m blast mark on crew position. It detonates after 1.25 s for 18 damage; leave the circle.'},
  welder:{name:'ARC WELDER',detail:'Foundry cutting unit. Marks a 1.2 m wide lane for 0.9 s, then sweeps the entire marked line for 15 damage. Break line of sight or leave the strip.'},
  purger:{name:'COOLANT PURGER',detail:'Cryolab pressure vessel. Charges a 3.1 m frost pulse for 1 s. Anyone in the visible ring takes 8 damage and moves slower for 2.4 s.'},
  warden:{name:'THE WARDEN',detail:'Foundry command machine. Cycles five 8 m/s fan projectiles, a 1.1 s marked 2.7 m press strike, and a 1 s warned 1.9 m shear lane. Both machine strikes deal 24 damage. At 45% health its attack and reinforcement cycles quicken.'},
  matriarch:{name:'THE MATRIARCH',detail:'Cryolab command machine. Cycles three 8 m/s fan projectiles, a 1.05 s warned 4.1 m frost pulse, and a 1 s warned 1.36 m coolant lane. Special attacks deal 20 damage and slow crew for 2.4 s. At 45% health its cycles quicken.'},
  overseer:{name:'THE OVERSEER',detail:'Core command machine. Cycles seven 8 m/s fan projectiles, a 1 s warned 1.7 m cutting beam, and a 1.1 s marked 2.25 m reactor press. Special attacks deal 25 damage. At 45% health its cycles quicken.'}
};

export const enemyStats = {
  mite: { hp: 48, speed: 1.65, radius: .72, damage: 7 },
  gunner: { hp: 78, speed: .85, radius: .86, damage: 9 },
  brute: { hp: 200, speed: .7, radius: .88, damage: 17 },
  charger: { hp: 95, speed: 1.45, radius: .72, damage: 12 },
  sniper: { hp: 72, speed: .7, radius: .82, damage: 16 },
  healer: { hp: 120, speed: .8, radius: .83, damage: 5 },
  sentinel: { hp: 170, speed: .72, radius: .88, damage: 13 },
  sapper: { hp: 88, speed: .92, radius: .78, damage: 18 },
  welder: { hp: 118, speed: .78, radius: .82, damage: 15 },
  purger: { hp: 142, speed: .86, radius: .84, damage: 8 },
  warden: { hp: 980, speed: .68, radius: 1.15, damage: 24 },
  matriarch: { hp: 1100, speed: .92, radius: 1.15, damage: 20 },
  overseer: { hp: 1240, speed: .75, radius: 1.15, damage: 25 }
};

export const stages = [
  { id:'foundry', name:'THE FOUNDRY', subtitle:'MOLTEN PROCESSING', color:'#c8d56a', boss:'warden', bossName:'THE WARDEN', enemies:['mite','gunner','charger','brute','sentinel','sapper','welder'] },
  { id:'cryolab', name:'CRYOLAB', subtitle:'DEEP FREEZE FAILURE', color:'#8fb9c6', boss:'matriarch', bossName:'THE MATRIARCH', enemies:['mite','gunner','sniper','healer','charger','sentinel','sapper','purger'] },
  { id:'core', name:'THE CORE', subtitle:'REACTOR BREACH', color:'#cb8e78', boss:'overseer', bossName:'THE OVERSEER', enemies:['gunner','brute','sniper','healer','charger','sentinel','sapper'] }
];

export const grafts = [
  { id:'arcSpine', name:'ARC SPINE', icon:'ϟ', color:'#83d8f5', kind:'SKILL / CONDUCTION',
    detail:'Using your class skill primes four trigger pulls. The first hit from each charged shot arcs 55% damage to one nearby hostile.' },
  { id:'kineticRig', name:'KINETIC RIG', icon:'◇', color:'#ffad72', kind:'DASH / IMPACT',
    detail:'Every dash launches a 2.5 m shockwave. Nearby hostiles take 48 damage and are pushed back.' },
  { id:'reclaimerCore', name:'RECLAIMER CORE', icon:'✚', color:'#a7ef9b', kind:'KILL / SQUAD REPAIR',
    detail:'A kill releases a 5 m repair pulse, restoring 12 health to nearby crew. Can trigger once every 4 seconds.' },
  { id:'phaseCoupler', name:'PHASE COUPLER', icon:'⟐', color:'#c9a8ff', kind:'DASH / ANGLE CONTROL',
    detail:'Dashing primes three shots. They pierce one extra target and rebound once, but each deals 20% less direct damage. Use angles, not raw force.' },
  { id:'siphonHalo', name:'SIPHON HALO', icon:'◎', color:'#f4d68a', kind:'RELOAD / CLOSE ASSAULT',
    detail:'A precision reload deals 22 damage to visible enemies within 2.8 m and cuts 3 s from your skill cooldown. It consumes the usual +20% charged round.' }
];

export const talents = {
  vanguard: [
    {branch:'SENTINEL', nodes:[{id:'v_guard',name:'HARDPOINT',detail:'Bulwark lasts 2 seconds longer and heals 12 on activation.'},{id:'v_bastion',name:'BASTION',detail:'While Bulwark is active, allies within 5 m take 35% less damage.'}]},
    {branch:'ORDNANCE',nodes:[{id:'v_rounds',name:'HEAVY ROUNDS',detail:'Carbine and railgun hits deal 20% more damage.'},{id:'v_barrage',name:'BARRAGE',detail:'Every fifth shot fires an additional projectile.'}]},
    {branch:'FIELDCRAFT',nodes:[{id:'v_plating',name:'REINFORCED SUIT',detail:'Gain 30 maximum health and restore 30.'},{id:'v_resolve',name:'LAST STAND',detail:'Below 35% health, deal 35% more damage.'}]}
  ],
  breacher: [
    {branch:'DEMOLITION',nodes:[{id:'b_charge',name:'SHAPED CHARGE',detail:'Explosions have 35% larger radius.'},{id:'b_aftershock',name:'AFTERSHOCK',detail:'Shockwave ignites surviving enemies hit for 10 damage every 0.6 s for 3 s.'}]},
    {branch:'BREACH',nodes:[{id:'b_impact',name:'IMPACT DRIVER',detail:'Shockwave deals 35% more damage.'},{id:'b_reset',name:'BREACH LOOP',detail:'Kills with Shockwave reduce its cooldown by 2 seconds.'}]},
    {branch:'CLOSE QUARTERS',nodes:[{id:'b_pellets',name:'DOUBLE OUGHT',detail:'Scattergun fires two additional pellets.'},{id:'b_rush',name:'POINT BLANK',detail:'Deal 30% more damage to enemies within 3 m.'}]}
  ],
  runner: [
    {branch:'VELOCITY',nodes:[{id:'r_stride',name:'KINETIC SERVO',detail:'Move 15% faster.'},{id:'r_surge',name:'MOMENTUM',detail:'Deal 25% more damage while sprinting or dashing.'}]},
    {branch:'VENOM',nodes:[{id:'r_toxin',name:'CAUSTIC NEEDLES',detail:'Poison deals 60% more damage.'},{id:'r_cloud',name:'CONTAGION',detail:'Poisoned enemies spread toxin when killed.'}]},
    {branch:'OVERCLOCK',nodes:[{id:'r_duration',name:'HOT CLOCK',detail:'Overclock lasts 2 seconds longer.'},{id:'r_recycle',name:'FEEDBACK LOOP',detail:'Kills during Overclock reduce its cooldown by 1 second.'}]}
  ],
  medic: [
    {branch:'TRIAGE',nodes:[{id:'m_heal',name:'FIELD MEDIC',detail:'Rally Pulse restores 20 more health.'},{id:'m_barrier',name:'AFTERCARE',detail:'Rally grants 3 seconds of 25% damage reduction.'}]},
    {branch:'BIOTECH',nodes:[{id:'m_leech',name:'SIPHON',detail:'Restore 2 health on every hit.'},{id:'m_vigor',name:'VIGOR',detail:'Above 80% health, deal 25% more damage.'}]},
    {branch:'PLASMA',nodes:[{id:'m_focus',name:'FOCUS LENS',detail:'Pulse rifle and arcgun deal 20% more damage.'},{id:'m_chain',name:'CONDUCTIVE MEDICINE',detail:'Rally shocks nearby enemies for 45 damage.'}]}
  ]
};

export const upgrades = [
  { id:'hotload', name:'HOT LOAD', detail:'+22% rate of fire.', kind:'WEAPON', rarity:'COMMON', icon:'↟' },
  { id:'hollow', name:'HOLLOW POINT', detail:'+25% weapon damage.', kind:'WEAPON', rarity:'COMMON', icon:'◆' },
  { id:'plating', name:'SALVAGED PLATING', detail:'+25 max health and heal 25.', kind:'SURVIVAL', rarity:'COMMON', icon:'▣' },
  { id:'sprint', name:'MOTION SERVO', detail:'+12% movement speed.', kind:'MOBILITY', rarity:'COMMON', icon:'»' },
  { id:'leech', name:'RED CIRCUIT', detail:'Heal 4 on every kill.', kind:'SURVIVAL', rarity:'COMMON', icon:'✣' },
  { id:'mag', name:'DRUM FEED', detail:'+30% magazine size.', kind:'WEAPON', rarity:'COMMON', icon:'▤' },
  { id:'shield', name:'CERAMIC LINING', detail:'Take 12% less damage.', kind:'SURVIVAL', rarity:'COMMON', icon:'⬡' },
  { id:'crit', name:'FAULT FINDER', detail:'+12% critical hit chance.', kind:'WEAPON', rarity:'COMMON', icon:'⌁' },
  { id:'ember', name:'EMBER COIL', detail:'Hits ignite for 3 s: 4 damage every 0.6 s. Each extra stack adds 3 damage per tick. Hits refresh the timer.', kind:'ELEMENT', rarity:'RARE', icon:'✹' },
  { id:'frost', name:'CRYO JACKET', detail:'Hits slow enemy movement by 38% for 2 s. Each extra stack deepens slow by 12 percentage points, to 75%.', kind:'ELEMENT', rarity:'RARE', icon:'❄' },
  { id:'arc', name:'ARC RELAY', detail:'Each hit has 22% chance per stack, up to 75%, to chain 55% dealt damage to a visible enemy within 3.5 m.', kind:'ELEMENT', rarity:'RARE', icon:'ϟ' },
  { id:'pierce', name:'GHOST BORE', detail:'Every projectile pierces one extra hostile.', kind:'PROJECTILE', rarity:'RARE', icon:'➤' },
  { id:'ricochet', name:'BANK SHOT', detail:'Projectiles gain one additional wall bounce.', kind:'PROJECTILE', rarity:'RARE', icon:'↗' },
  { id:'glancing', name:'GLANCING EDGE', detail:'Each wall rebound increases that projectile’s subsequent direct hit damage by 30% per stack, up to three rebounds. Rewards deliberate bank shots.', kind:'PROJECTILE', rarity:'RARE', requiresBounce:true, icon:'⌁' },
  { id:'tetherline', name:'DOUBLE KNOT', detail:'Harpoon marks last 4 s and empower the next two crew damage events instead of one. Requires a Tether Harpoon in your loadout.', kind:'PROJECTILE', rarity:'RARE', requiresWeapon:'harpoon', icon:'⌁' },
  { id:'singularity', name:'SINGULARITY VALVE', detail:'Gravity Canister pulls survivors up to 2.1 m, interrupts windups, and delays their next attack by at least 1.2 s. Requires a Gravity Canister in your loadout.', kind:'EXPLOSIVE', rarity:'RARE', requiresWeapon:'gravity', icon:'◉' },
  { id:'shrapnel', name:'FRAG PROTOCOL', detail:'Kills burst for 28 damage within 2.4 m, plus 18 damage per extra stack. Requires line of sight.', kind:'PROJECTILE', rarity:'RARE', icon:'✷' },
  { id:'mirror', name:'MIRROR FEED', detail:'Every fourth trigger fires two extra projectiles at ±0.11 rad. Extra stacks shorten the cycle, minimum every second trigger.', kind:'PROJECTILE', rarity:'RARE', icon:'⫷' },
  { id:'velocity', name:'KINETIC SLUG', detail:'+18% projectile speed and +10% damage.', kind:'WEAPON', rarity:'COMMON', icon:'➜' },
  { id:'quickhands', name:'QUICK HANDS', detail:'Reload 30% faster.', kind:'WEAPON', rarity:'COMMON', icon:'↻' },
  { id:'medkit', name:'COMBAT TRIAGE', detail:'Health pickups heal 20 extra.', kind:'SURVIVAL', rarity:'COMMON', icon:'✚' },
  { id:'scavenger', name:'SCAVENGER', detail:'Each stack adds 8 percentage points to the chance that a kill drops health.', kind:'SURVIVAL', rarity:'COMMON', icon:'◇' },
  { id:'blast', name:'BLAST JACKET', detail:'Mortar and gravity canister blast damage and radius each gain 30% per stack.', kind:'EXPLOSIVE', rarity:'RARE', icon:'✦' },
  { id:'shatter', name:'SHATTER ENGINE', detail:'Frozen targets take 25% more direct hit damage.', kind:'ELEMENT', rarity:'RARE', icon:'❖' },
  { id:'combustion', name:'VOLATILE MIX', detail:'Fire + toxin reaction deals 40 damage within 2.2 m instead of 22; each extra stack adds 18. Source has 1.5 s reaction cooldown.', kind:'ELEMENT', rarity:'RARE', icon:'☀' },
  { id:'conductor', name:'LIVE WIRE', detail:'Shock chain can hit one more visible enemy within 3.5 m per stack.', kind:'ELEMENT', rarity:'RARE', icon:'ϟ' },
  { id:'execution', name:'EXECUTIONER', detail:'Deal 30% more damage to targets below 35% health.', kind:'WEAPON', rarity:'RARE', icon:'⌖' },
  { id:'momentum', name:'BLOOD RUSH', detail:'Kills grant 10% movement speed for 4 seconds, stacking three times.', kind:'MOBILITY', rarity:'RARE', icon:'»' },
  { id:'capacitor', name:'SKILL CAPACITOR', detail:'Class skill cooldown is 18% shorter.', kind:'CLASS', rarity:'RARE', icon:'◈' },
  { id:'ward', name:'EMERGENCY WARD', detail:'Taking damage grants 2 seconds of 20% damage reduction.', kind:'SURVIVAL', rarity:'RARE', icon:'⬡' },
  { id:'fragment', name:'FRAGMENTATION', detail:'Mortar or gravity canister explosions and FRAG PROTOCOL kills launch three 16-damage fragments, each with 4 m range.', kind:'PROJECTILE', rarity:'RARE', icon:'✹' },
  { id:'snapfreeze', name:'SNAP FREEZE', detail:'A precision reload slows visible enemies within 2.8 m to 50% speed for 2 s. Each extra stack adds 0.5 m radius.', kind:'RELOAD', rarity:'RARE', icon:'❄' },
  { id:'quench', name:'QUENCH VALVE', detail:'Using a class skill slows visible enemies within 4 m to 50% speed for 2 s. Each extra stack adds 1 m radius.', kind:'CLASS', rarity:'RARE', icon:'◈' },
  { id:'bankSignal', name:'BANK SIGNAL', detail:'A wall-rebounded hit marks a surviving target for 3 s. The next crew damage event on it deals 30% more damage. Each extra stack adds 1 s, up to 6 s. Requires a bouncing weapon.', kind:'PROJECTILE', rarity:'RARE', requiresBounce:true, icon:'↗' },
  { id:'controlSplice', name:'CONTROL SPLICE', detail:'Completing a machine calibration primes your next three trigger pulls. Those shots pierce one extra hostile but deal 20% less direct damage. Charges do not stack.', kind:'MACHINE', rarity:'RARE', icon:'⌁' },
  { id:'serviceWard', name:'SERVICE WARD', detail:'Completing a machine calibration grants you and crew within 5 m 25% damage reduction for 4 s. Refreshes instead of stacking.', kind:'MACHINE', rarity:'RARE', icon:'▧' },
  { id:'bulwarkPlus', name:'LONG WATCH', detail:'Bulwark lasts 2 s longer. Allies within 5 m take 25% less damage instead of 15%; enemies already prefer your position.', kind:'CLASS', rarity:'SIGNATURE', classId:'vanguard', icon:'▧' },
  { id:'shockPlus', name:'WIDE BREACH', detail:'Shockwave radius grows from 5.5 m to 7 m, damage from 110 to 135, and attack delay from 1.5 s to 2.2 s.', kind:'CLASS', rarity:'SIGNATURE', classId:'breacher', icon:'◉' },
  { id:'overclockPlus', name:'ADRENAL LOOP', detail:'Kills during Overclock extend it by 1 second.', kind:'CLASS', rarity:'SIGNATURE', classId:'runner', icon:'⌁' },
  { id:'rallyPlus', name:'FIELD SURGE', detail:'Rally Pulse restores 20 extra health and completes nearby allies’ reloads.', kind:'CLASS', rarity:'SIGNATURE', classId:'medic', icon:'✚' }
];

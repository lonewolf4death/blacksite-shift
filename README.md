# BLACKSITE SHIFT

A playable 3D first person co-op roguelite shooter. Fight through three hostile sectors, collect weapons and augments, advance your class talent tree, and survive escalating boss waves. One to four players can share a room code.

## Play on Windows

Download and extract the [v0.22.0 Windows ZIP](https://github.com/lonewolf4death/blacksite-shift/releases/download/v0.22.0/BLACKSITE.SHIFT.v0.22.0.Windows.zip), then open `BLACKSITE SHIFT-win32-x64/BLACKSITE SHIFT.exe` inside the extracted folder. Keep that complete folder together; the executable needs its bundled runtime and game files. It starts its own multiplayer server, so Node.js and a separate browser are unnecessary. If a previous launch is still open, close it before starting the extracted copy.

For solo play, select **Solo Run**. To host co-op, select **Create Squad** and share the room code plus your computer's LAN IP address with your friends. They can run their own copy of the same version of the executable, enter the room code and your IP address with port `3000` in **Host IP:Port**, then select **Join Squad**. Your firewall may need to allow the game on private networks. Internet play requires a reachable host or port forwarding; there is no matchmaking yet.

## Run from source

Requires Node.js 20 or newer. No package install is needed because the 3D library and fonts are bundled in `public/`.

```powershell
node server.js
```

Open **http://127.0.0.1:3000** in a desktop browser. You can also build the Windows executable again with `./scripts/build-desktop.ps1`. The build script downloads and verifies Electron's official Windows runtime, then packages the game in `dist/`.

## Controls

| Action | Control |
| --- | --- |
| Move / aim | WASD / mouse |
| Fire / aim down sights | Left / right mouse button |
| Sprint / jump | Shift / Space |
| Slide / dash | Ctrl / Q |
| Class skill | E |
| Connect to nearby processing machine | F; A/D select, Space confirm, F cancel |
| Route / danger ping | G / Shift+G |
| Revive teammate / emergency self reboot | Hold V |
| Reload / optional timed second press | R |
| Switch weapon slot | 1 / 2 |
| Field manual | H |
| Settings / unlock cursor | Escape |
| Embedded browser fallback | Arrow keys turn, C fires, drag to aim |

Click the game view to lock the cursor after a run starts.

## Current content

- Real 3D arena, models, lighting and fog with a rough industrial presentation
- Room code co-op for up to four players with shared enemies and waves
- Acceleration, sprinting, jumping, sliding, dashing, aim down sights, adjustable mouse and ADS sensitivity, view bob, camera shake and FOV
- Four classes: Vanguard with a carbine and damage guard, Breacher with a scattergun and shockwave, Runner with a poison SMG and overclock, and Medic with a piercing rifle and squad heal
- Character selection shows weapon damage, fire rate, magazine, range, reload time, projectile speed, weapon trait, skill effect, and cooldown
- Floating damage numbers for confirmed hits, plus live damage, kills, recent DPS, and accuracy trackers
- Unlimited reserve ammo, magazine reloads, two weapon slots, health drops, and wall-safe enemy spawning
- Twelve weapons including a piercing railgun, explosive mortar, chaining Tesla gun, freezing repeater, bouncing disc launcher, critical burst rifle, pulling harpoon, and gravity canister
- 3 sectors with five authored cover layouts each, distinct floor materials, low walls, raised walkable equipment decks, hazard hardware, machinery, lighting and drone tones, and a bounded nine-wave run ending in an incident report. Every third wave is a boss fight with a fixed boss arena, three attack patterns, and a visible low-health emergency phase.
- Six authored encounter orders across the sectors, chosen from the run seed. Each order changes the enemy role sequence and is announced at entry.
- A lobby run-seed field lets the host repeat a prior reported seed for layout and reward reproduction
- Operable sector machinery: hydraulic shear, cryogenic purge, and capacitor bank. Depending on the bay, the squad gets three easier stations, two medium stations, or one hard station. Each station triggers a marked strike with its own cooldown and crew danger.
- Contract work orders set a concrete objective in every encounter: process hostiles with machinery, clear by a deadline, or keep the crew standing. Verified orders earn sector credit and relieve contract strain; missed orders add at most two next-encounter reinforcements. Two credits by a sector boss pay an extra personal augment draft to each survivor.
- Machine calibration uses three distinct live tasks: route a three-valve sequence, bridge circuits in a moving timing window, or balance pressure against automatic drift for four seals. The operator uses A/D and Space while teammates cover them; combat never pauses. The 3D controls, lamps, HUD panel, warnings, and cycle sounds show each station's state.
- Settings include Reduced Flashing Lights while preserving danger warnings. Research and implementation notes are in [`planning/CLOVERPIT_DEEP_DIVE.md`](<planning/CLOVERPIT_DEEP_DIVE.md>).
- Ten enemy roles plus three bosses: flanking chargers, long-range snipers, healers, ranged gunners, mites, brutes, frontal-shield sentinels, marked-zone sappers, Foundry welders, and Cryolab purgers
- 37 augments, including elemental effects, chain lightning, kill explosions, bonus shots, blast amplification, bank-shot damage, harpoon marks, gravity control, precision-reload freezing, class-skill freezing, and class signature upgrades
- Four class talent trees with three branches and two tiers each, for 24 class-specific nodes
- Fire, frost, toxin, and shock interactions; poison plus burn can detonate, frozen enemies can shatter, and electricity chains through groups
- Baseline toxin plus fire detonation and shock plus frost conduction, with separate visible status rings so combined conditions remain readable
- Shared co-op combat with server tracked projectiles, boss attacks, movement prediction, and individual build choices
- Server validated squad pings that appear in the 3D arena, with teammate selection and vote status visible between waves and a clear error for mismatched builds
- Host controlled downed and revive flow: hold V near a fallen teammate, or use one emergency self reboot if no one else is standing
- Threat director limits simultaneous major attack windups and active enemies by squad size; reinforcements prefer positions outside the crew's line of sight, route around cover, and show a spawn effect
- Visible encounter pressure at 30 and 60 seconds adds one bounded reinforcement per step; the clock pauses in the service room
- A shared salvage quota from kills grants each crew member one personal augment-offer reroll after the clear; loot picks remain independent
- Optional precision reload: press R again during the highlighted window to shorten the remaining reload and charge the next shot for 20% more damage
- Automatic co-op reconnection after a brief network interruption: the live host reserves the operative's identity, class, equipment, and run build for 60 seconds; teammates see the reconnect countdown
- Clear windups for sniper shots, charger rushes, Brute slams, sapper blasts, welder cutting lanes, purger frost pulses, and three warned boss attacks; boss health, hazard warnings, and wave intros in the HUD
- Distinct layered weapon fire sounds and cycling viewmodel parts, ballistic shell ejection, differentiated projectile silhouettes, low machine drones and distant clanks, shot-driven aim recoil and recovery, reload poses, critical hit sparks, squad muzzle flashes, and adjustable camera shake
- Confirmed hit feedback distinguishes critical damage, stagger, a consumed squad mark, and a Sentinel plate hit. Close scattergun hits and rail slugs interrupt ordinary enemy windups, with a 2.8-second resistance window to prevent permanent stun. Enemy models face their target and show charge, stun, windup, and boss emergency states.
- Sector-specific Overtime squad votes after a clear: the terminal names the hazard and reward before commitment, ties stay stable, and a successful next encounter grants a second augment draft
- Five boss grafts with visible suit parts: Arc Spine charges chain shots after a class skill, Kinetic Rig turns a dash into a shockwave, Reclaimer Core repairs nearby crew after kills, Phase Coupler turns a dash into angle-control shots, and Siphon Halo trades a charged round for a close pulse and skill recovery on precision reload
- More decisive class skills on longer cooldowns: Vanguard draws fire under 75% protection, Breacher interrupts and displaces a group, Runner refills and resets dash while Overclocked, and Medic heals or revives nearby crew
- Every wave entry chooses validated, separated crew positions and the client snaps its predicted position to that entry, including sector changes
- In-game field manual catalogs twelve weapons, elemental reactions, 37 augments, 24 talents, five grafts, four skills, and thirteen hostile types
- Host-selected 30, 60, or 120 second service decision window with clear automatic departure and a two-second early countdown once all living crew have selected and voted

See [GAME_GUIDE.md](GAME_GUIDE.md) for the content roster, [planning/MACHINES_AND_BAYS.md](planning/MACHINES_AND_BAYS.md) for the new controls and geometry, [planning/REFERENCE_DEVELOPMENT.md](planning/REFERENCE_DEVELOPMENT.md) for source-by-source research, the [Lethal Company deep dive](planning/LETHAL_COMPANY_DEEP_DIVE.md) for co-op design decisions, and the original [BLACKSITE SHIFT research and production plan](planning/PRODUCTION_PLAN.md).

This is still a prototype. It has no persistence or matchmaking, and the multiplayer protocol is meant for trusted play sessions rather than public deployment.

Run the multiplayer smoke test with `node --test`.

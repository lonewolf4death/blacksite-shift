# BLACKSITE SHIFT: field guide

## The run

The contractor sends the squad through **The Foundry**, **Cryolab**, and **The Core** after automated systems begin classifying employees as raw material. Each sector has two containment waves and a third-wave boss. The third boss ends the standard nine-wave run with an incident report; the facility remains sealed. Normal encounters select one of five authored cover layouts from the displayed run seed, while bosses keep fixed sight lines. Some bays have waist-high barriers that block movement and low projectiles but allow aimed fire over them; others add sloped, walkable equipment decks 0.62 m high. A downed operative has 18 seconds before losing signal. Hold **V** within 1.8 m for 2.5 seconds to revive them; taking damage or stepping away interrupts the repair. If no one else is standing, a downed operative may hold **V** for a four-second emergency reboot once per run. Downed survivors recover at wave clear. Operatives who lose signal return at the next wave with partial health if another operative survives.

Every cleared wave grants one augment. The armory opens after the first wave and after bosses; select a weapon for the inactive slot, then switch with **1** and **2**. Every boss also grants a class talent point and a major suit graft choice for survivors. In the lobby the host chooses a 30, 60, or 120 second service decision window. An intermission advances early when every living player finishes their choices and votes on Overtime, or automatically when the visible timer expires. Threat pressure pauses during this window. The final boss's recovered equipment is cataloged in a final draft before the incident report; no vote is requested for a tenth encounter.

The Overtime terminal offers a squad choice after each clear except the final one. **Stable Route** keeps ordinary hazards. **Activate Overtime** authorizes the named sector protocol for the next encounter. The card states its hazard and extra augment reward before any vote. Foundry Redline accelerates reinforcements and makes thermal floors cycle sooner and hit harder; Cryolab Cold Chain keeps coolant active more often and slows crew longer; Core Live Grid accelerates reinforcements and powers reactor floors more often. A strict majority of living, connected players must vote for Overtime; ties and uncast votes resolve to Stable Route. Clear the Overtime encounter to earn a second augment draft for every survivor. The vote can be changed until departure, and the condition ends after that encounter.

During combat, press **G** to mark a route or **Shift+G** to mark danger at the point ahead of your aim. Pings remain visible to the squad for six seconds and are limited to a 15 m clear line of sight. The squad panel shows teammate health in combat; between waves, it shows which choice or vote each operative still needs. Everyone joining a room must use the same build version.

If a player's connection drops, the live host reserves their squad slot for 60 seconds. The game retries automatically from the same running window and restores the same identity, class, weapons, augments, talents, grafts, and combat state. Teammates see a reconnect countdown. The reservation expires after 60 seconds and then frees the slot. Reconnection requires the host's game to remain running; closing the host ends its room.

Press **H** at any point to open the Field Manual. It lists the exact base values and behavior of every weapon, effect, skill, talent, graft, augment, and hostile. Close it with **H** or **Escape**; the run continues while it is open.

Each stage has a timed floor hazard with a visible warning ring: thermal vents in the Foundry, slowing coolant in Cryolab, and reactor arcs in the Core. Watch the floor while fighting.
Each stage has physical processing controls. Press **F** near a ready station to connect. Use **A/D** to select and **Space** to seal, or **F** to abort. While connected, the operator cannot shoot or move, but combat continues and other crew can guard the station. Moving out of reach, disconnecting, or being downed cancels operation. A hit disrupts pressure stability and briefly jams input. The server validates every selection and seal; a client cannot skip the calibration. The marked area warns for 1.25 seconds before firing; crew in the zone can be hurt or slowed. Each station has a 17-second cooldown.

| Bay configuration | Controls and rule | Fastest practical operation |
| --- | --- | --- |
| Three Valve Cascade stations | At each of three stages, select the marked valve and seal after the contactor recovers. A wrong choice creates a fault and delay. | At least 3.7 seconds plus selector taps. Multiple easy stations provide alternate strike zones. |
| Two Circuit Bridge stations | Select the marked channel at each of three stages, then seal while the moving needle crosses the amber timing window. An off-window seal creates a fault and delay. | Several scan passes; station choice changes the strike zone. |
| One Pressure Balance station | Match the marked pressure value, hold it stable for 1.7 seconds, then seal. Automatic drift occurs every 2.4 seconds. Complete four stages. | More than 7 seconds even with perfect adjustments; usually longer under attack. |

The first wave always teaches the easy three-station layout. Later normal bays use seeded layouts and station sets; a boss encounter always has one difficult pressure station. The Foundry's hydraulic shear deals a center strike, Cryolab's purge chills and damages hostiles, and the Core's capacitor deals a heavy discharge. A station's label, lamp, and target ring identify the one being operated. Call the trigger, lure enemies into its marked area, and clear it before the machine cycles.
The threat director caps active enemies and overlapping sniper, charger, sapper, welder, purger, and boss attacks according to squad size. Reinforcements prefer covered spawn points, route around walls to reach crew lanes, and appear with an amber arrival effect.

## Contract work orders

The contractor assigns one visible work order per encounter. Wave one always assigns **Controlled Processing** so the crew learns the physical machine. Each sector includes all three work orders, arranged from the displayed run seed. A work order is a performance target for that encounter; the crew can finish the wave even if it misses the target.

| Order | Exact completion rule | Tactical decision |
| --- | --- | --- |
| Controlled Processing | A machine cycle must strike two distinct hostiles before wave clear. On a boss wave, the boss itself must be struck once. | Calibrate any station, draw enemies to its marked area, and leave the 1.25-second warning. Multiple hits on the same enemy count once. |
| Deadline Clearance | Clear all hostiles and pending reinforcements within 55 seconds, or 100 seconds for a boss wave. Only active combat counts. | Push to finish quickly, but decide whether reviving, using a machine, or waiting for a safer firing lane is worth the time. |
| Signal Integrity | No operative may be downed during the encounter. A later revive does not undo a down. | Guard a threatened teammate, use crowd control, and call a retreat before a dangerous overlap. |

A verified order pays **one sector credit** and removes one contract strain. A missed order adds one strain, up to a hard cap of two. Each point of strain schedules **one extra reinforcement in the next encounter**, including a boss encounter; a later verified order can remove it. Strain persists across sectors. Sector credit resets at the first encounter of each sector. Reach **two credits by that sector's boss clear** and every survivor receives one extra personal augment draft. This can stack with the Overtime draft, for three personal augment picks after that clear. The service timer automatically resolves all remaining picks when it expires. The Overtime vote remains a separate, voluntary squad decision with its own hazard and payout.

The combat HUD names the current order, its live measure, and current strain. The service terminal shows the result, sector credits, strain, and next-wave reinforcement cost. The manual records all three orders and the accounting rule. The exact rule is visible before players commit to an Overtime vote.

In Settings, **Reduced Flashing Lights** steadies decorative pulse lights and animated HUD flashing. Hazard regions, enemy windups, machine warnings, and status colors remain visible.

## Classes and talents

| Class | Starter and skill | Talent branches |
| --- | --- | --- |
| Vanguard | M-24 Carbine; Bulwark gives 75% self damage reduction for 6 s, biases enemy targeting, and guards nearby allies by 15%. 28 s cooldown. | Sentinel: longer guard and ally protection. Ordnance: stronger precision rounds and extra shots. Fieldcraft: maximum health and a low-health damage boost. |
| Breacher | K-6 Scattergun; Shockwave deals 110 in 5.5 m, interrupts windups, delays attacks 1.5 s, and pushes survivors. 20 s cooldown. | Demolition: larger explosions and burning aftershock. Breach: stronger skill and kill resets. Close Quarters: extra pellets and point-blank damage. |
| Runner | V-9 Needler; Overclock refills the active magazine, resets dash, and grants 35% speed and 75% fire rate for 6 s. 26 s cooldown. | Velocity: movement and momentum damage. Venom: stronger poison and contagion. Overclock: longer duration and kill-driven cooldown recovery. |
| Medic | P-12 Pulse Rifle; Rally heals standing crew for 45 within 7.5 m, guards them by 15% for 3 s, and revives downed allies within 4.5 m. 32 s cooldown. | Triage: stronger healing and damage guard. Biotech: healing on hits and high-health damage. Plasma: stronger energy guns and a shocking Rally. |

Each branch has two tiers. Buy its first node before its second.

## Boss grafts

| Graft | Combat change |
| --- | --- |
| Arc Spine | Using a class skill charges the next four trigger pulls. The first hit from each charged shot arcs 55% damage to one nearby hostile. |
| Kinetic Rig | A dash launches a 2.5 m shockwave that deals 48 damage and pushes nearby hostiles. |
| Reclaimer Core | A kill repairs 12 health for crew within 5 m of the owner. It can trigger once every 4 seconds. |
| Phase Coupler | A dash primes three shots that each gain a pierce and a bounce but deal 20% less direct damage. It rewards finding a shot angle after moving. |
| Siphon Halo | A precision reload emits a 2.8 m pulse for 22 damage and removes 3 seconds from skill cooldown. It spends the usual charged round. Reload near a group for a close assault. |

Grafts are offered after each third-wave boss, and each graft can be installed only once per run. They appear on teammates' suits and in the HUD.

## Armory weapons

| Weapon | Combat role | Signature behavior |
| --- | --- | --- |
| M-24 Carbine | Flexible automatic rifle | Fast rounds ricochet once. |
| K-6 Scattergun | Close-range burst | Seven individual pellets; a hit within 5.5 m interrupts an ordinary enemy for 0.48 s. That target resists another stagger for 2.8 s. |
| V-9 Needler | Fast status application | Needles poison targets. |
| P-12 Pulse Rifle | Heavy precision | Plasma pierces two hostiles. |
| Longbow Railgun | Long-range multi-kill | Pierces four targets; the slug gets stronger after each hit and staggers a surviving ordinary enemy for 0.68 s, followed by 2.8 s stagger resistance. |
| Cinder Mortar | Area control | Explosive shell burns enemies in its blast. |
| Tesla Spindle | Crowd chaining | Guaranteed shock arc to a nearby enemy. |
| Glacier Repeater | Crowd control | Bolts slow targets and set up shatter bonuses. |
| Riptide Disc | Angled attacks | Wide discs pierce once and bounce three times. |
| Triad Burst | Critical fire | Three tight rounds; the center round always crits. |
| Tether Harpoon | Pull and focus fire | A 68-damage bolt pulls a surviving non-boss target up to 2.2 m toward the shooter and marks it for 3 s. The next crew damage event gains 30%. |
| Gravity Canister | Group control | A 24-damage shell bursts in 2.9 m, pulls surviving enemies up to 1.4 m toward impact, and slows them 35% for 2 s. Direct targets take half blast damage. |

All weapons have unlimited reserve ammunition, but still use magazines and reloads. Press **R** to reload; a highlighted timing window appears in the HUD. A deliberate second **R** press in that window finishes the reload sooner and charges the next trigger pull for 20% more damage. Missing the window completes a normal reload. Damage, fire rate, projectile speed, range, magazine size, and reload duration appear in character selection for each starter. Armory cards display the new weapon's damage, rate, and trait.

## Enemy roster

| Hostile | Behavior |
| --- | --- |
| Mite | Small, fast melee pressure. |
| Gunner | Keeps distance, strafes across a firing lane, and fires bolts. |
| Brute | Warns for 0.9 s, then slams a 2.45 m circle for 22 damage. Leave the ring; if a major windup is unavailable it can still melee for 17. |
| Charger | Locks a line for 0.5 s, rushes for up to 0.65 s, and deals 12 on contact. If it hits solid cover, it is stunned for 1.35 s. |
| Sniper | Holds range and fires high-speed bolts. |
| Healer | Repairs injured hostiles within reach. |
| Sentinel | Faces its current target with a front plate: 60% less incoming damage from the front for 4.5 of every 7 seconds. Flank or wait for the shield to dim. |
| Sapper | Marks a 2.1 m blast on a crew position; after a 1.25-second warning it detonates for 18 damage. Move outside the marked circle. |
| Arc Welder | Foundry cutting unit; marks a 1.2 m wide strip for 0.9 s, then cuts it for 15 damage. Leave the strip or break sight. |
| Coolant Purger | Cryolab pressure unit; charges a 3.1 m frost ring for 1 s, then deals 8 damage and slows crew for 2.4 s. Clear the ring. |
| The Warden | Foundry boss; cycles five-round fans, a 2.7 m marked press, and a 1.9 m wide shear lane. Press and shear deal 24 damage after their warnings. |
| The Matriarch | Cryolab boss; cycles three-round fans, a 4.1 m frost pulse, and a 1.36 m wide coolant lance. Specials deal 20 damage and slow for 2.4 s. |
| The Overseer | Core boss; cycles seven-round fans, a 1.7 m cutting beam, and a marked 2.25 m reactor press. Specials deal 25 damage. |

At 45% health, each boss announces an emergency cycle and lights a red warning ring. Its attack interval shortens from 3 to 2.45 seconds and its reinforcement interval from 8 to 6 seconds. The same three warning shapes remain in use so the faster phase stays recognizable. Bosses resist scattergun and railgun stagger; ordinary enemies have a 2.8-second resistance window after either hit interrupts them.

## Build interactions

The augment pool contains 37 options. Common choices raise direct damage, fire rate, health, mobility, magazine size, reload speed, or survival. Rare choices reshape attacks with pierce, ricochets, explosions, extra shots, and elements. **Snap Freeze** turns a precision reload into a close-range slow; **Quench Valve** adds a slow pulse to any class skill. **Glancing Edge** rewards bank shots with 30% more subsequent direct hit damage per rebound and stack, up to three rebounds. **Double Knot** extends a harpoon mark to two crew damage events over 4 s. **Singularity Valve** strengthens a gravity pull to 2.1 m, interrupts windups, and delays surviving enemies' next attack by at least 1.2 s. Weapon-specific choices appear only when the matching gun is in your loadout; Glancing Edge appears once you can bank shots. Each class also has a signature augment.

- **Toxin + fire:** poison a target, then ignite it to trigger a radial detonation without an augment. Volatile Mix increases the reaction damage. Needler plus Ember Coil or Cinder Mortar can set this up.
- **Frost + shock:** shock a chilled target to conduct a short slow and damage pulse to up to two nearby enemies. This creates a follow-up target for the squad.
- **Shatter Engine:** frozen targets take extra direct hit damage. The Glacier Repeater and Cryo Jacket can apply frost.
- **Live Wire:** electric arcs hit an additional nearby target. Tesla Spindle has a built-in arc; Arc Relay can add chains to other weapons.
- **Fragmentation + Frag Protocol:** kills burst and launch short-range fragments, useful against grouped mites.
- **Blast Jacket + Shaped Charge:** mortar and gravity canister blasts grow larger and stronger for a Demolition Breacher.
- **Tether Harpoon + Gravity Canister:** pull a marked target into a group, detonate a canister, then let a teammate consume the mark on a follow-up shot.
- **Gravity Canister + processing machine:** gather enemies beneath the warned center strike, call the cycle, then leave the zone as a crew.
- **Heavy Rounds + Ghost Bore:** a Vanguard railgun can punch through a line of enemies with increasing slug damage.
- **Caustic Needles + Contagion:** Runner poison grows stronger and spreads on poisoned kills.

These are examples; augments and talents can be mixed freely across a run.

## Encounter orders and pressure

The host may enter a previous incident report's run seed in the lobby, or leave the field blank for a new random seed.

The run seed chooses one of two authored enemy orders for each sector's normal encounters. The order is announced on entry. Foundry Pressline uses sentinels to hold a lane; Rushline uses chargers and sappers to disrupt flanks. Cryolab Cold Front pairs snipers and sappers, while Recovery Team protects healers behind sentinels. Core Lockdown denies the reactor lane with sentinels; Overwatch forces relocation with marksmen and sappers. The same seed and the same sequence of actions reproduce layouts, role orders, spawn positions, and reward offers. Boss rooms keep authored sight lines.

Only combat time raises pressure. At 30 and 60 seconds, the director adds one reinforcement and slightly accelerates subsequent arrivals. Pressure stops at level 2/2 and pauses completely while the squad chooses equipment. The HUD shows the current band and elapsed encounter time. Enemy health does not jump at those thresholds. This makes a long machine play or revive costly in a predictable way while the active-enemy and major-windup caps still apply.

Every kill fills the crew's shared salvage quota. Meeting it before the clear grants each operative one personal reroll for an augment offer at the service station. Rerolls replace all three cards and cannot be used after the current draft is accepted. Salvage is shared, but all augment, armory, talent and graft selections remain personal. Overtime still grants its separate extra draft on a successful encounter.

## Handling and class signatures

Each gun kicks the aiming direction by a different amount and recovers over time. Short bursts and ADS give better control on the automatic guns; the scattergun and railgun have stronger single-shot kick. Moving receiver parts, ballistic casing ejection, and distinct projectile shapes show cadence and travel. A precision reload gives a brief audio cue when its timing window opens. Confirmed damage distinguishes critical hits, a consumed harpoon mark, and a Sentinel plate absorbing a hit. Reserve ammunition remains unlimited.

The class signature augments make new co-op actions possible. Long Watch lets Vanguard draw nearby hostile fire while Bulwark is active. Wide Breach delays enemy attacks after Breacher's Shockwave. Field Surge finishes the reload of nearby allies when Medic uses Rally Pulse. Runner's Adrenal Loop still rewards kills during Overclock with extra skill duration.

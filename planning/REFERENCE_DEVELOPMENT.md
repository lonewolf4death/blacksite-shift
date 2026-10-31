# BLACKSITE SHIFT — reference development and acceptance record

Prepared October 30, 2026. This follows Section 3 of `PRODUCTION_PLAN.md` in its stated order. It is desk research from the linked official developer/publisher pages, paired with inspection of the current executable prototype. I have not played or instrumented these games here. Where a page describes a feature, that is labelled **documented**; a BLACKSITE mechanic is an **original design response**, not a claim that the reference implements it in the same way.

## North star and limits

A contractor sends a maintenance crew into a sealed processing complex after its automated systems begin treating employees as raw material. Each descent recovers equipment, exposes the facility's purpose, and gives the squad access to more dangerous machinery. The crew survives by adapting its equipment faster than the facility escalates. Signs, equipment descriptions, machine behavior, and short announcements carry this story.

The four release pillars are **tactile guns, visible adaptation, shared industrial danger, and controlled escalation**. The signature action is an optional, clearly priced Overtime vote at designated machinery. A strict majority of living crew must approve it; ties stay stable, the host gets no unilateral override, and the condition ends with the next encounter. An Overtime condition must create a decision about positioning or timing, and its reward must visibly affect the next build.

## 1. CloverPit — pressure at a physical choice point

**Documented:** [CloverPit's official store page](https://store.steampowered.com/app/3314790/CloverPit/) describes a confined rusty cell, a physical slot machine and ATM, a debt due at the end of each round, and prizes/charms that change odds and trigger combinations. The valuable pattern is a ritual: approach a machine, see an obligation, make a limited choice, then discover whether the accumulated build can meet the next demand. Its atmosphere also comes from the tiny room and worn objects, not merely a pixelated image.

**Original response:** BLACKSITE's contractor posts a *production authorization* rather than a monetary debt. After an encounter, a physical terminal names the next processing condition, its crew hazard, and the extra equipment issued on clear. The vote is the ritual. The obligation is to survive that encounter and recover the equipment; no slot machine, gambling economy, copied cell, or iconography enters the shooter. Each crew member receives a personal augment draft, so the reward remains useful to all roles. The warning lamps and machine plate use the same vocabulary in the menu and in the next room.

**Implemented through 0.21:** sector-specific Overtime cards, majority/tie rules, an encounter-limited activation, extra draft on clear, industrial control console, and warning presentation. A seeded work order now gives each encounter a named performance target; each sector contains all three target types. A bounded sector account turns completed orders into equipment credit and missed orders into at most two later reinforcements. The shared machine requires an authoritative hold, with a lever, gauge, progress lamps, sound, and a physical contract placard. Reduced Flashing Lights steadies decorative pulses while retaining danger warnings. The exact accounting, failure cases, and acceptance criteria are in [CLOVERPIT_DEEP_DIVE.md](CLOVERPIT_DEEP_DIVE.md). **Later option:** consider a compact service alcove only if walking to it improves a crew decision enough to justify the travel time.

**Acceptance:** In a four-person test, every player can identify the hazard and reward before voting; a 2–2 tie remains stable; someone can point to the equipment they received from a successful Overtime run. The space should feel like an unsettling workplace when all screen filters are disabled.

## 2. Project P.I.T.T. — the facility is a weapon and a workplace

**Documented:** [Project P.I.T.T.'s official store page](https://store.steampowered.com/app/4026250/Project_PITT/) presents first-person physics production lines, tools including magnets and fans, panels/pistons/launchers, and a brutalist corporate facility. It invites combining systems to improve throughput. That supports large forms, clear machine states, and consequential physical controls; it does not imply this FPS needs open-ended construction.

**Original response:** Each sector has an authored processing line with one legible combat intervention. A wall console operates an overhead center rig. The Foundry's hydraulic shear damages enemies but can hit crew in its marked zone; Cryolab's purge damages and chills enemies but also slows crew; the Core's capacitor discharges for high damage and hurts anyone standing in its marked zone. A 1.25-second warning, a shared cooldown, a spatial tell, and authoritative server validation make this a tactical team tool. Operators can lure enemies into the center, call the trigger, and leave before it cycles. The same input and console silhouette work across sectors while materials, light color, and consequences change.

**Implemented in 0.15:** visible console and overhead rig, F interaction, client warning disc, server-validated proximity, three sector effects, shared cooldown, damage/slow, HUD prompt, and announcements. **Next depth pass:** author one alternate machine per sector and make a room variant swap which machine is powered. The alternate should change timing or path use, not simply multiply damage. Add distinct mechanical audio layers: contactor click, hydraulic movement, then impact, with attenuation by distance.

**Acceptance:** An unprompted player notices the control, can predict the danger area, and can describe when they would trigger it. The squad gets at least one deliberate co-op moment from luring/triggering/clearing rather than from an unpredictable accident. Map collision and art must agree.

## 3. Lethal Company — the crew decides how much to risk

**Documented:** [Lethal Company's official store page](https://store.steampowered.com/app/1966720/Lethal_Company/) describes contracted workers collecting scrap to meet quota, riskier sites for higher value, tools and communication, and teammates coordinating around hazards. Its distinctive lesson for BLACKSITE is the social pressure of a shared job. Its low-power scavenging rhythm should not consume every gunfight.

**Original response:** The contractor's messages call players a *maintenance crew*. Overtime is a shared job-site safety waiver: the hazard and equipment payout are stated up front, with the whole crew voting. Personal augments avoid loot theft; shared machine cooldowns prevent competing activations; death has a timed nearby revive; disconnected players retain a reserved slot for a short reconnect window. A combat room clears before anyone enters a required upgrade menu. These rules matter more than adding voice chat as a shortcut for co-op design.

**Current implementation:** four-player room codes, squad pings, nearby hold-to-revive, reconnect reservations, independent draft choices, ready status, majority Overtime, and no Overtime activation during combat. The host can choose a visible 30/60/120-second service window; an absent host's control passes to a connected crew member. Remote crew suits now carry readable maintenance gear: air filters, tool pouches, radio, task lamp, reflective plates and class-specific kit. The detailed source audit, pacing model, optional recovery experiment and co-op acceptance checks are in [LETHAL_COMPANY_DEEP_DIVE.md](LETHAL_COMPANY_DEEP_DIVE.md). **Later:** optional shared salvage should be spent only through a visible squad rule, not a first-click-wins crate.

**Acceptance:** Two players can join, vote against one another, see stable win the tie, make individual picks, revive a casualty, and reconnect without changing class or build. A new player can explain whether a pickup is personal or shared before taking it.

## 4. Deadzone: Rogue — legible first-person elemental room combat

**Documented:** [Deadzone: Rogue's official store page](https://store.steampowered.com/app/3228590/Deadzone_Rogue/) positions it as a co-op roguelite FPS with weapon variety, elemental affixes, augments, sectors, and escalating threats. It is the closest structural reference here for aiming and movement while builds are layered on top.

**Original response:** Start with direct, physical shots and tight encounter spaces. Carbine rebounds, scattergun fires separate pellets, pulse rifle pierces, railgun penetrates, mortar bursts, arcgun chains, cryo slows, and poison needles establish a reason to pick each weapon before any upgrade. Elements form a small interaction grammar: toxin followed by fire causes a burst, frozen targets reward deliberate follow-up fire, and shock becomes a target-selection tool. The grammar should be visible on enemy surfaces and in damage feedback; avoid ten hidden status stacks.

**Current implementation:** twelve projectile weapons, distinct shot sound/pose values, elemental effects and status cues, enemies with different roles, per-player damage reporting, and weapon-family muzzle signatures. The detailed source audit, original design proposals, co-op failure cases and test gates are in [DEADZONE_ROGUE_DEEP_DIVE.md](DEADZONE_ROGUE_DEEP_DIVE.md). **Next depth pass:** tune starter gun cadence, recoil recovery, reload sound, impact and range against blinded testers; evaluate whether status rings remain readable amid four players. The existing health bars and damage numbers should be options, with danger telegraphs never disabled by cosmetic settings.

**Acceptance:** Testers identify the four starters by sound and handling without labels. A player can deliberately make one elemental reaction twice in one run. An enemy's imminent major attack stays distinguishable from a friendly projectile effect.

## 5. Risk of Rain (2013) — time has a cost

**Documented:** The [developer store description](https://store.steampowered.com/app/248820/Risk_of_Rain/) explicitly connects time to difficulty and emphasizes replayable runs. This is pressure, not a mandate for exponential health inflation.

**Original response:** Only active encounters accrue pressure. Delaying to operate a machine or revive a teammate risks reinforcements and a floor cycle, while moving quickly may leave a powerful tactic unused. Safe service decisions stop that clock. Use discrete director bands: heavier role mix, an elite threat, and modest frequency changes. Keep enemy health growth slower than combined player damage and cap simultaneous major windups.

**Current implementation:** encounter hazards, bounded active-enemy/major-attack budgets, a 30/60-second pressure band with a HUD countdown to the next extra reinforcement, and no safe-room pressure. The source audit, fairness rules, timing model and prototype gate are in [RISK_OF_RAIN_2013_DEEP_DIVE.md](RISK_OF_RAIN_2013_DEEP_DIVE.md). **Next depth pass:** test an optional side reward that costs encounter time, and record why a run ended. Do not hide a difficulty multiplier in the background.

**Acceptance:** Players can state whether lingering costs them anything; a long fight gets harder in a predictable, bounded way; four-player output never creates an unreadable number of major telegraphs.

## 6. Risk of Rain 2 — authored spaces, combinatorial outcomes

**Documented:** [Risk of Rain 2's official store page](https://store.steampowered.com/app/632360/Risk_of_Rain_2/) describes handcrafted locales, randomized stages/enemies/items, item synergies, and four-player co-op. Strong replayability comes from recombining trustworthy parts.

**Original response:** Build room kits with designed sight lines, flank routes, cover and machine placements. The director selects an authored layout variant, role mix, boss pattern, reward offers and Overtime condition. Use a run seed for reproducible bug reports and daily challenges later. A build may amplify a weapon, but the room remains designed for manual aiming and movement. Finish a three-sector standard run before offering an endless loop.

**Current implementation:** three sector themes, five authored cover layouts per sector selected from a run seed, three fixed boss arenas, seeded encounter orders and reward offers, bounded active threat, a nine-wave ending, and a wave-entry line identifying the chosen bay and machine stations. The source audit, agency and item-pool rules, co-op edge cases, geometry contracts and prototype gate are in [RISK_OF_RAIN_2_DEEP_DIVE.md](RISK_OF_RAIN_2_DEEP_DIVE.md). **Next depth pass:** build several distinct authored rooms and route orderings, with full deterministic manifests and spawn validation. Make variants change the shooter's decisions, not only wall colors.

**Acceptance:** Two runs with the same seed reproduce their room/reward sequence. Two distinct seeds create different tactical routes without clipping, wall spawns, or unreachable enemies. Boss attack lanes remain reliable.

## 7. Everything is Crab — visible adaptation with consequences

**Documented:** [Everything is Crab's official store page](https://store.steampowered.com/app/3526710/Everything_is_Crab/) emphasizes many evolutionary abilities, distinct combinations and strategies, different biomes/bosses, and a codex. The relevant idea is a major choice that changes form and behavior.

**Original response:** Suit grafts are invasive industrial modifications recovered from the facility. Arc Spine makes skill use prime selected shots, Kinetic Rig turns dash into an impact decision, and Reclaimer Core makes kill positioning a squad heal choice. A graft is visible on an ally's suit and named in the loadout. Future grafts should alter targeting, timing, movement or support obligations; a flat +15% damage graft fails this reference.

**Current implementation:** four grafts, mechanical interactions, and visible ally suit parts. Phase Coupler is a tradeoff: three shots after a dash gain angle control but lose direct damage. **Next depth pass:** add a personal first-person suit cue and a compact build summary stating the changed action. Add more tradeoff grafts so a crew member might consciously give up range, armor or cooldown for an alternate role.

**Acceptance:** After two runs, a player describes a new action they took because of a graft. Another crew member can see the graft and anticipate that behavior. Visual form still reads clearly at combat distance.

## 8. Gunfire Reborn — small cast, deep personal rhythm

**Documented:** [Gunfire Reborn's official store page](https://store.steampowered.com/app/1217060/Gunfire_Reborn/) presents distinct heroes with abilities, random weapons, randomized levels, many items, and four-player co-op. The underlying tension is variety without losing a hero's identity.

**Original response:** Four suits fill readable roles: Vanguard holds a lane, Breacher creates a close-range opening, Runner changes tempo, Medic sustains the group. A starter weapon and active skill define each role before augments. Talent branches reinforce different uses of the skill; drafts should present a mix of class-specific, behavior-changing and simple reliability choices. Armory weapons can change a run's attack pattern without erasing the suit's contribution.

**Current implementation:** four classes and starters, distinct active skills, three talent branches per class, random armory offers, and class signature augments. **Next depth pass:** audit each branch for a decision change; merge redundant percentage nodes into fewer, stronger choices. Improve class-select examples to show what an ability can save or create in a co-op situation.

**Acceptance:** Without reading names, teammates identify each suit's role from one encounter. Two players of the same class can describe different build plans and carry them out.

## 9. Megabonk — frequent rewards, constrained spectacle

**Documented:** [Megabonk's official store page](https://store.steampowered.com/app/3405340/Megabonk/) emphasizes randomized maps, XP from kills, random upgrade offers of differing rarity, and rapid growth through synergy. The useful cadence is frequent proof that a run changed.

**Original response:** Each room clear gives a personal draft, boss clears give a major graft, and successful Overtime gives an extra draft. Early offers should let a player feel a tactical shift in the next encounter. Keep mandatory menus between battles so upgrades never steal the cursor during fire. Set a maximum for simultaneous extra projectiles, particles and sound voices; growth is allowed only while the danger grammar survives.

**Current implementation:** normal and bonus drafts, rarity, boss grafts, intermission selection. **Next depth pass:** instrument time between decisions and flag any stretch with no changed behavior. Add a concise result panel showing the one or two interactions that did the work, rather than a flood of stat totals.

**Acceptance:** A player can tell what changed after each of the first three rewards. The strongest four-player combination still shows a sniper lock, charge lane and machine warning without effects masking them.

## 10. SYNTHETIK: Legion Rising — handling mastery without ammunition scarcity

**Documented:** [SYNTHETIK's official store page](https://store.steampowered.com/app/528230/SYNTHETIK_Legion_Rising/) explicitly describes magazine ejection, active reload, overheating/jams, movement-based recoil, varied ammo, deep item/build customization, class specializations, and modular difficulty. This is a reason to test handling mechanics, not to import all of them together.

**Original response:** BLACKSITE keeps unlimited reserve ammunition. A magazine still creates cadence, timing and vulnerability. A second reload press in a visible timing window shortens the reload and primes a stronger shot; missing it completes the normal reload. The player can keep moving and shooting deliberately without stopping for ammo pickups or a jam-clearing mini-game. Weapon recoil should reward controlled burst timing while the Runner's mobility remains valuable.

**Current implementation:** optional precision reload, unlimited reserve, separate reload lengths, movement-responsive viewmodel. **Next depth pass:** audio cue for the precision window, accessibility option for a wider window, and a controlled recoil test across all ten guns. Consider heat on only one future weapon if it creates an interesting choice; do not make all weapons jam.

**Acceptance:** Players notice the timed reload and can ignore it without losing a run. Starter guns are identifiable from cadence, recoil, reload, impact and sound before augments. Nobody runs out of reserve ammo.

## Cross-reference gate before content expansion

| Requirement | Current evidence | Remaining gate |
| --- | --- | --- |
| Guns feel good without upgrades | Ten distinct projectile behaviors, sound profiles, reload times and poses | Blind starter-gun playtest with impact and recoil tuning |
| Builds change decisions | Elements, projectile rules, class skills, four visible grafts including a tradeoff | Remove redundant flat modifiers; add build summary |
| Industrial atmosphere is physical | Three materials/palettes, ceiling rigs, consoles, signs, warning lamps | Distinct machinery audio, service alcove, richer proportions and wear |
| Co-op rules are deliberate | Majority vote, personal drafts, ready state, revive, reconnect, configurable departure window | Explicit loot ownership labels |
| Four-player readability | Active enemy/major-attack caps, warning areas, danger cue | Four-player stress scenario and effect-budget options |
| Authored content recombines | Six cover layouts, fixed boss spaces, route seed, role mixes, random offers | More authored rooms and fully deterministic route manifest |

The present prototype is a **playable slice**, not a verified full release. Content expansion should follow observed shooter feel and co-op tests. If Overtime merely delays a room without producing a memorable positioning or timing decision, simplify or replace its hazard before adding more variants.

## October 30 follow-through: references 4–10 in the executable

This pass applied the seven later references in Section 3 one at a time. The original analysis above records the source observations and design response; the entries below record what actually changed in version 0.16. A reference is an influence on BLACKSITE's own mechanics, not a claim of feature parity or copied content.

### 4. Deadzone: Rogue — elemental follow-up and enemy feedback

The Needler's toxin and any fire source now produce a small detonation as a baseline interaction. Volatile Mix raises its damage. This makes the Needler plus mortar or Ember Coil a deliberate co-op sequence even before finding a specific augment. Shock delivered to a frozen target transfers a short slow and pulse to up to two nearby enemies, encouraging target selection rather than blind crowd damage. Enemies can display separate fire, frost, and toxin floor rings at once; a major attack telegraph keeps its larger red lane or lock shape. All ten weapons remain physical projectiles with their own pace and trajectory.

**Checks:** projectile test confirms toxin plus fire damage, frost plus shock transfers a slow, and the 3D diagnostic renders the combined cue code. **Remaining:** test the four starter guns with players who cannot see weapon names, tune impact and range by observed use, and stress visual status cues with four fully built players.

### 5. Risk of Rain (2013) — finite time pressure

Combat seconds are visible in the HUD. At 30 and 60 seconds the director adds exactly one pending reinforcement and slightly speeds arrivals, with a hard maximum band of 2/2. There is no secret exponential health multiplier. The counter starts anew each encounter and does not advance in the service decision window. Active enemy and overlapping major attack budgets remain in force, so longer fights cost the squad without filling every lane with simultaneous windups. The shared salvage quota also provides a reason to finish targets instead of simply waiting for the next wave.

**Checks:** a test advances across both thresholds, confirms only two reinforcements were added, and confirms none are added after 60 seconds. **Remaining:** an optional side objective that makes spending time a purposeful choice; measure whether 30/60 seconds is noticeable at solo and four-player clear speeds.

### 6. Risk of Rain 2 — authored recombination and reproducibility

Each sector now has two named encounter orders: Foundry Pressline/Rushline, Cryolab Cold Front/Recovery Team, and Core Lockdown/Overwatch. The seed chooses an order as well as one of two authored cover layouts on normal waves. The order changes the sequence of enemy roles and is stated in the HUD and wave entrance callout. Boss arenas still keep fixed sight lines. A room-local seeded generator now drives reward cards, armory offers, enemy spawn choices, shot spread, critical rolls, and drops; with the same seed and actions, the combat and service draws can be reproduced for a bug report.

**Checks:** two runs built from the same seed match layout, order, first spawn type and position, augment cards, and armory offers. Existing four-client testing checks spawn clearance and shared combat. **Remaining:** more geometry than the current six cover layouts, a route graph, and a replay harness for a complete nine-wave input sequence.

The host can now enter a seed in the lobby to repeat a previous incident report; leaving it blank generates a new seed. The server validates the unsigned 32-bit value, and only the current host may change it before departure.

### 7. Everything is Crab — a fifth visible tradeoff graft

Siphon Halo appears as a double glowing ring on an ally's suit. A precision reload with it pulses for 22 damage within 2.8 m and removes three seconds from the owner's skill cooldown. It consumes the usual 20% charged round. The player must decide to time a reload near enemies and use the next class skill sooner, rather than bank a stronger shot at range. This is a new timing and positioning loop with a clear cost. The HUD states the required action, and boss draft cards explain the exchange before installation.

**Checks:** a test confirms range pulse damage, skill recovery, no charged round, and the modified reload event. **Remaining:** a first-person suit cue and player-observed evidence that the graft changes behavior in a real run.

### 8. Gunfire Reborn — stronger class jobs

The class-select card now gives a concrete crew use for each suit. Three signature augments gained team-facing behavior: Long Watch makes Vanguard's Bulwark attract nearby hostile targeting, Wide Breach delays attacks from enemies hit by Breacher's Shockwave, and Field Surge completes nearby allies' reloads during Medic's Rally. Runner's Adrenal Loop already turns kills during Overclock into more active time. Base skills and starter weapons still define the role before any upgrade. These effects add protection, timing, and support decisions alongside damage growth.

**Checks:** a focused test activates the three revised signatures and verifies targeting state, attack delay, and ally magazine restoration. **Remaining:** a human role-recognition test and a balance pass on signature frequency versus generic augments.

### 9. Megabonk — earned reward cadence with a team rule

Kills fill a visible shared salvage quota during an encounter. If the crew meets it, every crew member gets one personal augment-offer reroll in the following service window. All three cards change; the server rejects stale draft tokens and a second reroll. Drafts still occur between battles, so no build menu interrupts aiming. Overtime's extra draft remains separate, and individual loot ownership stays explicit. This rewards a sustained fight while limiting reward and effect growth to a readable number of decisions.

**Checks:** test verifies shared quota, one reroll per eligible player, three new card identities, and stale-token rejection. **Remaining:** instrument decision spacing and four-player effect density; the quota threshold will need tuning by squad size.

### 10. SYNTHETIK — aim handling and reload timing

Every weapon has a separate aim kick and recovery rate in addition to its existing sound, cadence, projectile and viewmodel pose. Automatic weapons climb if the trigger is held; the heavy single-shot guns kick harder; aiming down sights reduces kick. The precision reload window now gives a short audio cue. These are handling inputs the player can master while reserve ammunition remains unlimited and a missed precision window still finishes the normal reload. Siphon Halo makes the timing worth considering as a build action.

**Checks:** client syntax, existing reload and unlimited-reserve tests, and a packaged Electron solo rendering diagnostic. **Remaining:** blinded human gun-feel test, full weapon recoil tuning, and an optional wider precision window if players need it. The current timing window is server-authoritative and identical for all clients.

### Cross-reference review after 0.16

The four pillars now have concrete systems: tactile guns have shot-driven aim handling and an audio reload cue; visible adaptation has five shown grafts including two with explicit costs; shared industrial danger still centers on a one-encounter Overtime vote and a machine that can hurt the crew; controlled escalation has two finite pressure steps under the existing active-threat and windup caps. The co-op rules remain personal augment ownership, shared salvage progress, strict-majority Overtime, tie-to-stable, timed revives, reconnect reservations and visible departure timing. The premise remains a contractor sending a maintenance crew into a sealed processing complex whose automation treats employees as material; signs, equipment, machines and short announcements carry it. No cinematic campaign was added.

The automated suite verifies logic and four connected clients; it cannot certify how the guns feel, whether teammates can read a fully upgraded fight, or whether Overtime produces a memorable decision. Those are playtest gates before release claims. The route graph, additional authored spaces, alternate machines, and first-person graft cues are still future content.

## 0.17 field intelligence, threat and atmosphere pass

This pass revisited each source above against what the executable actually offered. It is a design comparison grounded in the linked official pages and the prototype code, not a hands-on critique of the reference games. The resulting changes are deliberately bounded: two enemy behaviors, two interaction augments, four stronger class skills, an exhaustive field manual, a safer stage entry, and a material/audio pass. The room count remains three sectors with two normal layouts each and fixed boss layouts. Authored geometry and a four-player readability playtest remain production work.

### CloverPit: make the terminal a credible workplace ritual

The most useful feature remains a physical, repeatable decision point. The service vote still states its cost and reward before the next encounter, and every player gets the same deadline and vote rights. In 0.17 the terminal and arena use darker steel and less uniform light, while the field manual explains Overtime's one-encounter scope and the tie-to-stable rule. This strengthens the sense that the contractor is posting a dangerous work order. The decision remains separate from weapons: gun feel must work even when no augments are owned. The next acceptance check is whether crews discuss the hazard before voting, rather than clicking the bonus from habit.

### Project P.I.T.T.: machinery needs readable mass and a sound sequence

The overhead rig remains a deterministic strike with a 1.25-second center-zone warning. Wall service panels, caged fixtures, overhead pipes, stained floor patches and darker metal give the line more weight without creating invisible collision. Machine authorization now has a harsher warning tone and its completed cycle has a low industrial impact layer; the baseline ambience adds a beating motor tone and occasional distant clank. These cues support the existing mechanical silhouette. They are synthesized placeholders, so a later audio pass should capture or design separate contactor, travel and impact assets for each sector and confirm the warning remains audible under four guns.

### Lethal Company: keep squad risk governed by explicit rules

The new sapper marks a blast at the crew's position, waits 1.25 seconds, then detonates a 2.1 m area. Its floor circle, HUD warning and local warning sound give teammates something to call out. A marked player can leave; another player can choose to cross the zone to finish a revive or hold a machine lane. The existing Overtime vote, personal loot, shared machine cooldown, timed revival, reconnect reservation and automatic service departure continue to define responsibility. The next human test is whether players naturally communicate a sapper mark and make a deliberate trade in a two-person fight.

### Deadzone: Rogue: base weapons and elements must explain themselves

The ten projectile weapons now publish base damage, trigger cadence, magazine, range, projectile speed, reload duration and their exact special behavior in a field manual available with H. The selection card also states each starter gun's trait and skill. This exposed and corrected two misleading claims: the Glacier Repeater slows but needs Shatter Engine for bonus direct damage, and the Tesla Spindle's chain amplification comes from a burning target rather than a generic wet status. A mortar burn calculation that could become invalid without Ember Coil was fixed. Snap Freeze makes a precision reload a close control move; Quench Valve makes skill timing also control nearby space. Both pair with frost/shock and Shatter builds, so a player changes where or when they act. A blind starter-gun handling test is still required; numeric clarity does not prove tactile distinctness.

### Risk of Rain (2013): pressure needs survivable choice costs

Pressure remains two visible steps at 30 and 60 combat seconds, with capped active enemies and major windups. The sentinel adds a time cost to poor target choice: 60% frontal mitigation during 4.5 of every 7 seconds rewards flank movement or a temporary target swap, without secretly inflating every enemy's health. The sapper adds a short relocation cost and can interrupt a static firing lane. Safe service time still does not advance combat pressure. This will need timing measurements in solo and four-player runs; the scripted suite proves bounded math and warning behavior, not ideal pacing.

### Risk of Rain 2: authored geometry and systemic recombination must agree

Sentinels and sappers enter each sector's existing authored enemy orders in different combinations. Pressline is a shielded lane, Rushline breaks flanks, Cold Front combines distant aim with area denial, Recovery Team uses a shield in front of repair, Lockdown denies a core lane, and Overwatch forces relocation. The room seed still selects layouts, roles and reward offers. Stage transitions now choose validated free tile centers separated for all four crew, and the client snaps its predicted position on every new wave. This closes a specific player-wall spawn failure at the border between authored cover variants. Three seeds across all nine waves and four positions were checked, including every sector change. Future rooms must use the same clearance routine and verify art protrusions against collision.

The four-client check also revealed that valid but concealed enemy spawns could leave hostiles stranded behind cover. Enemy pursuit now uses a bounded grid route around walls when direct line of sight is blocked. A custom cover-wall regression test confirms a mite crosses to the crew's side, and the live four-client test again records real projectile damage. This preserves the value of covered arrivals without leaving a quiet, unwinnable encounter.

### Everything is Crab: changes in form should change decisions

The five suit grafts remain visible on teammate models. The new manual states the precise action and trade for each: Arc Spine primes shots after a skill, Kinetic Rig turns a dash into close impact, Reclaimer Core ties kills to squad position, Phase Coupler trades damage for angle control, and Siphon Halo spends the normal charged reload round for nearby impact and earlier skill use. Snap Freeze and Quench Valve add two smaller action-changing mutations without new suit parts. A first-person cue for personal grafts and more true downside grafts remain open. The test is whether players can name a new action their build made worthwhile, not merely a larger damage number.

### Gunfire Reborn: skills should define a role before the draft

Vanguard now guards itself by 75% for 6 seconds, biases nearby hostile targeting and gives nearby allies a 15% guard on a 28-second cooldown. Breacher's 20-second Shockwave deals 110 within 5.5 m, interrupts an active windup, delays attacks and pushes survivors. Runner's 26-second Overclock reloads immediately, refreshes dash and grants a 6-second 35% move and 75% fire-rate burst. Medic's 32-second Rally heals standing allies, guards them briefly and reboots nearby downed allies with temporary invulnerability. The longer cooldowns make timing matter, and the default skill has an observable rescue, hold, breach or tempo use. Talents and signature augments remain optional branches rather than prerequisites for basic class identity. A group test should now verify whether each skill has a clear best moment and whether the cooldown leaves too much idle time.

### Megabonk: more combinations, bounded presentation

The augment pool grows to 34 with Snap Freeze and Quench Valve. Each can chain into existing frost, shock, shatter, movement, class and reload paths without adding a new elemental vocabulary. The new manual provides one place to review all 34 choices, 24 talents and five grafts between battles, while draft cards continue to show their effect at the moment of choice. FX still have caps for damage numbers and debris; sapper blast and sentinel shield use dedicated cues, and the HUD checks the real blast radius. A maximal four-person build is not yet certified readable. This should be measured with all players firing chained, fragmenting weapons while a sapper, sniper, boss and machine telegraph overlap.

### SYNTHETIK: reward handling mastery with clear rules

Unlimited reserve ammunition remains intact. The precision reload window and its audio cue make magazine timing useful without blocking normal reloads. Snap Freeze gives an active reload a defensive purpose near enemies, while Siphon Halo still offers a different reward in the same window; both can coexist. Heavier guns gained a low transient beneath their existing shot profile, and the ambience avoids a horror sting in favor of machinery and pressure. The field manual explicitly states the 55–75% timing window, 0.12-second completion, charged shot value, and Siphon trade. A future player test should compare low and high audio settings and allow the timing cue to remain audible at a comfortable master volume.

### Six-rule acceptance check for this pass

1. **Weapons before upgrades:** all ten have different base cadence, projectile behavior, reload and sound; the executable has not passed a blind player feel test.
2. **Builds change actions:** Snap Freeze and Quench Valve create timed control opportunities; grafts and skill revisions create angle, movement, rescue and team-positioning decisions.
3. **Industrial atmosphere:** material color, panel depth, pipes, stains, caged light, signs, machine operation, motor bed and impact cues now carry more of the mood. A future art/audio pass must replace procedural placeholders with finished assets.
4. **Co-op rules:** Overtime majority and tie, independent rewards, shared machines, timed death/revival, reconnection and departure continue to be explicit.
5. **Four-player readability:** active enemy and windup budgets remain; the new sapper floor mark and shield state are legible in isolation. Maximal-build four-player readability remains a required playtest.
6. **Authored recombination:** seeded layouts and enemy orders now mix eight normal roles, but the current room geometry still needs substantially more authored variety.

The contractor/maintenance-crew premise remains intact. A sealed facility treats employees as raw material; the crew recovers equipment and adapts faster than automation escalates. Signs, machine behavior, equipment descriptions and short announcements deliver it. No cinematic campaign is required for this executable prototype.

## 0.18 position and sector identity pass

This pass adds two armory guns that have a useful job at base strength. Tether Harpoon deals 68 damage, pulls a surviving non-boss target up to 2.2 m toward its shooter, and marks it for a 30% stronger next crew damage event. Gravity Canister deals 24 impact damage and a 2.9 m blast, then draws surviving targets toward the impact and slows them. Both use physical projectiles, distinct gun meshes, recoil and synthetic fire profiles. Safe-step movement checks walls and other enemy bodies during the pull. The intent is for a crew to choose a position and prepare a machine strike or follow-up shot. Test whether each gun is desirable before acquiring its related augment.

Three rare augments add specific paths. Glancing Edge rewards deliberate wall rebounds with 30% more direct damage per rebound and stack, capped at three rebounds. It is offered only when a carried weapon or Bank Shot can bounce. Double Knot extends harpoon marks from one to two crew damage events and from 3 to 4 seconds. Singularity Valve strengthens a gravity pull from 1.4 to 2.1 m and holds survivors' next attack for at least 1.2 seconds. These latter cards enter the draft only when the relevant gun is carried. The normal damage, health and mobility options remain. This is a modest extension of behavioral choices rather than a new rarity layer.

Foundry Pressline and Rushline can now include Arc Welders. They announce a 0.9-second, 1.2 m wide cutting strip; leaving the strip or breaking line of sight avoids 15 damage. Cryolab Cold Front and Recovery Team can include Coolant Purgers. They announce a 1-second, 3.1 m ring; anyone still inside takes 8 damage and is slowed for 2.4 seconds. Both count against the existing major-attack budget, so four-player overlap remains bounded. The HUD measures distance to the actual beam segment and pulse radius. The threat's sound cue and model silhouette match its tell. A test covers dodging and remaining inside each warning.

The three bosses now alternate their existing projectile fan with one sector-specific command. The Warden stamps a 2.7 m marked press zone, the Matriarch releases a 4.1 m frost pulse, and the Overseer cuts a 1.7 m beam lane. The normal-role warning vocabulary carries into the boss fight, while distinct HUD text names the stronger attack. The director still counts a boss attack as two major windups, and an automated check verifies each alternating pattern resolves after its warning.

The Foundry now has wall furnace ports, rail hangers and shear teeth; Cryolab has coolant tanks and overhead vents; the Core has charged wall conductors and ceiling coils. These are visual features kept on walls or overhead so they do not change validated spawn collision. The underlying industrial drone also changes pitch and filter by sector. These authored details are reused with the two validated cover layouts and six encounter orders. They carry the employee-as-material premise through machine shape and signs without adding a cinematic.

The six production rules still govern this work. Distinct base handling must survive a blind feel test; the harpoon, canister and new augments should change positioning and team timing; atmosphere should be legible in material and machine silhouette; loot remains personal and Overtime remains a majority vote with a stable tie; warnings take priority over decorative FX; and content is recombined only within validated geometry and bounded threat budgets. Automated tests verify mechanics and a four-client smoke run, but the maximal four-player build combination and subjective gun feel still require human playtesting.

## 0.19 weapon, enemy and sector feel pass

Every gun retains its published ballistic or energy behavior. The viewmodels now cycle a visible operating part at their recoil cadence; the disc, canister, harpoon and mortar have distinct moving assemblies. Physical projectile models are shaped as discs, spear bolts, rail slugs, shells or energy cores, rather than a common glowing stone. Ballistic weapons eject brief casings, while shot sound adds a mechanical snap or electrical chirp on top of the existing body and noise layers. A confirmed hit now separates critical damage, a consumed harpoon mark, and frontal Sentinel plate absorption in the number color and hit tone. These are feedback changes, so numerical weapon balance is left stable for an actual blind handling test.

Enemy behavior and silhouette were revised together. The Ram Unit now deals 12 on contact along its charge path; swept contact checks prevent a fast tick from passing through a player. Driving it into a wall causes a 1.35-second stun that the squad can exploit. The Press Brute warns a 2.45 m slam for 0.9 seconds, then deals 22 inside the ring; its 17-damage melee remains when a major attack is unavailable. Security Gunners strafe across visible firing lanes while cooling their shots. Enemy models face their actual target rather than the camera, and charge, windup, stun, plate and hit states each receive a visible cue. Bosses retain their sector-specific second attack. The existing major-attack budget covers the new Brute tell so four-player telegraphs do not multiply without limit.

The Foundry, Cryolab and Core now use separate floor surface patterns, fixed hazard vent hardware, pulsing machinery light and stage-colored impact materials. These additions sit on the floor or walls without changing server collision, so validated crew and enemy spawn clearance still applies. Stage light modulation is subtle and hazard-linked; dangerous floor rings remain the strongest visual signal. The same room structures and authored encounter orders still recombine under the run seed. A packaged WebGL launch and actual group play remain the acceptance checks for performance and the strongest four-player build combination.

The six original rules remain the bar: starter guns should be distinguishable by cadence and feedback; behavioral builds should change aim, timing and positioning; atmosphere should come from physical machinery and sound; Overtime, loot, death and departure retain explicit squad rules; enemy warnings should win the visual hierarchy; and replayability should come from verified authored pieces recombined by systems. The contractor still sends a maintenance crew into a sealed complex that classifies employees as raw material, with the premise carried by signs, equipment, machine behavior and announcements.

## 0.20 reference recheck and emergency-cycle polish

I rechecked the ten official store descriptions in the plan against the current executable. These descriptions establish advertised features, not hidden tuning or the quality of their feel. The implementation choices below remain original BLACKSITE SHIFT rules.

| Reference | What the official description reinforces | Concrete response this pass |
| --- | --- | --- |
| [CloverPit](https://store.steampowered.com/app/3314790/CloverPit/) | A confined industrial space and physical, consequential decisions can carry pressure. | Keep machinery and Overtime as visible worksite commitments; strengthen the emergency-cycle alarm rather than add a detached minigame. |
| [Project P.I.T.T.](https://store.steampowered.com/app/4026250/Project_PITT/) | Brutalist scale and active industrial systems provide a recognizable place. | Recombine additional authored cover around the existing physical rig, while collision and boss sight lines remain validated. |
| [Lethal Company](https://store.steampowered.com/app/1966720/Lethal_Company/) | A crew makes risk and quota decisions together. | Keep Overtime's strict-majority vote, personal drafts and shared salvage rule intact. Boss emergency announcements and distinct lane warnings give the crew a reason to call positions. |
| [Deadzone: Rogue](https://store.steampowered.com/app/3228590/Deadzone_Rogue/) | Projectile combat, elemental augments and sector escalation must work together. | Heavy base weapons now create a tactical opening before upgrades; the field manual describes exact stagger and resistance values. |
| [Risk of Rain (2013)](https://store.steampowered.com/app/248820/Risk_of_Rain/) | Time should visibly affect pressure. | The 30/60-second bounded reinforcement bands remain. Boss emergency cycles increase attack cadence at a stated health threshold rather than secretly inflating health. |
| [Risk of Rain 2](https://store.steampowered.com/app/632360/Risk_of_Rain_2/) | Handcrafted spaces and randomized combinations support repeated runs. | A third authored normal-wave cover arrangement per sector raises the normal layout count from six to nine. Boss arenas stay fixed. |
| [Everything is Crab](https://store.steampowered.com/app/3526710/Everything_is_Crab/) | Adaptation is most legible when it changes behavior and form. | Close scattergun play now earns an interruption window while rail precision can stop a distant windup; boss overdrive has a visible red crown ring. Suit grafts still change timing and positioning. |
| [Gunfire Reborn](https://store.steampowered.com/app/1217060/Gunfire_Reborn/) | Distinct hero and weapon roles support cooperative build choices. | Breacher's starter weapon gains a close control identity, while the railgun offers a long-range rescue shot. Neither requires a signature augment. |
| [Megabonk](https://store.steampowered.com/app/3405340/Megabonk/) | Escalation and varied combinations make repeated encounters exciting. | Each boss now has three spatial attack shapes and a 45% health emergency phase. The same warning vocabulary persists as attacks speed up. |
| [SYNTHETIK: Legion Rising](https://store.steampowered.com/app/528230/SYNTHETIK_Legion_Rising/) | Handling depth is a source of mastery. | Heavy impact has a confirmed stagger number, distinct hit tone and spark treatment, while the 2.8-second resistance lock prevents pellet spam from trivializing enemy windups. Unlimited reserve ammunition remains. |

### Implementation and readability gate

The Foundry Warden now cycles a fan, a marked press and a shear lane; the Cryolab Matriarch cycles a fan, radial purge and coolant lance; the Core Overseer cycles a fan, cutting beam and marked reactor press. All three announce emergency cycling at 45% health, then attack every 2.45 seconds instead of 3 and summon reinforcements every 6 seconds instead of 8. Bosses resist ordinary stagger. A red crown ring, named HUD warnings and a two-note alarm carry the phase change through visual and audio channels. The existing major-windup budget still counts boss attacks as two threats.

The K-6 Scattergun interrupts a surviving non-boss target for 0.48 seconds on a hit within 5.5 m. The Longbow Railgun interrupts a surviving non-boss target for 0.68 seconds. Each affected target resists further stagger for 2.8 seconds; the lock is per target, so four players cannot indefinitely cancel one windup. Confirmed hits label STAGGER and emit a warm impact cue. This makes the weapon's base combat job visible without altering its damage or ammunition economy.

Three normal-wave cover variants per sector are chosen by the recorded run seed. The variant changes obstacles and firing lanes, not the boss's carefully authored geometry. Automated checks cover deterministic choice and separated, wall-clear four-person entries across all nine waves. A future room-manifest system will need navigation, line-of-sight and objective reachability validation beyond these fixed-grid checks. Human playtests remain necessary to judge gun feel, boss readability under a maximal four-player build, and whether Overtime creates a memorable squad decision.

The original premise and four pillars remain the production gate. The contractor sends maintenance crew into a sealed processing complex whose automation treats employees as raw material. Signs, equipment, machine behavior and short announcements convey that story. Tactile guns, visible adaptation, shared industrial danger and controlled escalation must all survive the next hands-on cooperative test.

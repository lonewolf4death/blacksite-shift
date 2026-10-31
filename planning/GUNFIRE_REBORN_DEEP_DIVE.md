# BLACKSITE SHIFT — Gunfire Reborn reference deep dive

Prepared October 31, 2026. This expands Section 3 of [PRODUCTION_PLAN.md](PRODUCTION_PLAN.md) and the short [reference-development entry](REFERENCE_DEVELOPMENT.md). I reviewed the developer's site, Steam store description and official update notes, and compared them with the current BLACKSITE SHIFT source. This is a source and design study, not a claim of hands-on testing. **Documented** denotes a fact in an official source; **inference** is my reading of its design effect; **proposal** is an original BLACKSITE system that is not in the executable unless marked implemented. All proposed numbers are tuning hypotheses, not Gunfire Reborn values.

## Sources and scope

| Official source | What it establishes | Relevance |
| --- | --- | --- |
| [Gunfire Reborn Steam page](https://store.steampowered.com/app/1217060/Gunfire_Reborn/) | Level-based FPS roguelite/RPG, random weapons and levels, distinct hero abilities, solo or four-player co-op, and a large item pool. | A class and weapon can both shape a run without either replacing shooting. |
| [Official Gunfire Reborn site](https://gfr.yijoys.com/en/) | Hero descriptions identify different combat rhythms; the roguelite section describes more than 40 weapons, inscriptions, more than 100 scrolls, multiple ascensions, handcrafted levels with randomized enemies and challenging vaults. | Authored rooms, hero identity and layered item systems can recombine. These are current site claims, not launch-day counts. |
| [Official March 2023 update notes](https://store.steampowered.com/news/posts/?appids=1217060&enddate=1680231692&feed=steam_community_announcements) | An optional mode lets players take extra scrolls while enemies gain corresponding scroll effects; elemental-conversion priority can be chosen. | Power is more interesting when the new enemy rule is declared and can be planned around. |
| [Official announcements and weapon update notes](https://steamcommunity.com/app/1217060/announcements/?l=english) | Later seasons revise weapon skills and exclusive inscriptions, add routes/vaults, and add named combinations of scroll components. | A base gun, alternate skill and modifier must retain a readable action plan. Seasonal systems should not be assumed to be present in the 2021 base release. |

The official site's hero section has grown well beyond the game's original roster. This document studies the *structure* of distinct heroes and build layers rather than asking BLACKSITE to match its current content count. I cannot verify encounter pacing, sound mixing or actual pick rates from official marketing descriptions alone; those require play sessions and telemetry.

## Core design reading

**Documented:** Gunfire Reborn presents heroes with different abilities, randomized weapons, scrolls, ascensions, inscriptions, authored level forms and co-op. The official site describes Crown Prince's trapping orb and elemental combination, Ao Bai's two-weapon/explosive specialty, Qing Yan's leap and close combat, Lei Luo's lightning-enhanced precision, Qian Sui's blocking close approach, and Nona's mecha with mobile or turret modes. **Inference:** the hero is not merely a stat package. A player's baseline ability suggests target selection, distance, cover use and timing even before a run's random rewards. Weapons then invite a second rhythm. Randomness works when it bends the player's plan and sometimes supplies a new one.

BLACKSITE's four maintenance suits already have identifiable jobs: Vanguard holds a lane and protects nearby crew; Breacher interrupts a dangerous close windup; Runner changes position and rate of fire; Medic restores a failing squad. Their cooldowns are long enough for timing to matter. Each starter gun has unlimited reserve ammo but a magazine and a separate cadence. The missing proof is observational: can a stranger recognize those jobs from one encounter, and can two players of the same class choose different useful actions by wave three?

## 1. Class identity must survive a weak draft

The hero descriptions on the official site connect a distinctive ability to a preferred way of fighting. A randomly selected weapon or scroll may amplify that way, but the first combat room must already make it visible. For BLACKSITE, test each class with no augments, no secondary gun and no talent:

| Suit | Starter action to test | Team information it should communicate | Failure signal |
| --- | --- | --- | --- |
| Vanguard | Step into a marked lane, activate Bulwark, protect a nearby operator. | “I can buy a six-second work window.” | Enemy targeting ignores the guard or the ally cannot tell why damage fell. |
| Breacher | Close through partial cover and spend Shockwave when a major windup starts. | “I can interrupt this attack, then we must use the opening.” | The skill is used off cooldown for damage alone or makes the shotgun's range irrelevant. |
| Runner | Dash to a flank, refill the Needler, unload Overclock and leave before a lock lands. | “I can change the angle and remove a priority threat.” | A speed boost only makes a number rise while positioning stays identical. |
| Medic | Hold a safe rescue line and decide whether Rally is best spent on heal, guard or a downed crew member. | “I can reverse one collapse, with a long recovery.” | Revive is automatic, invisible or always correct at any distance. |

These are BLACKSITE test scripts, not Gunfire Reborn mechanics. Record skill use, enemy interruption, saved ally health, reloads, rescue attempts, and a player's own description of why they pressed E. If a class only becomes recognizable after finding its signature augment, repair the base skill first. A class may carry any armory gun, but its team action must remain legible even when its weapon changes.

## 2. Three build layers, each with a separate question

**Documented:** Gunfire Reborn's official site differentiates heroes, ascensions, scrolls, weapons and inscriptions. **Inference:** these are compelling only when they answer different questions. BLACKSITE currently has suits, talents, augments, weapons and boss grafts. Without deliberate boundaries, every screen can become another way to say “more damage.” Use this ownership rule:

| BLACKSITE layer | Question answered | Good example | Reject if |
| --- | --- | --- | --- |
| Suit and starter | What can I contribute immediately? | Breacher cancels a machine-adjacent windup. | The power waits for a rare draft. |
| Talent branch | Which part of my class job will I specialize in? | Shockwave becomes a safer breach or a larger crowd opening. | Both branches are nearly identical percent boosts. |
| Weapon chassis | How do I aim and fire? | Rail line placement versus Needler tracking. | The projectile is a cosmetic skin for a shared DPS curve. |
| Weapon modifier | What tradeoff changes that chassis? | Faster ricochet recovery but reduced open-lane range. | A rarity tier is unconditionally superior. |
| General augment | What new conditional action earns value? | Bank a shot off a wall or reload near a threat. | It adds damage without an observable action. |
| Boss graft | What is my run's signature behavior? | Dash into impact or exchange a charged round for a pulse. | Other players cannot recognize it. |

Class-specific offers can make a draft feel personal, but they must not dominate all three choices. The current first-wave draft includes a signature, a build modifier and a basic upgrade. Keep that legibility. A safe generic card is valuable when a player has no matching weapon, but a draft that offers three generic percentages is a missed run identity. Show exact prerequisites and effect order on cards; current field manual is the baseline audit location.

## 3. Build paths should describe verbs, not only elements

The official hero and roguelite descriptions support different playstyles such as precision, sustained fire and elemental combination. Later official notes show weapon skills and inscriptions being revised, including a dart weapon that marks an enemy, gathers resources and commands existing darts toward selected targets. **Inference:** a strong upgrade changes the sequence of actions: tag, reposition, cash out; hold a line, then detonate; trigger a control window, then exploit it. The number on the card is only part of the change.

Three original BLACKSITE prototype paths:

1. **Contain / cut.** Frost slows a marked Survey Marksman or Rammer. The Breacher uses Shockwave to cancel its next windup; a teammate times a penetrating rail shot down the held lane. A talent that merely adds frost damage is less interesting than one that converts the interrupt into a 2-second marked corridor visible to the crew. Proposed cap: one corridor per Shockwave, no repeated boss stagger during its resistance lock.
2. **Charge / vent.** A hypothetical industrial heat weapon gains control at high heat but must vent. Runner can use Overclock to enter that high-heat band quickly; an augment can make the vent a short defensive screen. The player decides when to push and where to cool. Unlimited reserve ammo remains. This is a proposal, not current content.
3. **Tag / redirect.** A future Survey Harpoon variant marks one target for 4 seconds. A second hit on that target refunds part of a reload, while a hit on a different target transfers the mark and forfeits the refund. The player chooses focus fire or control. It must not create automatic homing that hides aim skill.

Each path should have a counterexample encounter where its preferred action is risky. Frost control should not make every boss harmless. A high-heat vent should be awkward during a moving machine strike. Focus fire should be challenged by sappers or spread gunners. This is how a build changes *what players do* while preserving manual aim.

## 4. Weapon inscriptions suggest constrained variants

**Documented:** the official site advertises numerous weapons and inscriptions, and official update notes alter exclusive inscriptions alongside base weapon skills. **Inference:** modifiers are most useful when the player can still recognize the underlying gun. BLACKSITE's twelve physical projectile weapons already have different range, cadence, travel speed, spread, reload and effect. A first variant experiment should cover four existing guns before scaling to the whole armory.

| Proposed original variant | Chassis | Changed firing decision | Cost | Display requirement |
| --- | --- | --- | --- | --- |
| **Survey Thread** | M-24 Carbine | First wall rebound reveals the struck enemy for 3 s to the crew. | A direct first hit has 12% less damage. | Show rebound count and reveal duration. |
| **Capacitor Drum** | Tesla Spindle | Hold fire for a 0.7 s charge to send a stronger first chain. | No chain on uncharged shots; standard fire remains useful direct damage. | Charge indicator and exact chain target cap. |
| **Wide Gate** | P-12 Pulse Rifle | Broad bolts can screen a machine lane and briefly interrupt weak projectiles. | 20% slower projectile travel. | Show which threats can be intercepted. |
| **Extraction Hook** | Survey Harpoon | Recast within 2 s pulls an already marked light enemy toward a legal floor point. | Second cast consumes the opportunity for a damage bonus. | Mark and recast timer on target. |

These are not implemented. The first benchmark is whether a player can describe a different firing pattern after picking a variant without reading its name again. Every source of damage must be credited to the owning player, including delayed chains. The server must validate charge duration, target identity, projectile state and legal pull destinations. Cosmetic prediction can show a line, but never decide hits or pulls locally. If four players bring chain/ricochet variants together, effect and audio caps still apply.

## 5. Authored rooms plus recombination

The official site calls Gunfire's levels handcrafted with randomized enemies and vaults. **Inference:** meaningful variation comes from the relationship among room shape, enemy order, route and reward, not a new mesh color alone. BLACKSITE has three sector themes, five authored cover layouts per sector, seeded enemy orders, three machine station patterns and fixed boss arenas. It is a useful prototype basis, but a long-term run needs stronger room topology changes: elevation, partial walls, machinery footprints, cross-lanes and alternate extraction routes.

Build every future room from a **geometry contract**:

- Valid player, enemy and machine spawns have a clear radius, headroom and a reachable path to at least two combat lanes. Validate after all props and height changes are placed.
- A low wall has a collision height, visual silhouette and fire behavior that agree. A bullet may pass above it from an upper platform; enemy line of sight uses the same height model.
- Every room has a safe but costly operator position, an aggressive faster position and at least one retreat path. A single hard machine can be strongly exposed; three easy machines distribute risk.
- Threat roles are authored in compatible sets. Sniper plus shield encourages lateral movement; sapper plus machine operator creates rescue pressure; rammer plus half wall tests vertical navigation.
- Seeded choices generate a manifest that can be replayed in a bug report. A room ID, enemy set, station pattern and spawn points are recorded together.

The user previously reported a player spawning in a wall at a stage transition. Current stage entry chooses validated open cells and resets client prediction on a new wave. Every new height or protrusion must be added to the same validation, not merely rendered. Room novelty is a liability if it reintroduces that bug.

## 6. Optional danger should declare its exchange

Official March 2023 notes describe a mode where extra scrolls also grant enemies corresponding effects. **Inference:** the player receives a precise bargain, and the power increase can change target selection. BLACKSITE's signature bargain is Overtime at designated machinery. Keep it relevant: show hazard and reward before vote, apply it to the whole squad for one encounter, require a majority, and keep the safer route on a tie. The host cannot override it during combat.

For later **proposed** Overtime cards, describe both the spatial problem and the payout:

| Condition | Declared hazard | Declared reward | Interesting decision |
| --- | --- | --- | --- |
| **Backfeed** | One marked conveyor changes direction twice during the encounter and emits a 1.0 s warned sweep. | Each survivor receives a choice of one weapon modifier from two. | Can the team work around changing space to pursue a weapon plan? |
| **Open Furnace** | A 2.5 m heat strip remains active while a two-station machine is calibrated. | The next boss graft offer contains one additional candidate. | Is a stronger late build worth a dangerous current work order? |
| **Audit Sweep** | A Survey Marksman enters at a published reinforcement time with a visible lane callout. | Complete the encounter's work order for one extra sector credit. | Does the squad have a safe way to handle the predictable long lane? |

Values are prototypes. Never hide a second enemy perk on the card. A no-vote timeout remains stable, and disconnected players are removed from the current vote denominator under an explicit server rule. If Overtime always wins because the reward is too large, reduce reward or increase the legible risk. If it stalls the service window with no discussion, simplify the choices before content expansion.

## 7. Co-op rules for a dense item game

Gunfire is documented as four-player co-op, but its store page does not specify every loot and menu rule. BLACKSITE must define its own. Current drafts and graft offers are personal; the shared salvage quota earns each player a reroll; Overtime is a squad vote. The server must settle each choice once, with draft tokens so an old card cannot be selected after a reroll. A disconnected player retains their reserved run state during the reconnect window. A dead player should have an explicit reward eligibility rule, shown before a vote, rather than discovering a vanished reward at the next service bay.

Future shared equipment should use one of three visible policies: *personal copy to each player*, *squad vote on a single installation*, or *allocated by a published role/round-robin rule*. Avoid “first player who clicks gets it” during combat. Service menus cannot pause a live four-person encounter; draft selection belongs after the room clears. When a player departs during a vote, recompute the eligible count and broadcast the new threshold. When the host departs, transfer control without changing ballots. The outcome and payout should be in the incident log for later diagnosis.

## 8. Audio and visual identity in BLACKSITE's world

Gunfire's style is its own. BLACKSITE's industrial premise should translate the *clarity* of hero and weapon roles into a grimmer material language: different suit tool silhouettes, distinct mechanical actuation for each skill, and weapon shots that sound like separate devices. Vanguard can have a heavy relay clamp and low guard hum; Breacher a compressed-air diaphragm and impact tail; Runner a motor overspeed whine; Medic a defibrillator pulse and a soft crew confirmation. These are proposed sound-direction cues, not shipped assets. All must remain audible under four guns and machinery without becoming horror stings.

Use color as a secondary cue. Metal plate shape, projected footprint, timing sound and text icon must still identify a warning when color or flashing is reduced. An ally's gunfire can be dimmed locally, but enemy projectiles and telegraphs cannot follow that setting. The current executable adds **Ally Projectile Visibility** from 25–100%, default 65%; it changes only rendering of other players' projectiles. Server hits, local shots, hostile projectiles and danger warnings are unchanged. This draws from the general readability lesson, not from a copied Gunfire feature.

## 9. Test matrix and release gate

Run a three-wave solo and four-player session with fixed seeds and collect:

| Test | Measure | Pass target for prototype |
| --- | --- | --- |
| Bare class role | Teammates identify each suit's job after a single fight without card names. | At least 3 of 4 correct per observed crew. |
| Starter weapons | Blind identification from cadence, recoil, sound and hit behavior. | At least 3 of 4 starters identified by most testers. |
| Build divergence | Two same-class players state and demonstrate different choices. | Both describe an action difference by wave three. |
| Choice cadence | Time from cleared encounter to locked personal draft, including reroll. | No player remains forced into a menu after departure; median decision under 20 s after familiarity. |
| Room variation | Repeat three seeds through all stage transitions. | No spawn in collision, unreachable enemy or machine station. |
| Overtime | Record presented hazard, ballot, result, payoff and later player recall. | Crew can explain why it chose stable or Overtime; ties remain stable. |
| Maximal effects | Four distinct late builds plus sniper, boss and machinery strike. | All dangerous attacks identified before impact by each tested player. |

These are gates, not claims of existing playtest results. Automated tests can verify deterministic offers, spawn clearance, vote math, exact cooldowns and damage ownership. They cannot certify that a gun feels good or that a warning is visible amid real co-op spectacle. Do not grow the item pool to match Gunfire's count until the four-player visibility and action-change tests pass.

## Six constraints and the premise

The analysis supports the six standing constraints: base guns need unique handling before augments; a build must change a verb; industrial atmosphere comes from matter, space, sound and use; co-op loot, menus, death and departures need published rules; dangerous attacks must survive the strongest combined effects; authored rooms can be recombined by seed. BLACKSITE remains the story of a contractor sending maintenance crews into a sealed processing complex whose automation treats employees as raw material. Work signs, equipment text, machine behavior and short announcements carry the story. Overtime remains the recurring optional hazard/reward decision and must be proven alongside shooting before adding more content layers.

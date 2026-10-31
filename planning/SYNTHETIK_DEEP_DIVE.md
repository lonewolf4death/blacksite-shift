# BLACKSITE SHIFT — SYNTHETIK: Legion Rising reference deep dive

Prepared October 31, 2026. This expands Section 3 of [PRODUCTION_PLAN.md](PRODUCTION_PLAN.md) and the shorter entry in [REFERENCE_DEVELOPMENT.md](REFERENCE_DEVELOPMENT.md). The subject is **SYNTHETIK: Legion Rising**, the original top-down game, not SYNTHETIK 2 or Arena. I reviewed official Flow Fire Games pages, the official Steam description and developer update notes, then compared them with the current BLACKSITE SHIFT source. I did not play or instrument SYNTHETIK for this pass. **Documented** means the linked official source says it, **inference** is design analysis, and **proposal** means a BLACKSITE feature not implemented unless explicitly marked otherwise. Values assigned to BLACKSITE below are prototype targets, not reverse engineered SYNTHETIK values.

## Sources and version cautions

| Official source | Documented evidence | Question for BLACKSITE SHIFT |
| --- | --- | --- |
| [SYNTHETIK: Legion Rising store page](https://store.steampowered.com/app/528230/SYNTHETIK_Legion_Rising/) | Top-down tactical roguelite; two-player online co-op; magazine ejection, active reload, jams, overheat, movement-based recoil, ammo choices, eight specializations, gadgets and modular difficulty. | Which handling actions make a gun satisfying in first person without making the player manage scarce ammo? |
| [Flow Fire weapon systems page](https://www.synthetikgame.com/weapons) | Eject and reload are separate; active reload can speed the action and empower later shots; ammo types, heat, jams, variants, attachments and class weapon bonuses all change handling. The developers say every weapon should feel purposeful. | What should be part of a gun's base identity, its variant and its later build? |
| [Flow Fire items page](https://www.synthetikgame.com/items) | Active items include traps, explosives, turrets and other tools; item power can be invested in, and unwanted items can be recycled for credits. | How can a non-gun tool change combat decisions and still fit the crew's work role? |
| [Flow Fire Legion Rising expansion notes](https://www.synthetikgame.com/legion-rising) | The class roster split into specializations; weapon stat upgrades were reduced from three per stat to two stronger steps so each purchase mattered more and progress was easier to track. | Where does more complexity become harder to read than it is to enjoy? |
| [Developer Update 27, October 2026](https://steamcommunity.com/app/528230/allnews/) | The team revised tooltips and effect correctness across many weapons/items/perks; fixed co-op ownership, attribution and interaction issues, reload UI visibility, spawn and camera transitions, and several stability problems. | Can players trust exact descriptions and settled multiplayer results? |
| [Developer Update 27.2](https://steamcommunity.com/app/528230/) | Co-op kill/damage totals and damage-over-time attribution were corrected, as were explosions that could hit twice. | Do our trackers credit the player whose build created a delayed or area effect? |

The evergreen Flow Fire weapon page appears to describe an earlier upgrade structure: it says three stat upgrades, while the developer's later expansion notes say that became two. The design lesson is the *direction* of the change, not a timeless count. The 2026 update notes also show how descriptions and effects can drift over years of added content. BLACKSITE should keep card text generated or checked against the authoritative game rules wherever practical.

## The distinctive contribution: operating a gun is gameplay

**Documented:** SYNTHETIK asks players to manage ejection, reload timing, movement-dependent accuracy, heat and occasional jams. The official weapon page frames this as a learned physical rhythm, while the store page pairs it with many item/build options. **Inference:** a weapon can be compelling before any perk because firing it asks the player to control a process. The tension is not only damage per second; it is when to stop moving, when to fire a shorter burst, when to change magazines or weapon, and whether to accept a riskier tempo. A system that supplies only random stoppages, though, can make the player resent the gun rather than master it.

BLACKSITE SHIFT's contract is different. The user explicitly wants **unlimited reserve ammo**. The game is first person, faster, and supports four players, not SYNTHETIK's two-player top-down co-op. Keep magazines, reload timing and weapon-specific recoil because they create cadence. Avoid a universal ejection key, ammo waste and random jams as default obligations. The reference is a reason to test which handling actions are satisfying; it is not a mandate to copy all controls.

## 1. Base weapon identity comes from a handling loop

The Flow Fire weapon page says it aims for weapons that each feel good and have a purpose. **Inference:** each gun needs a short sentence describing what the player *does* with it, before a variant or augment modifies it. BLACKSITE's current twelve guns already have physical differences: carbine bank shots, scattergun pellets and stagger, poison needles, broad piercing pulse bolts, rail penetration, mortar blast, electrical chain, frost slow, ricochet discs, critical burst, harpoon pull/mark and gravity grouping. The remaining work is to make those differences legible through the hands, sight, sound and target.

Use a six-part handling audit:

| Moment | What must be readable | BLACKSITE check |
| --- | --- | --- |
| Trigger pull | Immediate report, muzzle signature, recoil start. | A starter gun is identified without its UI name. |
| Mid-burst | Bloom, sight return, cyclic motion, shot spacing. | A deliberate burst controls misses; walking does not make the weapon useless. |
| Projectile travel | Speed, diameter, penetration, bounce or blast path. | The visible shot predicts the server hit rule. |
| Impact | Surface response, armor result, stagger or reaction. | A player understands why a hit mattered or failed. |
| Magazine end | Distinct empty/low-mag cue, reload length and vulnerability. | Unlimited reserve still has a tactical cadence. |
| Ready state | Bolt/receiver settles and a sound indicates shooting can resume. | The player's action matches server readiness, without a premature click. |

The existing 3D viewmodel cycles receiver parts and uses family-specific muzzle flashes; the client gives weapon-specific shot audio and recoil. This pass adds a **near-reticle precision-reload cue** that shows the approach, active timing window and ordinary reload after a missed press. The bottom-right ammo readout remains. It does not alter the server's 55–75% timing window, reload duration, damage bonus or unlimited reserve. The point is to let players keep eyes on enemies while practicing the rhythm.

**Blind test:** remove weapon names and augments, then have players fire the four starters in a fixed bay with a moving target, a close rusher and one low wall. Ask them to identify each gun by handling/sound and state the distance and burst length they prefer. Record actual hit rate while stationary, strafing and recovering from a slide. If every gun becomes accurate only while standing still, the reference has been applied too literally for BLACKSITE's movement pillar.

## 2. Manual reload should be a voluntary mastery layer

**Documented:** SYNTHETIK separates eject and reload, discards rounds in the removed magazine, and rewards a well-timed second reload input. Its jams are cleared by repeated reload input and refill the magazine. These exact consequences are coherent inside its ammo economy. They would conflict with BLACKSITE's unlimited reserve and its class-skill control mapping. **Inference:** the transferable part is the *risk/reward timing*, not the resource loss or key count.

BLACKSITE's current rule is simple and explicit: press R to reload; press it again during the highlighted 55–75% interval to complete in about 0.12 s and charge the next shot for 20% more damage. An early or late second press consumes that attempt but the normal reload completes. Siphon Halo converts the reward to a nearby pulse and skill recovery. The player never loses the ability to reload because a random jam occurred. This is already a stronger fit for a first-person four-player firefight.

The feedback needs to make four states unambiguous: reload started, window approaching, successful precision press, and missed press. Use different sound contours and one text cue; avoid filling the center with a large rhythm UI during a sniper lock. The new near-reticle cue is small and non-interactive. It appears only during live combat reloads, and its ready state is amber; dangerous enemy warnings retain their separate color, position and priority. Reduced Flashing Lights does not remove the text.

**Proposal: accessibility tuning after tests.** A wider timing window can be an optional assisted mode, but it must be governed by a public lobby or difficulty rule if it changes combat power in co-op. An alternate approach is a visually clearer cue with the same window, which this pass implements first. Do not add a hidden per-client timing advantage that the server cannot validate. If players ignore precision reload because ordinary reload is already fast, that is acceptable; the mastery layer should remain optional. If players feel compelled to hit it on every magazine to survive, reduce its reward or revisit baseline reload length.

## 3. Movement-sensitive control should reward decisions, not punish motion

**Documented:** Flow Fire says accuracy responds to stop-and-go movement and trigger control, and the Steam page describes movement-based recoil. **Inference:** movement becomes part of aiming skill when players can choose a short stable firing moment, then move again. In first person this can be communicated through reticle gap, weapon motion, recoil return and the trace of missed projectiles. But BLACKSITE's movement is a named pillar: sprinting, sliding, dashing and quick lane changes must feel good. A flat large spread penalty for movement would undermine the Runner and make machinery encounters static.

Current BLACKSITE client reticle gap increases with planar speed and recoil; server projectile fire has weapon spread. The next tune should compare *controlled movement* with *uncontrolled automatic fire*, not stationary versus mobile damage alone. A mobile player should still land deliberate close shots. A railgun may favor a brief settled shot, while a needler should keep useful pressure during a flank. The scattergun should lose pellets at range, not have an arbitrary motion penalty so severe that its close approach becomes awkward.

Proposed test matrix: four starter guns × stationary, strafe, slide exit, dash exit × near/mid/far target. Record first-shot accuracy, 1-second burst accuracy, time to recover the reticle and whether players feel safe changing lanes. A tuning change passes only if it creates a recognizable best firing rhythm for each gun *and* players continue moving when enemies demand it. Audio and camera shake settings must not affect server accuracy.

## 4. Heat and jams are optional weapon identities, not global tax

**Documented:** in SYNTHETIK heat can reduce fire rate and threaten shield/health, while jams temporarily block firing until cleared. These systems add tension, but they are also extra state and input burden. **Inference:** in BLACKSITE, heat is more promising as the signature of one deliberate weapon than as a global rule. A player should knowingly choose a hot weapon for a different tactical plan, not discover that every firearm randomly refuses to work in a boss phase.

**Proposal: THERMAL BORER weapon experiment.** A short-to-mid-range industrial cutter fires a sustained 0.12 s pulse for 13 base damage, pierces one ordinary target and builds 12 heat per shot on a 100-point gauge. Heat falls 24 points per second while not firing; over 80 heat, bolts widen from 0.10 m to 0.16 m and inflict a brief 15% slow on machinery-tagged enemies. At 100 heat, the weapon enters a fixed 1.2 s vent cycle. The vent produces an audible hiss and a short cone of harmless vapor; it does **not** damage the player, silently disable the class skill or consume reserve ammo. A precision reload vents 30 heat and can deliberately reset the cycle. This is a proposed first-pass prototype, not implemented content or a claim about SYNTHETIK's numbers.

Its action plan is clear: use short bursts to maintain control, deliberately push into the high-heat slow window when the crew needs a machine target held, then switch weapons or vent. An augment might move the slow threshold lower while reducing direct damage; another might turn the vent into a friendly visibility screen but lengthen recovery. Each variant changes firing decisions. If the gauge adds monitoring without interesting choices, cut the weapon experiment. Random jams are not needed to make the Borer tactical.

## 5. Variants are tradeoffs layered on a trustworthy chassis

**Documented:** Flow Fire describes weapon variants that change cadence, magazine size, movement, heat, damage or special effects. The examples include slower/harder-hitting, larger/heavier, more rapid/hotter and self-risking variants. **Inference:** the valuable feature is a recognizable weapon transformed by a *named tradeoff*. An always-better rarity prefix is less interesting than a version that asks the player to use the same gun differently.

BLACKSITE has armory choices but no broad per-drop weapon variant system. Do not jump straight to twenty modifiers on twelve guns. First author three orthogonal, original variant families and test them on four weapons:

| Original variant concept | Mechanical change | New action | Required downside |
| --- | --- | --- | --- |
| **Counterweight** | Recoil recovery 25% faster and magazine +20%. | Hold a lane for longer bursts. | 12% slower aim movement while firing; does not slow out-of-combat travel. |
| **Hotline** | First three shots after a dash gain 15% projectile speed and a tighter spread. | Dash into a firing angle, then commit quickly. | Reload takes 20% longer; cannot chain its own speed bonus. |
| **Survey Bore** | First round after precision reload pierces one additional target. | Align enemies before spending the charged round. | Magazine holds 20% fewer shots, rounded with a stated floor. |

These are **proposals**. Each card should show the base weapon alongside the altered values and a sentence about playstyle. Variant IDs must be part of the server-owned run seed and reconnect state. A player who switches to a secondary should know whether its variant is active. A dropped or replaced weapon cannot duplicate a bonus by re-equipping. If a variant makes a baseline gun feel unusable, its tradeoff is too harsh or its upside too obscure.

The Flow Fire expansion notes reduce upgrade steps and increase their impact specifically to make planning and tracking easier. BLACKSITE should follow that reasoning, not the exact count: fewer visible, meaningful decisions can beat a long chain of tiny stat ticks. Personal augments and grafts already provide growth. A variant system should complement them rather than bury the player under four separate upgrade menus.

## 6. Active tools make a build change tactics

The official items page lists grenades, traps, turrets, explosives, gliders and other tools, plus item-power upgrades and recycling. **Inference:** an item matters when it changes where the player stands, what they watch, or when they commit. A turret can cover a lane while a teammate calibrates a machine. A mine can protect a retreat route. A flare can reveal an incoming threat or improve visibility. Simply adding another automatic damage pulse risks making the game play itself.

BLACKSITE's four class skills and five grafts already occupy some of this space. Add active gear carefully and give it a distinct job. Candidate **proposals**:

- **Circuit Beacon:** place one 6-second beacon at a legal floor point within 12 m. It highlights the next machine strike footprint for the crew and attracts a limited subset of ordinary enemies. Cooldown 24 s. The player chooses a lure location; the beacon cannot move bosses or override a locked windup.
- **Field Clamp:** at a machine station, shorten the operator's next calibration hold by 0.5 s but lengthen that station's next cooldown by 5 s. One charge per encounter. It helps during a dangerous entry but carries a later cost.
- **Cutting Wedge:** place a single physical half-cover wedge for 10 s in a validated open cell. It blocks low hostile projectiles and low friendly projectiles equally. It cannot appear inside a player, enemy, machine or spawn route.

These tools are ways to test shared industrial danger. Keep the utility slot separate from primary/secondary weapons; a player should not have to discard a gun just to bring a work tool. Co-op ownership and server placement validation are essential. If a tool makes Overtime trivial, its interaction must be capped or the hazard redesigned rather than silently disabling the tool.

## 7. Class specialization should deepen an action, not merely add percentages

**Documented:** the developer expansion split classes into specializations with different benefits and new perks. The current official store names eight specializations. **Inference:** specialization is useful when a player can predict a teammate's role from their gear and behavior. It is less useful if two branches only differ by small damage percentages hidden in a menu.

BLACKSITE currently has Vanguard, Breacher, Runner and Medic, each with a starting gun, a long-cooldown active skill and a three-branch talent tree. A class should be identifiable before its first augment: Vanguard holds a threatened lane under Bulwark, Breacher interrupts and creates space, Runner changes tempo and angle, Medic rescues a collapse. Future specializations can be **one branch-defining choice per class**, not eight new character screens. Example proposals: Vanguard chooses stronger personal guard *or* a narrower shared guard that moves with the operator; Breacher chooses a larger displacement *or* a shorter, more reliable anti-windup pulse; Runner chooses maximum burst speed *or* a marked route that returns them safely to crew; Medic chooses immediate rescue *or* a slower preventative field. The tradeoff must be visible on character select and in the field manual.

Do not reduce a class to its weapon category. Armory choices should let a Medic carry a railgun or a Runner carry a disc without erasing their support or tempo role. Test an unmodified starter encounter and a late-build encounter; both should let teammates infer who can hold, interrupt, flank and rescue.

## 8. Co-op attribution, ownership and exact descriptions are production systems

The original is designed for two-player co-op with tradeable gear and friendly fire. BLACKSITE is four-player with personal drafts and no universal friendly-fire rule. The direct transferable lesson is **explicit ownership**: who owns an item, who triggered a damage event, who may operate a machine, and who receives the result. The October 2026 notes show real maintenance work on co-op state, tooltip accuracy, spawn/camera transitions and statistics. Update 27.2 specifically corrects per-player kills/damage and delayed-effect attribution. Those are not BLACKSITE bugs, but they identify failure cases we should test.

Current BLACKSITE server credits projectile and elemental damage through the owning player and sends damage totals, kills, DPS and accuracy. Machine kills have an operator owner. The audit should include poison/fire detonation, chain lightning, gravity blast, boss graft effects, machine strikes and the shared harpoon mark. A teammate consuming a mark should receive credit for their damage, while the marker can receive an assist statistic later. One explosion must not deal direct, expiry and cleanup damage to the same target unless the card explicitly describes those separate hits.

For every effect description, verify these fields against implementation: trigger, duration, radius/range, stacking rule, cooldown, damage, interaction with armor/cover, and ownership. Update 27's many tooltip fixes show why prose can drift. BLACKSITE's field manual already gives numerical details for twelve weapons and many upgrades; the next quality gate is to make automated consistency checks for values that appear in both authoritative rules and human-facing strings. The cards should state what the *current build* does after talents and variants, not only base values, when practical.

The machine operator rule remains one server-authoritative holder. A disconnect, death or exit releases it. Personal menus remain personal, and Overtime remains a post-encounter squad vote. A two-two tie stays on stable. SYNTHETIK's optional difficulty modifiers support the idea of labeled advanced modes, but they do not justify a host silently applying a dangerous modifier during active combat.

## 9. Visual and audio treatment: physical feedback before spectacle

**Inference from the official handling description:** satisfying gun operation depends on contact sounds and precise timing as much as on bright effects. In BLACKSITE's grim processing facility, a carbine should have a dry metallic bolt and sharp room reflection; a scattergun should have a heavy chamber action; a pulse rifle can use a low capacitor whine; a railgun should announce charge and release. The reload cue must follow the actual server window closely enough that the player can trust it. The sound of an enemy windup and machine warning must remain above friendly gun tails in the mix.

The industrial look should come from proportions and use: thick service doors, grime where machinery leaks, scarred floor lanes, cable runs, numbered control panels, warning lamps tied to a real hazard, and pressure lines that lead somewhere. Add visible state changes when a station cycles or jams; do not merely overlay grain and darkness. Black oil impacts can support tone, but must not obscure a target for several seconds. The 2026 developer notes include FX/performance and audio cleanup issues, reinforcing the need for bounded effect lifetime and reliable teardown.

## Concrete prototype: the recoil and reload gallery

This is a **proposed playtest room**, not new content in this pass. Use a fixed Foundry bay with one 8 m lane, one 17 m lane, a half-wall, two moving ordinary targets, a single sapper warning and a safe machine station. Each player uses one starter weapon with no upgrades for the first pass. The server records shot times, ammo, accuracy, reload start, precision attempt, success, target range and whether the player moved or slid at the shot. The client records no secret accuracy modifier. Run the same gallery with one variant proposal and one reaction build only after the baseline test.

Ask players to identify a gun by sound and receiver motion; choose a burst length; perform one voluntary precision reload; avoid the sapper mark while reloading; and tell a teammate when a machine is safe to operate. Record whether the near-reticle cue helped without obscuring the sapper warning. If players can only complete the gallery by standing still or hitting every precision reload, the implementation conflicts with BLACKSITE's movement and accessible baseline goals. If the variant changes only damage dealt but no action, redesign it.

## Current state and prioritized work

| Priority | Action | Acceptance |
| --- | --- | --- |
| Implemented in this pass | Near-reticle precision-reload cue with approach, window and missed-attempt states. | It mirrors server state and does not hide enemy warnings or alter ammo rules. |
| Now | Blind test the four starters without upgrades. | Players identify cadence, recoil, reload and useful range without seeing names. |
| Now | Audit damage ownership for delayed, chained and machine damage. | Four-player trackers credit the correct player once for every legal damage event. |
| Next | Tune movement versus trigger control by weapon. | Controlled bursts reward skill while sliding and dashing remain useful. |
| Next | Prototype one named variant and one active work tool. | Each changes a combat decision, states its downside, and survives reconnect/transition. |
| Later | Test a single heat-driven gun, without global jams. | Heat produces an intentional burst/vent decision rather than a constant tax. |

SYNTHETIK's durable lesson is that handling can be deep *before* upgrades. BLACKSITE SHIFT keeps its own four pillars: tactile base guns, visible adaptation that changes action, shared industrial danger through machines and Overtime, and controlled escalation that remains readable with four players. The contractor's sealed processing facility, its signs and announcements, and the squad's one-encounter Overtime vote remain the game's identity. Every handling mechanic should serve those goals and respect the user's unlimited-ammo requirement.

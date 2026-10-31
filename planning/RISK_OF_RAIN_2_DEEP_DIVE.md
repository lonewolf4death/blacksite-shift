# BLACKSITE SHIFT — Risk of Rain 2 reference deep dive

Prepared October 30, 2026. This expands the Risk of Rain 2 entry in [PRODUCTION_PLAN.md](PRODUCTION_PLAN.md) and [REFERENCE_DEVELOPMENT.md](REFERENCE_DEVELOPMENT.md). It studies the **second game**, separately from the 2013 original and Risk of Rain Returns, through official store, developer and publisher materials and an audit of BLACKSITE SHIFT's current source. I did not play or instrument Risk of Rain 2 for this pass. **Documented** means an official source states it, **inference** is design interpretation, and **proposal** is BLACKSITE SHIFT work not implemented unless explicitly marked otherwise. Modern patch notes include expansion content; I use those as evidence about design and failure modes, not as claims about what shipped in the 2020 base game.

## Sources and what they establish

| Official source | Documented evidence | Production question |
| --- | --- | --- |
| [Risk of Rain 2 store page](https://store.steampowered.com/app/632360/Risk_of_Rain_2/) | Handcrafted locales, randomized stages/enemies/items, item combinations, distinct survivors, alternate skills, artifacts, final boss or continued run, and up to four-player online co-op. | How do designed spaces and randomized systems create new runs without unsafe geometry? |
| [Hopoo Games Development Thoughts #16](https://store.steampowered.com/news/posts/?appids=632360&enddate=1608046072&feed=steam_community_announcements) | The developers distinguish micro agency (aiming, dodging, abilities) from macro agency (build and progression choices); 1.0 adjusted items and added a Scrapper to increase macro agency. They avoided filling the standard pool with too many synergy-dependent items. | How can randomness preserve player choice and a readable draft pool? |
| [Hopoo Games Development Thoughts #13](https://store.steampowered.com/news/posts/?appids=632360&enddate=1596556573&feed=steam_community_announcements) | Artifact modifiers are explicitly treated as an optional rules-changing mode that need not share the normal run's balance. | Where should BLACKSITE place advanced, run-wide Overtime rules? |
| [Risk of Rain 2 item and elite overhaul notes](https://store.steampowered.com/news/posts/?appids=632360&enddate=1733855235&feed=steam_community_announcements) | Later developers state goals to make items more transformational, improve synergies, strengthen weak picks, rebalance movement/defense/damage and give elites clearer counterplay. | When does a large item pool stop producing meaningful decisions? |
| [2K October 2026 patch notes](https://support.2k.com/hc/en-us/articles/56193476123795-Risk-of-Rain-2-Patch-Notes-October-8-2026) | Fixes address infinite proc chains, double projectile damage, wall and underground spawn nodes, projectile collision, multiplayer objective/ping issues, telegraph geometry, and looping sound cleanup. | What breaks when authored stages meet combinatorial builds and networked effects? |
| [2K Alloyed Collective notes](https://support.2k.com/hc/en-us/articles/46614659423891-Risk-of-Rain-2-Alloyed-Collective-and-Patch-Notes-November-18-2025) | An expansion adds survivors, enemies, drones, items and stages. A free update lets dead co-op players operate an ally drone until revival at stage transition; a very strong drone-item synergy was reduced because it could make wins automatic. | How can death, companions and scaling preserve participation without letting automation play the game? |

The store's exact count of stages, items or survivors changes with updates and DLC. This analysis uses categories and relationships rather than treating a marketing count as a target. BLACKSITE SHIFT is first person, more enclosed, and centers machinery and an Overtime vote. It should not reproduce Risk of Rain 2's aliens, teleporter, item names, stage geometry or art.

## 1. Authored locales, recombined runs

**Documented:** the store page describes handcrafted locales while stages, enemies and items vary between runs. **Inference:** the replayability comes from carefully designed pieces under changing conditions. A meaningful stage has known routes, vertical opportunities, sightline breaks, enemy entry space and a landmark. Randomness decides which set of threats and rewards asks the player to use that geometry, not whether a wall can accidentally trap the squad.

BLACKSITE SHIFT now has five cover layouts per sector, raised walkable equipment decks, half walls, three different machine-calibration modes, six encounter orders, seeded selection and stable boss arenas. A run seed helps reproduce the selection. The new wave-entry line in this pass names the selected bay and its station count/mode, making the recombination visible to the crew before they commit to a route. This is a small communication improvement, not a claim that the current arenas have the spatial depth of a full handcrafted stage.

An authored bay should be stored as a *design contract* with at least these facts:

| Bay metadata | Required purpose |
| --- | --- |
| Crew entry anchors | Four legal positions with capsule clearance, legal floor height and an immediate movement exit. |
| Enemy entry anchors | Legal for the intended enemy body; outside a short unfair-spawn radius; visible or audible before attack. |
| Traversal graph | Which ramps, decks, low-wall crossings and floor lanes connect; a route back from every optional pocket. |
| Fire lanes | Where projectiles may hit, where full walls block them, and what half walls can be shot over. |
| Major telegraph footprints | Sufficient escape space for boss, sapper, welder, purger and machinery warnings. |
| Machine stations | Operator approach, cover assignment, control sightline, strike footprint and cooldown state. |
| Landmark and material language | The player can describe the room without reading a minimap; its industrial purpose is visible. |

The procedural selector may rotate or choose authored kits, but it cannot invalidate their contracts. The 2026 official patch notes include duplicated, floating, underground and wall spawn-node fixes. That is a concrete warning from a much larger game: art and geometry changes can silently break navigation. BLACKSITE's prior wall-spawn issue means validation is a first-class content tool. Every seed/variant must be checked for crew spawn clearance, enemy clearance, reachable machine and legal transition position. A generated combination that fails validation should choose a safe fallback kit and log its seed, not try to force the spawn.

### Geometry should change decisions, not only the look

Proposed functional bay family for one sector:

1. **Intake apron:** long horizontal lane, low cover, a central machine. A marksman pressures the operator's sightline; flanking is a short committed run.
2. **Cross-feed gallery:** raised service deck above the floor machine, two routes down, one partial wall. The team chooses height for damage or floor access for calibration.
3. **Filter labyrinth:** short sightlines, two loops around a core, audible but temporarily unseen entries. The squad must maintain contact and use pings.
4. **Conveyor split:** an active belt divides the room, with two crossing points. An Overtime condition keeps one crossing hazardous, changing the preferred route.
5. **Evidence cage:** a small visible side pocket contains an optional recoverable. A crew member can cross a marked lane while another covers; the pocket has a return route.

These are **proposals** for further geometry, not descriptions of current layouts. Different height and cover should change who holds a lane, who operates, what a piercing gun can align, and where a boss warning can be escaped. Each bay still needs the same safe four-player rules. A variant that only recolors walls does not earn its place in the seed pool.

## 2. Micro agency and macro agency must meet

**Documented:** Hopoo's Development Thoughts #16 explicitly separates micro choices, such as hitting shots and dodging, from macro choices, such as build and pace. The developers said macro agency needed work and used item revisions and an interactable to improve it. **Inference:** a shooter can feel excellent moment to moment and still leave players feeling that the run chose their build for them. Conversely, a rich draft system cannot rescue weak movement or bad aiming feedback.

BLACKSITE's micro agency is first-person movement, sliding, dashing, aim down sights, physical projectile travel, cover, class skills, timed reloads, machines and enemy telegraphs. Its macro agency is class choice, two weapon slots, personal augments, talent branches, grafts, work-order pursuit and the squad Overtime vote. The question is whether these systems interact in a way a player can **plan**.

A useful decision sequence for each service room:

1. Read the prior encounter result: work-order success, strain, pressure reached and Overtime outcome.
2. Compare personal draft cards against the equipped weapon and class skill. A card should say the trigger and its exact effect.
3. Choose or keep a weapon based on range, projectile behavior, reload and current team coverage, not just a higher damage stat.
4. See the next sector's machinery hazard and reward; vote on Overtime with all connected living crew.
5. Enter an authored bay knowing its station count/mode and rough encounter order. Discover combat details through sight and sound.

The player should be able to explain at least one choice before the next wave. “I took the disc because this bay has partial walls and my bank-shot talent is active” is macro agency meeting micro execution. “The game offered only incompatible augments, so I picked the largest number” is a draft failure.

## 3. Large item pools need eligibility, roles and limits

**Documented:** the store advertises more than 110 items and surprising combinations. Hopoo's #16 notes say the team avoided stuffing the standard pool with too many synergy-dependent additions. Later item-overhaul notes call for more transformational effects, better synergies, stronger weak picks and a better balance of movement, defense and damage. **Inference:** a large item count is a content-management problem. Every new card affects offer quality, compatibility, damage calculation, visual load and learning burden.

BLACKSITE SHIFT currently has 37 augments, 24 talent nodes and five grafts. The pool should be organized by decision role, regardless of how cards are internally stored:

| Role | Example | Why it matters |
| --- | --- | --- |
| Reliability | Modest damage, health or reload improvement. | Gives a safe choice without a new rule to memorize. |
| Weapon-shaping | Bank-shot, penetration, blast radius or a changed firing cadence. | Changes position, aim or target selection. |
| Mobility | Dash-conditioned shots, slide recovery or route control. | Changes when and where the player moves. |
| Team interaction | Mark, shared heal, machine assist or ally-linked effect. | Creates a visible co-op action. |
| Element interaction | A short, explicit reaction trigger and result. | Rewards deliberate combination rather than hidden stack math. |
| High-risk graft | A major new behavior with a clear drawback. | Makes the run memorable without a free power pile. |

For each future item, write a five-part card: trigger, action changed, exact result, limit, and squad-visible signal. Then ask: what does this do with **no other item**, what happens with its most obvious partner, and what happens with four players using it simultaneously? A card that needs an extremely rare partner to do anything should be in a targeted reward source or removed from the standard draft. A card that creates no new decision may still be a reliability pick, but the pool must not become mostly generic stats.

### Proc-chain and damage budgets

The 2026 patch notes document an unintended infinite chain between two Risk of Rain 2 items and projectile explosions that could deal double damage on expiry. These are game-specific bugs, but the general engineering lesson applies directly to BLACKSITE's chains, blast effects, poison/fire detonation and graft triggers. Define event provenance explicitly:

- A direct player hit may trigger its weapon's effect and eligible augments.
- A reaction generated by that hit has a `source event`, `generation` and `already triggered` set.
- A reaction may not re-trigger itself from its own damage. If a deliberate second-generation chain is allowed, cap its depth and total targets.
- One projectile resolves impact **or** expiry detonation once. Cleanup cannot become another damage event.
- A shared mark is consumed atomically by one eligible hit, so simultaneous clients cannot each claim the bonus.
- The renderer may merge duplicate numbers and particles without merging server damage.

This is a **proposed formalization** of current combat logic, not a claim the code already carries every field. The first practical gate is a four-player stress test with all permitted elemental and blast combinations. Record maximum active projectiles, FX instances, event depth, damage events per second, snapshot size and host frame time. If an augment works only by producing unreadable saturation, redesign it.

## 4. Enemies and elites need counterplay at peak power

The later official item/elite overhaul notes say elite threats should offer room for counterplay even when a random run produces an unfavorable build. **Inference:** danger should be readable and avoidable through skill, positioning or team coordination; difficulty should not rely on a hidden one-hit condition. BLACKSITE's bosses and major enemies already use windups and the director caps simultaneous major attacks. Those constraints should hold even when a late-game squad can kill many ordinary enemies quickly.

Proposed enemy composition method: author *threat pairs* for each bay and explicitly test their overlapping danger regions. A sapper circle plus a welder strip can be exciting if the player has a clear third lane. A marksman and a charger can force a choice if their locks occur in staggered windows. A sentinel and repair tech demand a target-order decision. A purger and mites ask for floor control. The pair should not spawn at the same point and should never make the only escape route unsafe at once.

Bosses need a small, learnable attack grammar: signal, aiming/locking phase, damage phase, recovery. Emergency phase may increase cadence at a visible health threshold, as the current BLACKSITE bosses do, but should not hide damage or remove the recovery window. The 2026 notes discuss an attack hitbox being aligned with its impact timing and a hidden invulnerability replaced with armor. For BLACKSITE, that suggests visible armor states and synchronizing animation, sound, warning footprint and server damage. If an elite is temporarily protected, show the reason on its model and HUD; do not have shots mysteriously fail.

## 5. Co-op loot, death and departures are design rules

**Documented:** Risk of Rain 2 supports up to four players. A later free update allows a dead co-op player to operate an ally drone until a stage transition or another revive. **Inference:** a long-run co-op game must decide what dead players do, who gets loot, whether someone can take all rewards, and how the group moves on. A good answer can differ from Risk of Rain 2's; what matters is that the rules are deliberate and visible.

BLACKSITE SHIFT has personal augment/armory/graft picks and a shared Overtime vote. A downed player can be revived nearby, and a disconnected operative has a temporary reserved identity/build. These are strong rules for its short encounter structure. Further choices to settle:

| Situation | Proposed explicit rule |
| --- | --- |
| Player goes down during calibration | Machine session releases; station stays available. No duplicated seal, reward or cooldown. |
| Player dies during a wave | Spectate with pings limited or disabled according to fairness; avoid a long inactive wait. Do not turn spectators into unseen attackers. |
| Player leaves after a boss | Personal draft is not reassigned. Team difficulty uses connected crew at the next encounter boundary, not a mid-attack health jump. |
| Player reconnects | Restore class, weapon slots, talents, grafts, pending personal picks and vote eligibility according to current phase. |
| Two players interact with one station | Server accepts one operator; both see who owns it. The second can cover or select another station. |
| Two players take a reward at once | Personal drafts are independent; truly shared consumables use one server transaction with a public result. |

The 2025 official update's remote drone control is an interesting participation solution, but it could violate BLACKSITE's tactical FPS if a dead player adds free, unbounded damage. A safer **proposal** is an optional short-lived spectator survey function: one marked incoming entry every 20 s, visible to the squad, with no damage and no control of live machinery. Test whether it improves participation before adding it. The first priority remains making death and revive clear and avoiding long dead time.

## 6. Optional rule changes belong in a named mode

Hopoo's artifact discussion treats artifacts as a distinct rules-changing mode and explicitly discusses why they need not be balanced like a normal run. BLACKSITE already has a more tightly scoped signature system: one-encounter Overtime, displayed hazard and reward, squad vote, stable tie. Preserve that as the core. Only after it reliably produces interesting choices should **sector-long Overtime** become an advanced mode. It should be labeled separately in the lobby and in the incident report, with its own achievement/score category if that ever matters. Do not silently extend a voted one-room condition across the whole sector.

Possible advanced rules are original BLACKSITE proposals: every machine has a longer warning but shorter cooldown; each recovery object reveals a future work order but attracts a reinforcement; or power routing alternates safe lanes after every machine use. Each should alter movement, timing or team roles. A pure +40% enemy health modifier is easy to implement but does not fulfill the game's signature feature.

## 7. Readability and performance are part of the combinatorial design

The official 2026 patch notes show the breadth of late-stage failures: spawn nodes in walls, ping blockers, telegraph shapes that did not match damage, sounds that kept looping after return to menu, objective trackers wrong for clients, and infinite effect interactions. These are not accusations against BLACKSITE. They reveal what must be in our test plan as more content is added.

Use a visual priority stack: hostile major windup and machine strike footprint first; enemy silhouette and status second; teammate marker and shared mark third; friendly projectile fourth; debris last. Rendering effects may be reduced or combined, but the gameplay warning cannot be discarded. Audio similarly gives priority to imminent danger, teammate down and machine completion over ambience or weapon tails. The game's grim industrial palette should be built from concrete materials, room proportions, work lamps, functional hazard colors and machinery sounds. A dark post-processing filter that conceals a sniper is a failed art direction choice.

**Effect budget proposal:** cap short-lived damage-number sprites, impact decals, muzzle lights, chain arcs and persistent status rings independently. Use TTL cleanup on stage transition and menu return. In a four-player late build, measure the *worst* legal combination, not an average room. A status reaction should have one concise name and distinct shape, avoiding a dozen overlapping colored halos. The 2026 patch's looped-sound and FX fixes are a reason to treat cleanup as acceptance criteria for every new augment.

## Concrete prototype: two bay manifests from one seed

This is a **proposed content/test slice**. Build two authored variants of a Foundry transfer room. Both contain a central hydraulic shear and two legal enemy entries. Variant A has a raised platform with a long sightline and three easier valve stations. Variant B has more low cover, a side crossing and one hard pressure station. The same four baseline classes play both variants with the same enemy-role pair and reward offers. Then swap the role pair but retain the geometry. This isolates whether variation comes from space, enemies, or their interaction.

The server writes a manifest for each room: seed, sector, wave, bay ID, enemy order, machine count/mode, work order, Overtime condition, crew spawn anchors and next reward offer IDs. A bug report should allow the same manifest to be replayed. Validate all route nodes and spawn positions before the encounter starts. If a combination fails validation, fall back to the known safe bay and report the failed manifest for repair. Boss arenas keep their authored sightlines; they do not inherit an arbitrary normal-room cover shuffle.

Observe four things in playtesting: whether players can identify which variant they are in without reading the letter; whether they choose different routes; whether the operator/cover assignment changes; and whether a dangerous attack remains recognizable with four fully upgraded players. If only the machine count changes but behavior does not, the room kit needs stronger geometry. If the room is tactically different but blocks a spawn or projectile, the variant is not ready to ship.

## Current state and prioritized work

| Priority | Action | Acceptance |
| --- | --- | --- |
| Implemented in this pass | Wave entry names bay letter, machine mode and station count in a separate line. | The crew can anticipate the control task before moving into the bay. |
| Now | Validate every current bay with four crew across varied seeds and transitions. | No wall or deck spawn; station and exit reachable; boss arena stable. |
| Now | Stress the strongest legal four-player build. | Host remains responsive; warnings remain identifiable; no effect lingers after clear. |
| Next | Add room manifests and a replayable bug-report summary. | One seed plus version reproduces order, geometry, station and reward sequence. |
| Next | Audit 37 augments by reliability, action change, compatibility and proc depth. | Three-card drafts avoid dead offers and at least one card changes a player action. |
| Later | Prototype a separate advanced rule mode. | The standard Overtime vote remains one-encounter and safe on ties; advanced conditions are explicit. |

Risk of Rain 2's strongest lesson for BLACKSITE SHIFT is that authored content and systems can multiply one another, but every interaction increases the burden of agency, readability, navigation and performance. Our contractor story remains delivered through signs, equipment and short announcements. The crew's distinctive shared decision remains the optional Overtime vote. Additional rooms, items and spectacular builds should make that decision richer while protecting tactile base guns and a trustworthy four-player firefight.

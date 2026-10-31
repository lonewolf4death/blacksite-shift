# BLACKSITE SHIFT — Deadzone: Rogue reference deep dive

Prepared October 30, 2026. This expands Section 3 of [PRODUCTION_PLAN.md](PRODUCTION_PLAN.md) and the shorter entry in [REFERENCE_DEVELOPMENT.md](REFERENCE_DEVELOPMENT.md). It is a design analysis of **Deadzone: Rogue (the first game)** using official descriptions and developer updates, checked against the current BLACKSITE SHIFT source. I did not play or instrument Deadzone: Rogue for this pass. **Documented** means the linked developer or store material states it; **inference** is an interpretation; **proposal** is a BLACKSITE SHIFT design that is not implemented unless explicitly marked otherwise. Deadzone Rogue 2 announcements appear on the first game's news feed, so sequel features are not treated as features of the original.

## Sources, scope, and the useful evidence

| Official source | Documented detail | Design question for BLACKSITE SHIFT |
| --- | --- | --- |
| [Deadzone: Rogue store page](https://store.steampowered.com/app/3228590/Deadzone_Rogue/) | First-person combat in ship sectors; up to three co-op players; enemy marking and coordinated grenades; mission difficulty choices; over 30 modifiable weapons; fire, ice, shock and void; augments, perks, items and permanent upgrades. | How do strong base weapons and legible elemental choices support a room-based shooter? |
| [Free Apophis expansion announcement](https://steamcommunity.com/ogg/3228590/announcements/detail/512976676069573819) | Zone 4 adds a forging system, eight missions, radiation, environments, enemies and bosses. | How can new content add a decision layer without making the starter loop obsolete? |
| [Developer's 1.4.0.0 patch notes](https://steamcommunity.com/app/3228590/announcements/?l=english) | The team fixed a late-game host performance regression, lingering elemental particles, premature encounter completion, door-forcefield alignment, and client interaction/readiness problems. | What failure modes appear only after builds, transitions and co-op load accumulate? |
| [Developer's 1.4.1.0 and 1.4.2.0 notes](https://steamcommunity.com/app/3228590/announcements/?l=english) | Fixes addressed a fabricator selection reset when another teammate used it, a map transition crash, companion respawning, and double equipment input. | What explicit ownership and input rules are needed for shared equipment? |
| [Developer's sequel clarification](https://steamcommunity.com/app/3228590/allnews/?l=english) | The team identifies gun feel, builds, elements, missions, zones and solo/co-op as the original's core. It describes larger spaces, new abilities and reworked meta progression as sequel directions. | Which original strengths should be studied without accidentally attributing sequel ideas to the first game? |

The store page is promotional and does not reveal recoil timings, actual drop probabilities, network architecture or damage formulas. The values below are **our** proposed prototype targets, not claims about Deadzone: Rogue. The expansion is evidence that the developers added a new progression layer later; it does not prove that forging is the right first-release feature for BLACKSITE SHIFT.

## The central loop: combat first, build second

**Documented:** Deadzone: Rogue asks players to fight through hostile ship sectors, collect varied weapons and combine elemental affixes with augments. It offers per-mission difficulty choices and co-op marking. **Inference:** the appeal is a rapid loop of entering a bounded fight, reading its immediate threat, aiming and moving under pressure, then making a build decision that affects the next bounded fight. A new gun must have a reason to fire before the build multiplies it. A room's enemy mix should test the player's current choice rather than present only larger health bars.

BLACKSITE SHIFT currently has four starter guns, twelve total weapons, projectile simulation, four elemental conditions, three sectors, five cover variants per sector, machine stations, four-person co-op, personal drafts, and Overtime. This already covers much of the structural outline. The next quality leap is **clarity and differentiation inside one encounter**: whether a player feels the specific weapon cycling, knows why a shot hit or missed, understands a status reaction, and can identify an imminent hostile attack when four builds are active.

Our original premise stays fixed. A contractor sends a maintenance crew into a sealed processing complex after automated systems begin treating employees as raw material. Every descent recovers equipment and reveals the facility through signs, machine behavior, item descriptions and short announcements. Overtime remains the recurring signature decision: show the hazard and reward, let the whole squad vote, keep the safer setting on a tie, and apply the chosen condition to one encounter. The Deadzone reference enriches shooting and adaptation within this structure; it does not replace it.

## 1. Guns should be distinct before any augment

The store page's large arsenal and examples of turning a shotgun into a void crowd weapon or an SMG into an ice hailstorm imply two layers: a recognizable *base chassis* and a later *modification*. That separation is an **inference**, not a verified description of its internal weapon code. BLACKSITE SHIFT should test it directly: four players use unmodified starters for an entire encounter, then identify them by sound and handling with the UI names hidden.

The weapon identity budget has six channels. Each should carry information that another channel cannot:

| Channel | What the player can infer | BLACKSITE target |
| --- | --- | --- |
| Cadence | Whether to track, tap, or commit to a single opening | Distinct trigger interval and burst pattern, even at zero upgrades. |
| Kick and settle | When the sight is ready again | A visible impulse followed by weapon-specific recovery, with camera shake adjustable. |
| Report and mechanism | Which teammate fired; whether a cycle, charge or shell ejection occurred | Different transient, body and tail; no sample needs to be deafening. |
| Projectile and impact | Travel time, width, penetration, splash and miss path | Physical silhouettes, short-lived trails and impact materials that correspond to hit logic. |
| Reload | The vulnerable period and rhythm | An identifiable feed movement, sound and final ready cue. Unlimited reserve ammo still permits magazine timing. |
| Target response | Whether the hit staggered, pierced, chained, burned or was armored | Brief hit confirmation plus a durable enemy-surface state; do not rely on damage numbers alone. |

**Current implementation audit:** the M-24 carbine fires 18-damage rounds at 0.115 s intervals and permits one wall bounce; the K-6 scattergun launches seven 9-damage pellets at 0.72 s intervals and can interrupt a close ordinary windup; the V-9 needler fires 11-damage toxin needles at 0.075 s intervals; the P-12 pulse rifle fires 33-damage bolts at 0.33 s intervals and pierces one target. These are concrete mechanical distinctions. The viewmodel has cycling receiver parts, different projectile silhouettes and weapon-specific sound/recoil profiles. The change made with this pass gives muzzle signatures distinct color and shape so a shot's first frame also communicates its family. This is a modest visual cue, not a claim that the gun-feel gate has passed.

**Tuning proposal:** test base weapons with identical enemy sets and no perks. Record time to land a first hit, miss correction time, time spent reloading, damage actually delivered per magazine, and whether players can describe a preferred distance. For a four-player mix, record whether reports remain distinguishable or collapse into a continuous noise bed. Avoid tuning only nominal DPS: scattergun pellet loss, cover, projectile travel and crowd control all change effective value.

The carbine's bounce should reward a deliberate angle, not require pixel-perfect geometry. The scattergun should push the player into a short lane where the interrupt matters. The needler should reward maintaining pressure on one dangerous target, then repositioning while toxin works. The pulse rifle should ask the Medic to line up two threats. If an unmodified weapon has no tactical sentence like these, add a physical behavior before adding a damage perk.

## 2. Elements are a small combat grammar

**Documented:** Deadzone: Rogue presents fire, ice, shock and void as ways to change guns, alongside elemental affixes. The official store examples make the element visible in the attack pattern. **Inference:** the powerful lesson is not the number of colors; it is the difference in what the player does. One element should change target order, distance, timing, or lane selection.

BLACKSITE SHIFT's current grammar uses fire damage over time, frost slow, toxin damage over time, and shock chaining. Toxin followed by fire detonates; shock against a frosted target conducts; class skills and augments can create further reactions. The server resolves effects and clients display status rings. The risks are hidden order dependence and excessive effect overlap.

The grammar should be taught in three steps:

1. **Single status:** first application has a unique target cue and one sentence in the field manual. Example: frost reduces movement; its cool blue edge remains while the slow exists.
2. **Pair reaction:** the second element creates a distinct, short-lived reaction name and sound. Toxin → fire means deliberate follow-up; shock → frost means targeting a slowed cluster. The result must be visible without opening a menu.
3. **Build extension:** a talent or graft changes a rule, such as making the reaction originate from a machine-marked enemy. Its card states the trigger, radius, duration, cooldown and whether it can trigger itself.

Do not give each of four players three opaque status stacks and then ask them to calculate a hidden multiplier. One clear reaction per target per short window is easier to read and balance. A generic damage augment can remain, but it should serve as a simple reliable option beside behavioral choices.

**Proposal: reaction budget.** In a four-player encounter, cap simultaneous full-screen reaction flashes at one, aggregate same-frame damage numbers from the same source/target, and preserve the hostile telegraph layer above friendly particle effects. This is a presentation budget, not a damage nerf. The server may resolve every legitimate hit while the renderer coalesces redundant debris. A reduced-flashes setting should keep reaction text, enemy state and machine warnings readable without pulse intensity.

## 3. Build choices should create an action plan

**Documented:** the store page advertises augments, perks, items, permanent upgrades and playstyles involving distance, stealth and melee. The Apophis expansion adds a later forging layer. **Inference:** content depth comes from interactions among weapon behavior, elemental affix, personal perk and encounter, rather than from a long list of isolated percentage increases. A forge can be engaging only if the player knows what behavior it is modifying and why the cost is worth paying.

BLACKSITE SHIFT's current draft has 37 augments, 24 class-talent nodes and five grafts. Many change an action: a bank-shot damage choice makes cover angles matter, a precision-reload frost choice makes timing matter, a harpoon mark makes focused fire matter, and Phase Coupler trades direct damage for post-dash angle control. The field manual contains exact weapon traits. The risk is **offer overload** and low signal: as the pool grows, a player may fail to see whether a card changes their plan or merely adds throughput.

Use a choice template for every future augment:

| Required card line | Example phrasing for an original BLACKSITE proposal |
| --- | --- |
| Trigger | “After a successful precision reload…” |
| New action | “…your next two carbine rounds tag a machine target.” |
| Result | “The next machine strike against a tagged enemy widens by 0.4 m around that enemy only.” |
| Limit | “One tag per enemy; expires after 8 s; cannot tag a boss during an invulnerable phase.” |
| Team signal | “A striped yellow bracket appears on the tagged target for all crew.” |

The card should also show modified values in a comparison panel: current → offered. This example is a **proposal**, not present code. It illustrates a build that changes when the player reloads, who they shoot, and when the crew operates machinery. A flat +10% damage card remains valuable as a low-reading-cost option; it simply should not dominate the offer pool.

**Offer quality rule:** in a three-card draft, aim for one reliable stat choice, one action-changing choice relevant to the current weapon or class, and one cross-system choice that could create a new build. If the player has no compatible equipment, replace a dead card before presentation. A player should be able to explain why a card is attractive before choosing. A reroll must regenerate offers from the same eligibility rules and must not accidentally spend another player's entitlement.

**Progression boundary:** permanent upgrades should broaden starts, selection or survivability rather than make early encounters trivial. The Apophis forge is a later layer in Deadzone: Rogue; it is evidence that an established game can add a new progression axis after its base loop. For BLACKSITE SHIFT, do not build a persistent forge until base guns, a full nine-wave run and co-op transitions are dependable. A later sector forge could let each player commit one weapon modification at a shared machine, with individual ownership and a squad-visible completion state.

## 4. Enemy roles and rooms test the build

**Documented:** the store page lists hunter drones, robotic spiders, biomechanical bosses and different ship sectors. It describes bosses that require aim and reflexes. **Inference:** enemy variety is valuable when roles ask different questions of movement, target priority and weapon behavior. A sniper checks line-of-sight discipline; a rusher checks close-range escape; a healer changes target order; a plated unit asks for a flank or timing window. A boss has to keep its major attack readable while four players flood the room with effects.

BLACKSITE SHIFT already has mites, gunners, chargers, brutes, snipers, healers, sentinels, sappers, welders and purgers, plus sector bosses. The current director caps active enemies and simultaneous major windups. Improve composition with **authored pressure pairs**, each with a clear counter and a deliberately different best response:

| Pair | Intended player question | Failure case to test |
| --- | --- | --- |
| Charger + marksman | Dodge the locked rush without crossing the marked shot lane. | Their telegraphs overlap into an unavoidable trap at a narrow entry. |
| Sentinel + repair tech | Flank plate or remove support first? | Repair erases all progress during the only safe flank window. |
| Purger + mite pack | Slow the small rushers before coolant denies the floor. | Frost colors hide the true machine danger ring. |
| Sapper + welder | Leave a circular blast without entering the cutting strip. | Both warnings use the same color and shape. |

These combinations are **proposals for encounter authoring and test**, not claims of new enemy code. An authored room kit should record cover heights, path loops, legal spawn anchors, boss lanes and machine footprints. Seeded recombination can change where the pressure pair enters without invalidating those constraints. The existing wall-safe spawn validator and stage-entry snap must remain gates for every new variant. A player spawning in a wall is a run-ending failure, so route and clearance validation take priority over scenery density.

**Tactical room proposal:** a “cross-feed gallery” has a raised 0.8 m service deck with two ramps, a 1.0 m half-wall that can be shot over, a lower exposed machine lane and two separated enemy entries. A marksman on the upper line forces movement; a charger below makes the machine operator's cover assignment meaningful. The optional Overtime condition leaves the conveyor active, changing which ramp is safe. Its reward is displayed before the vote. The map must preserve a 1.6 m player-clear path from every stage-entry anchor to both ramps, ensure boss attacks cannot target a spawn during the entry brief, and keep a line-of-sight break on each side. Those are proposed authoring checks, not a new level already shipped.

## 5. Co-op is more than simultaneous damage

**Documented:** Deadzone: Rogue's official page specifies squads of up to three, marking for focused fire and synchronized grenade strikes. BLACKSITE SHIFT deliberately targets **up to four**, so we should not import its balance numbers directly. **Inference:** marking works because it reduces communication cost: the squad can pick a target without a voice conversation. A synchronized attack has a visible preparation and a payoff that can be credited to more than one teammate.

The existing BLACKSITE harpoon mark is a good prototype: one player creates a short, visible vulnerability, and the next crew hit consumes it. The co-op improvement is to make the mark's ownership and result explicit in feedback: who placed it, who consumed it, whether the 30% bonus applied, and why it expired. The current shared pings likewise need to be understandable at four-player density. Enemy markers should have a per-enemy limit and a short retention time; four persistent pings on the same elite add little information.

The developer patch notes provide unusually concrete co-op cautions. A teammate interacting with a fabricator could reset another player's selection; clients could fail to interact or ready; map transitions could crash; host performance could degrade late in a run. These are **documented bugs in Deadzone: Rogue**, not claims about BLACKSITE SHIFT. They suggest explicit rules for our systems:

- Personal upgrade menus own only that player's highlighted card and selected result. Another player's interaction cannot alter it.
- A shared machine has one server-authoritative operator. Others see the operator and the station state. Operator disconnect, death or cancellation releases the station cleanly.
- Overtime is a squad vote after the clear, with a displayed hazard/reward and no combat-time host override. A tie stays safe.
- Run transitions carry a validated spawn position and fresh state snapshot. A reconnecting player resumes a reserved build, while dead or departing teammates do not duplicate rewards.
- Four-player testing measures host frame time, packet size, projectile count, active sounds and effect lifetime in the late game. A solo performance pass cannot substitute for this.

These rules are already partly implemented, but they need adversarial four-client testing: two simultaneous machine interactions, a disconnect during calibration, a map transition during a revive, simultaneous card selections, and all four players triggering chain effects at once. The test should assert the settled state, not just that the UI closes.

## 6. Audio, visual tone and readable escalation

Deadzone: Rogue's official description presents a hostile sci-fi ship and original music/art. **Inference:** its example is less about copying a particular corridor and more about making visual and audio channels support combat decisions. BLACKSITE SHIFT's tone is a grimmer processing facility: bulky machinery, grime in material recesses, warning lamps on actual equipment, dry radio speech, low ventilation, hydraulic movements and restrained music. The facility's cruelty can appear in posted operating procedures and item provenance. It should not depend on a heavy filter that obscures hostiles.

Build an **audio priority order**. At the top are an imminent lethal attack, a teammate down, a completed machine seal and an Overtime commitment. Under that are weapon reports, enemy motion, machine room tone and ambience. Duck ambience briefly for danger; do not duck all gunfire so much that the player loses cadence. Give each gun an attack, mechanism and tail, with limits on repeated tails during automatic fire. Use a short silence or mechanical spin-down after a clear to make the service decision feel physical.

Build a **visual priority order**: dangerous enemy windup and machine footprint; enemy position and health/armor state; teammate position and mark; friendly projectiles and reactions; debris. When effects overlap, degrade lower-priority layers first. The 1.4.0.0 developer fix for lingering elemental particles and host performance is a concrete reminder that FX lifetime is gameplay and performance engineering, especially in a late-game co-op build. Keep all temporary effects bounded by TTL and pooled or capped; release them on room transition. The existing damage-number cap is a start, not proof that every combination is legible.

The current patch adds **weapon-family muzzle signatures** to the 3D viewmodel. Scatter gets a broad warm flash, the railgun a narrow pale flash, electrical and cryogenic guns cool flashes, and heavy launchers a larger short flare. This strengthens shot identity without adding a persistent light or another particle system. Hostile warning colors and shapes should remain distinct from friendly flashes during the four-player readability test.

## Concrete experiment: a single elemental pressure room

This is a **proposed test slice**, not implemented content. Build one fixed gallery room before expanding the item pool again. Place one repair tech behind a sentinel, two mites entering from a side chute, one cryogenic machine station and an optional Overtime condition that cycles the purge every 18 s for one encounter. Show the extra purge and reward on the terminal before voting. The encounter has a safe route on each side and no unavoidable overlap of a purge ring with a boss or sapper mark.

Run the room with four baseline classes and then four late-game elemental builds. Ask players to call the next dangerous attack, identify the marked target, choose a machine operator, and explain a reaction they intentionally produced. Record missed enemy attacks, misread friendly effects, card reading time, host frame time and transition state. Keep a 30-second service window option, but do not let the operator be forced into a menu during combat. A successful test produces at least one deliberate crew decision and one explanation of how an upgrade changed behavior. If the only difference between builds is damage output, the slice has failed its adaptation goal.

**Exit criteria before content production:** each starter gun is identified by sound/handling without a label; a player can deliberately repeat one elemental reaction; the Overtime decision is understood by all four voters; the hardest enemy warning is recognizable during full effects; all clients enter the next stage in legal positions; the host remains responsive after several rooms. If a condition fails, tune the base systems first. More weapons, enemies or sectors should be authored against a stable vocabulary.

## Current state and prioritized work

| Priority | Work | Why it follows from this reference | Done when |
| --- | --- | --- | --- |
| Now | Blind baseline gun comparison and muzzle/impact review | A weapon needs a physical identity before upgrade math. | Four starters distinguishable without UI names; no upgrade required to enjoy firing. |
| Now | Four-player elemental stress test | Effects and host load rise together. | Major warning read correctly in the strongest combination; no lingering FX after a room. |
| Next | Reaction feedback and one-page interaction grammar | A player should make reactions deliberately. | A first-time player can name trigger and result after seeing it twice. |
| Next | Authored pressure pairs in validated rooms | Enemy mix should test routes and target priority. | Two seed variants change choices without wall spawns or unavoidable telegraph overlap. |
| Next | Simultaneous co-op interaction tests | Shared machines and personal choices need settled ownership. | Two clients can interact, ready, disconnect and transition without changing another player's selection. |
| Later | One limited sector forge prototype | The base loop must justify another progression layer. | A forge choice changes a weapon's action plan and does not make earlier rooms trivial. |

Deadzone: Rogue is most useful as a benchmark for the **relationship** between sharp FPS action and legible adaptation. BLACKSITE SHIFT's own identity is the contractor crew, machine operation and Overtime vote. Every imported lesson must strengthen those pillars and keep the original six constraints intact: tactile base guns, behavior-changing builds, physical industrial atmosphere, deliberate co-op rules, four-player readability and authored systems that recombine safely.

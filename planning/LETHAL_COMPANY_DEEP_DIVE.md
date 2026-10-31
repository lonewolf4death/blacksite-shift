# BLACKSITE SHIFT — Lethal Company reference deep dive

Prepared October 30, 2026. This expands Section 3 of [PRODUCTION_PLAN.md](PRODUCTION_PLAN.md) and the shorter entry in [REFERENCE_DEVELOPMENT.md](REFERENCE_DEVELOPMENT.md). It is design research based on official product and developer material, plus inspection of the current BLACKSITE SHIFT source. I did not play or instrument Lethal Company for this pass. Statements labelled **documented** come from the linked sources; statements labelled **inference** are design analysis; **proposal** means a BLACKSITE SHIFT feature that is not yet implemented.

**October 31 refinement:** the original “current v0.22” table and recovery-docket proposal below are a historical design baseline. The [v0.24 implementation section](#october-31-refinement-and-v024-implementation) records what was actually built, what changed from that proposal, and what still requires a co-op playtest.

## Sources and the useful evidence

| Official source | Documented detail | Design question it raises |
| --- | --- | --- |
| [Lethal Company Steam page](https://store.steampowered.com/app/1966720/Lethal_Company/) | Contracted workers collect scrap from abandoned industrialized moons to meet a company quota. Earnings buy tools or passage to riskier moons. A teammate can guide others with a ship radar and terminal or enter with them. Night increases danger; the crew must return with valuables. | How do a common obligation, several kinds of contribution, and a known departure boundary create co-op stories? |
| [Developer's V70 Incubating Update](https://steamcommunity.com/games/1966720/announcements/detail/544484746860693721) | A reworked radar adds a face camera, 2D room display, compass, path toward the exit, and terrain contours; the mansion gets more rooms, interactable cabinets and less linear layout. | Information needs a presenter and a route decision. Spatial variety has to support searching, loops and return trips. |
| [Developer's V80 Blooming Update](https://steamcommunity.com/games/1966720/announcements/detail/516365152240535510) | A dedicated utility slot was added because consuming a scrap slot for most tools made players avoid them. The developer also added factory rooms and end-of-hall scrap, adjusted cave connectivity, refined entrance and departure animation/sound, and added accessibility options such as disabling head bob and toggle sprint. | A tactical tool must be affordable to bring. Valuable detours need readable destinations. Important transitions need physical and audio feedback. Accessibility protects movement feel. |
| [Developer news, V62 and V64](https://steamcommunity.com/app/1966720/allnews) | V62 fixes include overlapping rooms, missing scrap spawns and navigation blockers; V64 adds a belt bag accessible by other players. | Level variation fails if navigation, loot placement or co-op access breaks. Shared access is a rule, not just an inventory graphic. |

The Steam page establishes the core premise and roles. The update notes show how the developer refined those roles and spaces over time. **Inference:** the durable design lesson is not a particular monster, map, terminal skin or quota number. It is a system that makes the team decide when enough value has been secured, who keeps watch, who takes a detour, and when to leave. BLACKSITE SHIFT can use that tension while keeping an FPS combat cadence.

## A systems reading of Lethal Company's co-op loop

### 1. The shared job turns individual discoveries into a crew decision

**Documented:** the Steam page connects found scrap, a shared company profit quota, purchases and riskier destinations. The crew does not merely accumulate personal score. It must bring value home. **Inference:** this creates three useful types of disagreement: whether to continue for more value, whether a particular find is worth the trip, and whether to spend proceeds on collective capability or future access. None requires a scripted argument. A quota creates a common yardstick, while the location and timing of each find create local decisions.

BLACKSITE SHIFT already has a bounded version: a visible work order per encounter, sector credit for success, at most two extra reinforcements from strain, shared salvage progress, and an Overtime vote with a named hazard and reward. Keep those rules. The most important difference is that the current salvage quota is earned automatically through kills; it produces a reward but little physical recovery behavior. A later field-recovery object could make one teammate deliberately enter danger while another covers them. That should be a carefully limited optional system, not a compulsory search after every firefight.

**Design rule:** the shared obligation must have a visible measure, a deadline or departure point, and a settled consequence. The player should be able to say, “We got the credit but missed the optional recovery,” rather than wonder whether an invisible score changed. Missing a target can add bounded future work; it should not silently invalidate a build or force a tedious cleanup phase.

### 2. Information asymmetry creates a job for the teammate who stays back

**Documented:** the Steam page describes a radar and remote doors operated from the ship, while V70 explicitly expands the map, face camera, compass and route information. **Inference:** the information role is interesting because it sees something the entrant does not, but still needs a teammate to act on the call. The best call is actionable and urgent: “The left lane has a locked door; take the loop,” not a flood of map data. Another player can choose to sacrifice that overview and enter the dangerous space.

BLACKSITE SHIFT has shared position pings and a combat HUD. An exact copy of a ship operator would likely remove one of at most four shooters from the core loop. A better adaptation is a **temporary observation job** at designated service or machine consoles. While one player calibrates a machine, the console can reveal limited room information to the operator and broadcast one or two actionable facts to the squad: the next reinforcement entry, a machine strike center, or the safest return lane. The information advantage must be brief, visible and optional. The operator remains exposed, so the rest of the crew has a cover assignment rather than a spectator.

Potential information channels, in priority order:

1. A world marker and one-line callout for the next machine strike or reinforcement entry. It expires as soon as the event occurs.
2. A contour-like floor plan on a physical service monitor showing full walls, low walls and raised decks. It should distinguish navigable routes without replacing the player's view.
3. A next-encounter brief that reveals the work-order type before the Overtime vote. This can change the decision if a team has a weak machine build or low health.

The signal must not be perfect omniscience. A machine that says “east intake cycling in 5 s” creates an action; a permanent wallhack turns navigation into following UI. The current G route ping and Shift+G danger ping remain useful, especially for players without voice chat.

### 3. Tools work when they leave room for the actual objective

**Documented:** the Steam page lists lights, shovels, walkie talkies and stun grenades as useful job tools. V80 says a dedicated utility slot was added because tool use suffered when it competed with scrap slots. **Inference:** even good tools disappear from play if their opportunity cost is hidden or too severe. The tool slot change is an explicit example of the developer adjusting a rule to recover a desired behavior.

For BLACKSITE SHIFT, a team utility must coexist with a primary weapon and a secondary weapon. Do not make a player discard a gun to carry a scanner, radio beacon, repair charge or recovery container. A future single utility slot could be class-neutral while talents modify its use. Example tools:

| Tool concept | Exact tactical use | Cost and limit | Communication value |
| --- | --- | --- | --- |
| Route beacon | Place a 6 s visible route marker on navigable ground within 15 m; allies see it through haze at reduced opacity. | One active per player; existing ping rate limit applies. | “Regroup behind this half wall.” |
| Survey probe | Spend 2.5 s at a station to reveal the next reinforcement entry for 8 s. | Operator cannot shoot during the scan; once per encounter. | “Left intake is opening.” |
| Field clamp | Delay one machine's warning-to-strike by 0.5 s, giving crew more escape time. | One charge per encounter; cannot stack with another clamp. | “I bought us a longer exit.” |
| Recovery tether | Pull one dropped recoverable toward the holder from 4 m if the line is unobstructed. | Does not pull guns, players, bosses or hostile targets; cooldown 15 s. | “We can secure the object without crossing the marked floor.” |

These are proposals. The current build already has pings and class abilities, but not this utility inventory. It is more important to test the value of one utility than to author four icons and menus immediately.

### 4. Tension arises from a bounded departure, not constant weakness

**Documented:** Lethal Company's Steam description names night as an escalation and asks the crew to carry valuables back before conditions worsen. **Inference:** the emotional beat is “we have something worth losing and we are deciding when to stop.” The game can afford stretches of vulnerability because its core action is scavenging. BLACKSITE SHIFT is a shooter; if every firefight is slow, helpless and inventory-focused, its weapons and movement lose their purpose.

Use a four-beat BLACKSITE rhythm:

| Beat | Expected duration | Intended tension | Rule |
| --- | --- | --- | --- |
| Entry brief | 5–8 s | Read the current order, bay geometry and powered machinery. | No surprise damage before a player can regain control. |
| Firefight | About 60–100 s in the target slice | Aim, move, use class skills, cover a machine operator. | Guns remain capable before upgrades; attack windups remain legible. |
| Recovery beat | 8–20 s, only if an optional object is present | Decide whether the remaining value is worth a detour. | Skipping it must be valid; no compulsory search for a single missing prop. |
| Service decision | Existing 30/60/120 s host-selected window | Read the ledger, make personal picks, debate Overtime. | Every living connected player gets the same vote; ties stay stable. |

The proposed recovery beat requires a prototype and playtest. If it simply delays the next fight, remove it. The current build moves straight from clear to the service decision. Do not claim the recovery beat is implemented.

### 5. Space must make routes and return journeys intelligible

**Documented:** V70 adds rooms, cabinets and more looped interiors. V80 adds factory halls, end-of-hall rewards and cave pockets while improving entrance feedback. V62's fixes show the cost of overlapping rooms, missing spawns and navigation blockers. **Inference:** the procedural lesson is not “add random corridors.” It is to author small spatial units with known functions, then recombine them under placement and path rules. A good detour has a visible reason to take it, a return route and an understandable risk.

BLACKSITE SHIFT currently has five authored cover layouts per sector, low walls, raised decks and either three easy, two medium or one hard machine station. Build the next level pass from named room functions:

| Room function | Combat opportunity | Recovery or communication question | Geometry requirement |
| --- | --- | --- | --- |
| Intake apron | Long sightline, moving reinforcement entry. | Who watches the intake while someone calibrates? | Two exits; at least one low wall that permits aimed fire. |
| Service catwalk | High angle over the main machine. | Is height worth exposure to a sniper or floor hazard? | A clear climb route and a second descent route. |
| Filter chamber | Short sightlines and sound occlusion. | Can the team keep contact when split by machinery? | One loop, no dead-end spawn for enemies or players. |
| Evidence cage | Optional side objective visible through grating. | Is it worth crossing a marked machine lane? | Reward and exit visible before commitment. |
| Transfer junction | Several low cover islands and a powered door. | Which lane becomes the extraction route? | Cover must not hide enemy telegraphs. |

Author every module with navigation metadata: player clearance, enemy clearance, projectile height, machine warning footprint, landing height, entry distance from a wall, and a clear route back to the main arena. Seed selection changes module order and powered equipment but must preserve a reachable path. Test both directions of each connection. A room can be visually irregular without being mechanically ambiguous.

### 6. A recognizable crew makes support decisions legible

**Documented:** the Steam page makes the players contracted workers with tools and suits. V80's patch notes mention hand alignment on the departure lever and audio/animation for the entrance and ship transition. **Inference:** a crew feels like a crew when its bodies, tools and interactions visibly belong to the job. This can be achieved without copying Lethal Company's suit or ship.

BLACKSITE art direction: modular pressure suits with reinforced work boots, air-filter packs, a chest ID plate, a shoulder radio, helmet task lamp, tool pouches and class-specific additions. The silhouette must still say Vanguard, Breacher, Runner or Medic at combat distance. The patch implemented in this pass adds those low-cost mesh details to remote crew models. Future animation should show a hand moving from weapon to machine control, a crouched revive posture, and a distinct final seal on each minigame. Do not let decorative kit overlap the reticle, obscure nameplates or hide graft silhouettes.

Audio should make work states audible: a dry radio confirmation when an operator connects, a low carrier hum during calibration, a contactor click when a seal is accepted, and a longer machine release after the final step. The urgent warning band must cut through gunfire without becoming a continuous siren. Position and distance should matter for 3D sounds; the HUD can supply a quiet, accessible backup for a player with audio reduced. A change in room tone after a clear can create a short breath before the service vote. That silence should not make the player wait for an unnecessary timer.

## Concrete BLACKSITE feature candidate: the recovery docket

This is a **proposal for a later slice**, specified here so it can be judged and built without confusing it with the current v0.22 implementation. It is the smallest physical-scavenging experiment that might add a Lethal Company-like team decision while protecting the FPS.

**Spawn and information.** At most one recoverable object can appear in a non-boss encounter, in a side pocket chosen from validated anchors. The chance and reward are displayed on the entry brief; no secret reroll decides whether the crew was cheated. The item has a sector-specific industrial identity, a readable silhouette and a short description. It never spawns inside a wall, on an inaccessible deck or inside a machine strike footprint without an alternate route. The same run seed reproduces its location. The first test should use a fixed location in one authored bay; seeded variants come after the interaction works.

**Recovery action.** One player must hold F for 2.5 s within 1.6 m while looking at the object. Damage interrupts the hold but does not erase the object. During the hold, the player can turn and call out but cannot fire; teammates can cover. The server validates distance, line of sight, life state and uninterrupted progress. One object can be secured once. A disconnect releases control after a short reservation without duplicating rewards. If the room is clear, the same action can be completed without artificial danger. Do not spawn new enemies solely to punish a crew for inspecting the object.

**Reward.** A secured object adds one shared *evidence credit*. Evidence credits do not become a spendable currency in the first prototype. The first credit in a sector reveals the next work-order type at the service terminal; a second credit can grant one personal reroll to each survivor. This is deliberately informational first, power second. It must not stack with the existing kill-salvage reroll until tests show the draft economy remains readable. An alternative is to replace the kill-salvage reroll with this physical recovery, but only if players prefer the route decision to the current automatic progress.

**Departure and failure.** The object is optional. If the crew advances without it, the docket records “unrecovered”; no one loses an already earned personal item. The host cannot take it for themselves. If all crew are down, the normal run-failure rule wins. A teammate's departure during the hold cancels only that player's action. A 2–2 Overtime tie remains stable regardless of evidence credit. The service timer must not expire while a server-accepted recovery is in its final second; allow a bounded 1 s grace only, never an indefinite stall.

**Visual and audio.** A yellow cage tag, small pulse lamp and printed asset number distinguish the recoverable from health drops. The interaction bar uses a different shape and sound from machine calibration. The on-screen confirmation says what the squad gained and who secured it, without attributing ownership. At the service terminal, a stamped docket line settles recovered/unrecovered and the resulting information or reroll. Reduced Flashing Lights replaces the pulse with a steady lamp; color is never the only signal.

**Prototype gate.** In a four-player test, at least one player deliberately changes route or assigns cover to secure the object, and all four can explain the reward after the clear. If it is universally picked up after combat with no discussion, it is just a delayed pickup; shorten the action or remove the system. If it creates more than 20 seconds of routine waiting, remove the separate recovery beat. The baseline gun test must still pass without upgrades.

## Current state, gaps and order of work

| Area | Current v0.22 | Next proof | Later expansion |
| --- | --- | --- | --- |
| Shared contract | Seeded work orders, sector credits, bounded strain, shared kill salvage. | Make the ledger's outcome and next cost unmistakable in a four-player playtest. | Trial one physical recoverable and compare it with the kill quota. |
| Shared risk | One-encounter Overtime vote with named hazard and reward; ties stay stable. | Observe whether squads debate the hazard before approving. | Add conditions that change routes or machine timing, within existing threat budgets. |
| Communication | Route/danger pings, announcements, nameplates, machine operator callout. | Test without voice chat; players must coordinate a machine cycle and revive. | Brief survey information role; optional voice chat only with full privacy and mute rules. |
| Crew identity | Four class colors and graft meshes; this pass adds work kit silhouettes. | Identify teammates and roles at 12 m in low light without reading names. | Repair, reload, machine and revive animations with class-specific hand motion. |
| Spaces | Five layouts per sector, low walls, raised decks, different machine counts. | Validate entry, exit, machine clearance and enemy paths under every seed/layout. | Named room modules with loops, optional visible detours and recoverable anchors. |
| Between-battle tension | Timed service choices and Overtime voting. | Measure waiting and accidental departures. | Only add recovery beat if it creates a real choice in under 20 s. |

### Priority order

1. **Measure existing co-op.** Record who operated machines, who covered, who was revived, Overtime votes, decision time and whether the work order was understood. This can be a local debug report; no telemetry upload is necessary.
2. **Run a no-voice test.** Four players use only existing pings and HUD. If the operator's risk or the vote is unclear, improve markers and copy before adding more systems.
3. **Improve physical transitions.** Add an entry door/airlock cue and a machine shutdown beat that are audible and visible but do not lock control for long. Compare against V80's emphasis on interaction animation and sound, without copying its ship.
4. **Prototype one recoverable in one bay.** Keep its reward informational first. Delete it if it adds routine downtime.
5. **Expand room modules only after path tests.** Every new height, half wall and loop increases collision, enemy navigation, shot-height and spawn risk.

## Acceptance tests and red lines

### Six constraints from the production plan

| Constraint | What this research changes | What would fail the constraint |
| --- | --- | --- |
| Weapons feel good before upgrades | The scavenging influence is concentrated in decisions around fights; a baseline carbine, shotgun, SMG and rifle still need distinct cadence and impact. | A player tolerates weak shooting only because a later salvage reward raises damage. |
| Builds change actions | Optional recovery and utility choices would change route, cover and machine timing. They should compete with other real decisions, not add hidden multipliers. | The only reason to secure an object is a larger number on the next shot. |
| Industrial atmosphere has physical causes | Suit kit, machine controls, airlock scale, worn finishes, lighting pockets, room tone and contactor sounds convey a workplace. | A flat arena relies on grain, darkness or chromatic aberration to look industrial. |
| Co-op decisions have explicit rules | The document defines ownership, authorization, disconnect, failure, vote and departure behavior before adding a recovery object. | One player can seize a team reward, a tied vote activates danger, or a departing host strands the crew. |
| Four-player readability | Limited markers, one recoverable at most, finite information windows and bounded attack budgets preserve threat priority. | Four simultaneous builds cover a machine warning or make the ally down marker unreadable. |
| Replayability recombines authored content | Named room functions, checked connectors, safe anchors and seeded variants create different routes without arbitrary geometry. | A seed yields a blocked return path, inaccessible reward or spawn inside a wall. |

The story remains a contractor sending a maintenance crew into a sealed processing complex whose automation treats employees as raw material. Signs, asset tags, equipment descriptions, machine behavior and short announcements deliver that story. A separate cinematic campaign is unnecessary for this stage.

- **Tactile guns:** a player can distinguish each starter weapon by cadence, recoil, reload, impact and sound before collecting a reward. A recovery system cannot repair weak weapon feel.
- **Visible adaptation:** an augment or graft changes a combat action or positioning choice, not only the damage number. Personal equipment ownership is clear.
- **Shared industrial danger:** at least one co-op moment comes from someone choosing to calibrate, cover, retrieve, revive or vote under known risk. The hazard and reward are visible before an Overtime commitment.
- **Controlled escalation:** four upgraded players can still spot a sniper lock, machine strike, floor hazard and ally down marker. Extra salvage cannot explode the effect budget.
- **Fair co-op rules:** ties stay stable, votes are per living connected player, host departure transfers routine control, a disconnect cannot duplicate a recovery reward, and no player can steal the entire team's payout by clicking first.
- **World integrity:** every spawned object and entrant is wall-safe; every optional detour has a return route; raised decks, low cover and projectile height agree; no generated junction traps a player or enemy.
- **Pacing:** a standard firefight starts promptly, the optional detour takes less than 20 seconds when taken, and the service vote is not prolonged by decorative animation.
- **Identity:** BLACKSITE remains a contractor's sealed processing complex with maintenance crew, work orders, processing machines and Overtime. It does not reproduce Lethal Company's moons, ship, company logo, monsters, scrap props, suits, terminal layout or vulnerable scavenging pace.

## October 31 refinement and v0.24 implementation

### What the sources establish, and what they do not

The [official Steam description](https://store.steampowered.com/app/1966720/Lethal_Company/) explicitly connects a crew quota, riskier destinations, ship-side radar/terminal support, useful tools, and a worsening night. The developer's [V70 notes](https://store.steampowered.com/news/posts/?enddate=1748753606&feed=steam_community_announcements) describe a radar with a room display, compass, route to the exit, and terrain contours. The [V80 notes](https://steamcommunity.com/app/1966720/allnews) explain the utility-slot change: useful tools were underused when they consumed a slot players wanted for scrap. The same notes describe stronger entrance/departure feedback, factory room additions, accessible sprint and bob settings, and a limit on creature diversity for some moons. These are developer-stated changes, not proof that a particular BLACKSITE mechanic will be fun. I have not measured Lethal Company's player behavior or copied its ship, moons, monsters, or gear.

**Inference:** the cooperative loop is carried by a visible common obligation, unequal but complementary information, a route with a return cost, and a known point at which the group decides it has enough. The useful part for a combat-forward BLACKSITE run is one short optional job within a firefight. A second looting economy or a mandatory walk back across an empty level would dilute the guns and movement that must carry the game before upgrades.

### The recovery docket: a bounded crew job

The v0.24 prototype replaces the broad recovery-beat proposal above with **one docket on waves 2, 5, and 8**. These are the second normal encounters in the Foundry, Cryolab, and Core. It is never in wave one, which teaches machinery, or a boss wave, which has its own visual and timing load. The record's sector-specific name, amber cage/lamp silhouette, HUD distance, nearby hold prompt, progress bar, start/cancel tones, and service settlement distinguish it from an automatic health drop. The player learns both the route and reward before leaving the fight. The object is optional; when the last hostile falls, an unfinished recovery is stamped *unrecovered* and service starts immediately.

Location is deterministic from the run seed and wave. The server floods walkable cells from the crew entry and considers only cells with actor clearance. It excludes the entry's immediate area, all station controls, all machine strike circles with a buffer, and all active floor hazard footprints with a buffer. A seed chooses a side-route anchor and the nearest eligible reachable cell. The test suite checks 28 seeds in each of the three eligible waves and reproducibility of each placement. This is a stronger placement rule than random free-space selection, but it does not yet prove every route *feels* worth taking; low walls and decks still need human path and sightline checks.

The first operative to start a valid hold becomes the temporary operator. The server checks combat phase, identity, life/connection state, distance at most 1.6 m, clear line of sight, a facing dot product of at least 0.55, and no simultaneous machine session. The hold takes 2.5 continuous seconds. During it the server rejects movement, firing, dashing, and class skills. A hit, release, turn away, down, disconnect, or encounter clear cancels the attempt; it does not consume the docket. A second operative cannot reset or steal an active hold. On completion the server records one secured event and broadcasts its owner and location. This design asks another player to watch a lane or draw a threat while the operator works. In solo play it remains a voluntary risk.

### Reward and departure contract

Securing the docket reveals the **next boss work-order type** in the service terminal before the squad votes on Overtime. This is actionable information: a crew expecting a machine order can judge a fault-heavy Overtime protocol differently from one expecting a timed clearance or intact-signal order. It also provides one personal augment-offer reroll to each survivor **only when the kill salvage quota was missed**. If the quota was already met, the information remains the benefit. The two reroll sources cap at one per operative; no one can claim the squad reward first. A player joining during service receives a base provisioning draft but cannot claim a reroll or bonus draft from a wave they did not enter. Reconnecting crew retain their encounter eligibility. Drafts remain personal, a strict majority still authorizes Overtime, a tie still chooses Stable Route, and host departure does not convert a docket into a vote.

There is no separate recovery phase, new enemy wave, evidence currency, carrying animation, inventory slot, or grace extension to the service timer. The combat clear is the departure boundary. This deliberately narrows the earlier proposal: a recovery that is routinely collected in an empty room would be a delay with no cooperative decision. A future physical carry or return trip should only be considered after observing players voluntarily change route and assign cover here.

### Communication, feel, and accessibility follow-through

The operator's hold and the crew's role are stated through local prompt, shared announcement, progress, and sound. G route pings and Shift+G danger pings remain available to a squad without voice. The incident report attributes a secured docket to its operator alongside machine, revival, guard, and combat actions, so support is visible without turning the result into a damage leaderboard. The service line reports secured or unrecovered and the next order. This is a first information role that keeps all four players in the arena.

V80's utility-slot lesson is kept as a future constraint: a scanner or clamp should not displace either weapon just to exist. This pass instead adds **Toggle Sprint** to the existing sensitivity, FOV, view-bob, and flashing settings. View Bob can already reach zero. The new recovery model's pulse steadies with Reduced Flashing Lights, while its outline, tag, and HUD text remain. The most dangerous enemy and machinery warnings still occupy the top visual/audio priority.

### Playtest questions that determine whether this stays

1. In a four-person no-voice run, does one player ping or approach the record and another deliberately cover them? Record attempts, completions, damage interruptions, and whether a crew member can explain the reward before service.
2. How much extra combat time does a docket add on waves 2, 5, and 8? Compare seeded runs with players told to ignore it against runs where they may choose it. If most recoveries occur after enemies are gone or add routine waiting, shorten the hold or remove the objective.
3. Does knowing the next boss work order change an Overtime ballot? Compare the vote explanation with and without a secured docket. If it does not affect a decision, the information reward needs a better question to answer.
4. Is the object easy to spot without hiding a sniper lock, machine ring, or downed ally? Test default and Reduced Flashing Lights with four upgraded players firing together.
5. Can new players recognize a class's gun and skill before attempting any optional recovery? If the recovery is more memorable only because starter weapons feel weak, fix the weapon first.

The first four questions need recorded human sessions; automated placement and state tests cannot answer them. The contractor premise and four pillars remain the acceptance gate: capable guns, action-changing adaptation, worksite decisions, and legible escalation.

## Summary decision

Keep the current combat-forward loop. Borrow the *cooperative structure* of a common job, readable equipment, information roles, short risky detours and a meaningful departure boundary. The existing Overtime vote and machine operator already prove more of that structure than a new scrap economy would. The next investment should test whether crews recognize those decisions, then add one bounded recovery experiment only if it creates discussion and action without slowing every firefight.

# BLACKSITE SHIFT — Risk of Rain (2013) reference deep dive

Prepared October 30, 2026. This expands the Risk of Rain (2013) entry in [PRODUCTION_PLAN.md](PRODUCTION_PLAN.md) and [REFERENCE_DEVELOPMENT.md](REFERENCE_DEVELOPMENT.md). This document analyzes the **2013 original**, not Risk of Rain Returns or Risk of Rain 2. It uses the original developer's store description and an audit of the current BLACKSITE SHIFT source. I did not play or instrument Risk of Rain for this pass. **Documented** means the linked official source states it, **inference** is my design interpretation, and **proposal** means a BLACKSITE SHIFT feature that is not implemented unless explicitly marked otherwise. Numeric targets below are our design experiments, not reverse engineered Risk of Rain values.

## Official evidence and the design problem

The [original Risk of Rain store page](https://store.steampowered.com/app/248820/Risk_of_Rain_2013/) states three explicit goals: a fresh run through randomized content, time increasing difficulty, and enjoyment even when the run ends in a loss. It describes permanent death, random enemies and bosses, over 100 items, stages with chests and shrines, drones, unlockable survivors, item/monster logs, and play alone or with up to three friends. Its emphasis on *time as difficulty* is unusually direct: the game makes a player's time budget part of the challenge instead of hiding all escalation behind stage number.

The store page is not a combat design spec. It does not disclose the director formula, item drop weights, enemy damage curves, exact teleporter rules, network authority, or whether a particular loss felt fair in practice. We should not pretend to know those details from promotional copy. The useful evidence is the original team's stated relationship between **time**, **random content**, **loss**, and **replayability**. BLACKSITE SHIFT must adapt that relationship to first-person co-op firefights and a physically interactive processing facility.

## 1. The pressure clock is a choice, not just a number

**Documented:** difficulty rises as in-game time rises. **Inference:** this creates an exchange rate between immediate opportunity and future danger. A player can search for another item, operate a risky device, recover from a mistake, or advance. Each extra second has potential value and a future cost. This is richer than an invisible health multiplier because the player can reason about it. It is also easy to make punitive: if the player cannot predict the cost of lingering, the clock becomes background anxiety rather than a deliberate decision.

BLACKSITE SHIFT has a bounded version. The server adds one extra reinforcement at 30 seconds and one at 60 seconds into an active encounter. The current pressure band influences spawn cadence. The clock resets per wave and stops in the service room. Those boundaries are appropriate to a game that asks four people to read upgrade cards and vote on Overtime. The new HUD line in this pass announces the countdown to the next extra reinforcement and says when the bounded pressure is maxed. This makes a real server rule visible. It does not turn the entire run into an endless global timer.

There are four useful kinds of time cost; they should be named separately:

| Time cost | Player decision | BLACKSITE rule or proposal |
| --- | --- | --- |
| Encounter pressure | Stay to calibrate a machine or finish quickly. | **Implemented:** 30/60-second reinforcement steps while combat is live. |
| Local hazard cycle | Cross a floor lane now or wait for the machine to discharge. | **Implemented:** sector hazards and warnings, with Overtime altering danger for one encounter. |
| Work-order deadline | Pursue a speed objective or accept a bounded contract strain. | **Implemented:** a visible time target on certain orders; missed orders can add at most two next-wave reinforcements. |
| Optional recovery time | Spend a short exposed interval to secure value. | **Proposal:** one physical recoverable in selected rooms, only if it produces a genuine route or cover decision. |

The important distinction is **active versus safe time**. Service-menu reading should be comfortable. A player should not lose a run because a teammate needed ten extra seconds to read exact augment numbers. During combat, an operator's calibration time can be meaningful because the crew can protect them, take another lane, or postpone the machine until a threat is removed. Overtime adds a second, explicitly voted cost to the next encounter. These systems should never silently stack into a surprise punishment.

### Pressure readability and boundary rules

The HUD now states `NEXT +1 IN 30S`, then counts down, then gives the second 30-second interval; after 60 seconds it states that reinforcement pressure is maxed. Because the server sends whole encounter seconds, the display is approximate to a second. That is enough to support a decision, but the actual spawn still belongs to the server. The countdown must not become a twitch prompt: it is for planning a calibration, revive or route, not timing a dodge on frame 29.9.

Future UI should show *what the pressure step does*, not only the time. A small field-manual line can say “At each pressure threshold, one extra reinforcement enters this encounter; no more than two come from time.” The difference between time pressure and contract strain should be explicit, because both can add enemies. A simple ledger can list `TIME +1 / CONTRACT +1 / OVERTIME FASTER ENTRY` for the next wave rather than show an unexplained total count.

At a threshold, the new reinforcement should follow existing safe spawn rules and show a clear entry cue. The event cannot place an enemy in a wall, behind the crew's newly spawned positions, or on top of a downed player as an unavoidable hit. If an encounter ends at the same instant a threshold is crossed, the clear wins and the reinforcement is discarded. A pressure band can still show as reached for the incident report, but it must not spawn after the service state begins.

## 2. Optional value creates tension only when the cost is real and legible

The original store page lists chests, shrines, drones and items as stage content. **Inference:** an optional interaction is interesting because it may make the current run stronger while spending time and exposing the player to danger. If every option is free after a room is clear, there is no time decision. If every option is mandatory to stay competitive, it ceases to be optional. BLACKSITE SHIFT must use fewer, more distinct opportunities because a first-person combat room has less room for exploratory wandering than a large side-scrolling stage.

The facility's physical machines are already a good candidate. A machine asks an operator to work while enemies remain active; teammates cover the operator. The payoff is tactical control and, for some work orders, sector credit. The proposed next experiment is **one deliberately placed side recovery** in an authored bay, with a clearly stated reward. It should be visible before the crew commits to crossing a dangerous lane. When the room is already clear, obtaining it should be quick; do not create artificial waiting simply to imitate the clock.

Three value categories keep decisions understandable:

1. **Immediate control:** the active machine strikes a target area now. This is worthwhile when it removes a high-priority enemy or opens a route.
2. **Next-room capability:** a successful order, personal draft or recovered object gives a known future benefit. The reward needs to be shown before the action.
3. **Information:** a scan reveals the next enemy role, machine mode or Overtime hazard. It can be valuable without adding more damage to an already explosive build.

The first prototype should not add a second currency, a shop and a persistence system at once. A single evidence credit or personal reroll is sufficient to see whether the crew takes a detour on purpose. A test where everyone picks it up automatically after combat means it is merely delayed loot; remove or shorten the interaction.

## 3. Fair losses teach a route or combat lesson

**Documented:** the original developer explicitly wanted the game to be enjoyable whether the player wins or loses, with losses not blamed on unintuitive patterns. **Inference:** a failed run can still feel worthwhile if the player understands the cause and sees what they might do differently. Randomness is not an excuse for impossible combinations. A first-person four-player shooter has particularly harsh unfairness when enemies spawn inside walls, stage entries trap a player, a dangerous attack is hidden by friendly effects, or a death occurs before control returns after a transition.

The BLACKSITE incident report already records kills, damage, accuracy and seed. Expand it eventually with **causal facts**, not just vanity numbers: last sector and bay, highest pressure band, work-order result, Overtime choice, most damaging enemy type, and whether an operator was caught during calibration. If a player died to a machine, name the machine and whether its warning was active. This should be server-derived to avoid contradictory client impressions.

Fairness checks for the room director:

- A new wave grants a brief readable entry state. Every crew position has a legal floor, wall clearance, and an open first movement route.
- A hazard warning's visible geometry matches the server damage footprint. A low wall that blocks sight should not mysteriously fail to block a projectile unless the enemy clearly fires over it.
- The director cannot schedule more simultaneous major attacks than the current threat budget. A pair of attacks may require fast movement but should leave at least one viable route.
- A failure caused by a player choosing Overtime is communicated as the chosen hazard, not as a random spike. The reward remains valid if the encounter is cleared under that condition.
- Contract strain is capped at two extra next-wave reinforcements. One missed speed order should not snowball indefinitely.

These constraints make a loss interpretable. The original's stated enjoyment goal becomes a practical acceptance test: after defeat, can each player name the attack, the decision, and a route they could try next time? If the answer is “I was in a wall” or “the attack was invisible,” content production should pause until that failure is fixed.

## 4. Random runs need a stable grammar

**Documented:** Risk of Rain lists randomly chosen stages, enemies, bosses, items and unlocks. **Inference:** randomness stays engaging when the player recognizes each part and can infer the new combination. Randomly placed objects are not automatically replayable. A stage needs readable entrances, cover, climb routes and threat lanes; an enemy needs a readable tell; an item needs a clear use. Once those pieces are reliable, recombination creates new decisions.

BLACKSITE SHIFT's run seed currently chooses among five authored cover layouts per sector, six encounter orders, machine configurations and reward offers. Boss arenas are stable. The first wave uses a forgiving teaching layout. That is an appropriate progression from authored content to recombination. Each seed should reproduce enough of the run to diagnose an error: bay, order, station mode, crew spawn, enemy entry and offers. If an issue cannot be reproduced from the seed, the report should include the state snapshot and version.

For time pressure, seeded variation should change *which decision is tempting*, not whether the clock applies. A room with an elevated marksman and a low machine station asks whether to spend time taking the height or operate under fire. Another with a short flank route and a fragile recovery asks whether a teammate should retrieve it while the others clear. Both still use the same 30/60 pressure language. The player learns a consistent rule and adapts to a new arrangement.

### A finite escalation table

Unbounded exponential growth is not required to express the original game's urgency. This is a proposed table for BLACKSITE's first nine-wave run; it retains current implemented thresholds and gives the designer a visible envelope:

| State | What changes | What stays bounded |
| --- | --- | --- |
| 0–29 s active combat | The planned encounter order enters at its normal cadence. | No time reinforcements. |
| 30–59 s | One additional enemy is queued; cadence increases modestly. | Active-enemy and major-windup caps still apply. |
| 60 s onward | One final time reinforcement is queued; cadence reaches its encounter maximum. | No further time enemies from this system. |
| Overtime active | Named hazard cycles faster or stays active, depending on sector; bonus draft on clear. | One encounter; shown before vote; tie is safe. |
| Missed work order | One contract strain, up to two, affects a later encounter. | A success relieves strain; no infinite debt spiral. |

The first three rows are implemented in essence, though exact cadence remains a tuning target. This table is not a claim about the 2013 game's formula. It translates *time has a cost* into a finite, four-player-readable system.

## 5. Character and item variety should produce different time strategies

The original lists unlockable survivors and over 100 items. **Inference:** different base kits change what time is worth. A durable close-range survivor might clear a risky chest lane faster; a ranged survivor might spend more time securing distance; a support build might turn a slow recovery into an efficient team reset. BLACKSITE SHIFT's four classes already have distinct roles and longer cooldown skills. Their time strategies can be made explicit without making one class mandatory.

| BLACKSITE class | Existing kit reason to spend time | Existing reason to advance | Proposed test question |
| --- | --- | --- | --- |
| Vanguard | Bulwark can hold an exposed machine lane for a limited 6 s. | Its 28 s cooldown makes repeated holds expensive. | Does the guard create a real operator window? |
| Breacher | Shockwave interrupts a close threat and opens 2 m of space. | The short-range scattergun clears quickly when the crew commits. | Can the player clear a station approach with one skill? |
| Runner | Overclock accelerates fire and movement and refills a magazine. | It can finish a marked threat before the next pressure step. | Does speed create a route choice beyond raw DPS? |
| Medic | Rally Pulse can revive nearby crew and restore health. | A saved crew member can finish an encounter faster. | Is a revive timing decision visible to teammates? |

This is not a call to rebalance class numbers from a document. It is a test plan. Record whether players can explain why they delayed or hurried, not only their completion time. A class that always chooses the same option regardless of room and build has too little strategic range.

Items should sometimes change how the crew spends time. A faster reload can reduce exposure during a station hold. A post-dash mark can reward an aggressive route. A field scanner might make a slow, risky machine worth operating because it reveals a future hazard. A simple damage increase can be an appropriate reliable choice beside such items. The critical rule is that the draft should not require a player to wait through combat to discover that a card's condition never occurs.

## 6. Co-op pressure needs a shared rule and personal agency

The original supports online co-op with up to four total players. **Inference:** a shared clock magnifies disagreement: one player may want to search while another wants to leave. BLACKSITE SHIFT should not let the host silently settle that conflict during combat. Overtime already has the correct form: its hazard and reward are shown, every connected living crew member gets a vote, and a tie chooses stable. Personal augment and weapon drafts avoid first-click-wins loot. The safe service phase gives a known decision window and does not increase encounter pressure.

**Proposal for a future recovery decision:** one optional recoverable object per selected encounter, with a 2.5 s exposed hold and a shared information reward. It can be skipped without invalidating a run. One player operates, the others cover, and the result is logged for everyone. A departing player releases the hold; a disconnected player does not take the reward with them; a dead player cannot vote on an ongoing combat choice because there is no combat-time vote. The Overtime vote still occurs after clear. These rules keep a Lethal Company-like work decision within a Risk of Rain-like time envelope while preserving BLACKSITE's shooter pace.

## Concrete BLACKSITE prototype: pressure-aware machine gallery

Build one fixed room with a machine on a lower lane, a half-wall crossing, one raised service deck and two safe enemy entries. At 0 s, a repair tech supports a plated sentinel. At 20 s, a light flanker enters. At 30 s, one time reinforcement is queued and signaled from a different legal entry. At 60 s, the second and final time reinforcement is queued. The machine calibration takes enough attention that the operator cannot aim, and the crew must choose whether to protect them before or after removing the repair tech. An optional Overtime setting speeds the gallery's powered floor hazard for one encounter and awards a second augment draft on clear.

These specific enemy placements and room shape are a **proposal**, not implemented content. The room should be run with all four starter classes and no upgrades, then with varied builds. Test the following:

1. Before the first pressure step, each player can state what the countdown means and whether operating now risks another entry.
2. The operator can finish calibration with intentional cover, not by luck or by hiding in an unreachable corner.
3. Both reinforcement entries are legal and give a visible approach; no new enemy materializes inside a wall or on a player.
4. A 2–2 Overtime tie stays stable. A passed vote names the hazard and reward and affects only this encounter.
5. The squad can explain a loss in terms of route, timing or target order; not ambiguous telegraph overlap.
6. After the clear, the pressure clock stops and all living players can read their personal drafts without a penalty.

If the optimal strategy is always “ignore the machine, rush the exit,” the machine payoff is too weak or its time cost too large. If the optimal strategy is always “operate every station immediately,” pressure is too weak or the machine is too strong. The goal is an intelligible situational choice.

## Current state, gaps and next work

| Priority | Action | Acceptance |
| --- | --- | --- |
| Implemented in this pass | Show time to the next bounded pressure reinforcement in the HUD. | The display follows server pressure bands and says when the two-step limit is reached. |
| Next | Measure completion time, machine use and pressure bands across the same seeded room. | Different classes and builds choose different valid timings; the clock is understood. |
| Next | Add a causal incident-report line for pressure, work order and hazard death. | A defeated crew can identify a meaningful change for a replay. |
| Next | Build one optional exposed recovery in a fixed authored room. | The squad makes at least one deliberate cover/route decision; no routine cleanup delay. |
| Later | Expand seeded room combinations only after route validation. | Same seed reproduces entries; every entry has clearance and an escape route. |

Risk of Rain (2013) supplies a sharp production rule: time should turn optional value into a meaningful choice, while failure stays legible. BLACKSITE SHIFT keeps a finite three-sector structure, safe service decisions, physical machinery, four-player Overtime voting and a grimmer industrial story. A pressure system earns its place only when players know what it costs and can choose differently because of it.

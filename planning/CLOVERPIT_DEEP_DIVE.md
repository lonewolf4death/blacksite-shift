# BLACKSITE SHIFT — CloverPit reference deep dive

Prepared October 30, 2026. This note separates documented reference features from original BLACKSITE decisions. It is based on the [official CloverPit store page](https://store.steampowered.com/app/3314790/CloverPit/) and [developer announcements](https://steamcommunity.com/app/3314790/announcements/), plus the current BLACKSITE source and tests. It is design research, not a claim of hands-on playtesting.

## What to take from the reference

The store page presents a confined rusty cell, physical slot machine and ATM, a debt due at the end of each round, and charms/prizes that can combine into large effects. The important relationships are:

1. **A deadline is felt through an object.** A payment due at a machine is more concrete than an unseen difficulty number. A player can look at the object and understand that the next choice has a cost.
2. **A small space makes the choice ritual legible.** The environment repeatedly brings the player back to the same readable objects. The visual texture of neglect gives the routine an uneasy tone.
3. **Build combinations answer mounting pressure.** The point of items is to alter the next decision and trigger chain. A larger number alone is less memorable.
4. **The loop has a visible accounting moment.** Players can see whether their last set of decisions was sufficient and what burden remains.
5. **Escalation needs a curve.** A developer update describes smoothing Hard Mode deadline scaling instead of applying a flat doubled deadline. That supports a gradual, readable pressure curve in our own system; it does not prescribe copying the exact balance.
6. **Readability is part of mood.** Developer notes describe reduced flashes and more legible poster text. Grim presentation should still let players identify controls and threats.

The source does **not** imply that BLACKSITE should have a slot machine, monetary debt, a copied cell, charm symbols, or gambling. Those would disrupt a tactile co-op shooter and reproduce recognizable reference content. Our translation is a contractor's maintenance order and a physical industrial control.

## BLACKSITE translation, implemented in 0.21

The moment-to-moment sequence is: read the current work order, fight, decide whether to operate the wall machine, meet or miss the order, inspect the account on the service terminal, select equipment, then decide whether to authorize Overtime for the next encounter. The player repeatedly sees *a named obligation, a specific mechanism, and a settled consequence*. The industrial setting carries this loop through switchgear, steel housings, amber warnings, dirty glass, engraved control plates, motor sounds, and the contractor's terse announcements.

### The physical control

Each sector retains a common service console at the same learnable wall position. A pressure dial, lever, three arming lamps, and screen progress bar express the hold duration. The server owns the 0.65-second authorization and permits one operator at a time. Releasing the key, leaving 2.2 m reach, losing line of sight, disconnecting, or being downed cancels the hold. The machine then gives the existing 1.25-second central warning and uses a shared 17-second cooldown. There is a click on contact, a warning on authorization, and a larger impact at the cycle. The core attack warning stays visible even when reduced flashing is enabled.

This operation should feel like pulling a dangerous plant control, with enough delay to make a conscious commitment. It should never secretly activate because someone brushed a key while traversing. The console's material, gauge, and lamps are physical affordances; the HUD repeats the current state because a four-person firefight may hide the wall.

### One work order per encounter

Wave one always chooses Controlled Processing so players have a reason to discover the machine. Each sector has one of each order, with the order within the sector derived from the run seed. The assignment is published at entry. It is never required to clear a wave, so a missed order does not trap the run.

| Order | Server condition | Player behavior it asks for | Failure cause |
| --- | --- | --- | --- |
| Controlled Processing | One machine cycle strikes two distinct hostiles; on a boss encounter it must strike the boss once. | Move hostile bodies into the center, coordinate the operator and bait, then leave the zone before impact. | Killing the wave before processing enough targets, mistiming the machine, or allowing targets to escape. |
| Deadline Clearance | Complete a normal encounter within 55 active-combat seconds, or a boss encounter within 100. | Maintain pace, pursue stragglers, weigh a revive or machine setup against the clock. | Clearing after the displayed threshold. Safe service time does not count. |
| Signal Integrity | No operative is downed before the clear. | Guard an exposed ally, prioritize a dangerous windup, pull back rather than chase damage. | Any operative falls, even if later revived. |

The three rules deliberately address different combat verbs: **position and operate**, **push and finish**, and **protect and recover space**. The first can combine with Gravity Canister, Harpoon, Breacher displacement, Cryo slow, or Vanguard guard in ways that change where players fight. The speed order rewards decisive shooting and routing. The intact order can make a Medic's Rally or a defensive Overtime vote more valuable than raw damage.

### Sector account and bounded strain

At wave clear, the host settles once. A verified order adds one sector credit (displayed as progress toward a two-credit bonus) and removes one strain. A missed order adds one strain, capped at two. Each strain point authorizes exactly one extra reinforcement in the *next* encounter, including a boss encounter. The normal director already caps simultaneous enemies and major windups, so these reinforcements increase total work without producing a large instantaneous attack overlap. Strain carries between sectors; credit starts again on sector entry. If the crew has earned at least two credits by the third encounter's clear, every survivor receives an extra personal augment draft. Overtime can add another draft, making three possible after a boss.

This is a small accounting loop rather than a debt economy. It expresses the facility's mounting demands in the number of threats players actually face. The cap and success relief prevent a failed early encounter from making the rest of the run unrecoverable. The final encounter can still settle for bonus equipment and an incident record; it does not promise reinforcements after extraction.

### Relationship to Overtime

An Overtime protocol remains an explicit vote between encounters. It advertises the hazard and personal reward in advance. A strict majority approves it; a tie stays stable. It lasts one encounter. The work order is an independent contractor target, so the squad has two different questions: *Can we satisfy the job specification?* and *Do we want to accept an additional hazard for another draft?* The ledger and terminal place those facts together, allowing a crew to judge its current strain before voting. The host has no silent override during combat.

### Interface and audio hierarchy

The player's first visual priority is an imminent threat: enemy windup, floor hazard, machine center warning. Next comes the current work order, with a compact live measure (targets processed, seconds left, or crew signal). The service terminal expands that into result, sector credit, strain, and next encounter's extra reinforcement count. The manual gives exact rules and counts. Ambient lighting, sector pulse strips, and grime remain subordinate to attack telegraphs. Reduced Flashing Lights steadies decorative 3D pulses and DOM animation while preserving static warning shapes and colors.

Sound should communicate three separate moments: the low control click confirms a hold began, the warning tone confirms authorization, and the machine impact confirms it fired. An aborted hold has a short falling tone; there should be no major impact sound until the authoritative cycle. Machinery remains heavier and more ominous than the weapon UI, while gunshots retain their cadence and impact identity. Spatial attenuation keeps a teammate's distant use audible without overpowering local danger.

### Story through the job

The contractor describes employees as material losses; signs and controls reveal what the plant was built to do. A work order such as Controlled Processing implies that management values throughput even in a combat emergency. A missed order authorizes more automated force. A verified one pays equipment credit. This supports the established premise without a cinematic interruption. The final report can be terse because the run's labor and machine behavior already told the story.

## Design tests and remaining tuning

- **Teach:** A first-time player should notice the control, hold it, and predict the center strike during the first wave. If not, improve line of sight, control lamp contrast, or the first-wave announcement before adding another tutorial panel.
- **Tradeoff:** In a four-player fight, a machine order should produce a deliberate lure/trigger/evade call. If players can satisfy it accidentally, require a more specific interaction; if they ignore it because the cost dominates, reduce target count or shorten warning.
- **Pressure:** A failed order should be visible in the *next* wave and remain bounded. Count reinforcement spawns and check that the 2-strain cap never exceeds two extras.
- **Fairness:** Two credits should be earnable with varied builds. A missed first order must not close off the sector bonus if both later orders succeed.
- **Stacking:** A boss clear with Overtime and two credits should offer three independent drafts. The service timer must resolve all three when a player is AFK.
- **Readability:** During four-player effects, players must still see the machine's marked zone and a boss warning. Reduced flashing should not remove those warnings.
- **Tactility:** Ask a tester, without UI labels, to distinguish machine hold, authorization, and impact from sound and animation alone.
- **Scope:** A future service alcove could make the terminal more spatial, but a walk to a separate room must earn its time cost. This update keeps the service menu fast and keeps the physical control in combat, where the decision changes behavior.

Automated checks cover deterministic order selection, capped strain and credit settlement, held-operation cancellation, exclusive operation, and existing machine warning/cooldown behavior. Full feel and four-player readability still require human play sessions; the prototype has not been represented as playtested.

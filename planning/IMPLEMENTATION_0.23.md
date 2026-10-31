# BLACKSITE SHIFT — deep-dive implementation pass, v0.23

This pass uses the eight detailed reference studies as design inputs for BLACKSITE SHIFT's existing first-person, four-player executable. It keeps the contractor premise and the four pillars: tactile guns, visible adaptation, shared industrial danger, and controlled escalation. The references supply problems to solve; the rules, names, spaces, weapons, and interface here are original to this game.

| Study | Playable change in v0.23 | Decision the change should create |
| --- | --- | --- |
| [CloverPit](CLOVERPIT_DEEP_DIVE.md) | The established hands-on Valve, Circuit, and Pressure machines now interact with two new machine augments and Overtime's fault and recharge modifiers. | An operator chooses a contested station and asks whether protection or a post-calibration firing lane makes the risk worthwhile. |
| [Lethal Company](LETHAL_COMPANY_DEEP_DIVE.md) | Six named Overtime conditions state hazard and reward before a strict-majority crew vote. The encounter report exposes individual and crew contributions. | The squad can explain why it accepted an extra job, who guarded the operator, and whether it paid off. |
| [Deadzone: Rogue](DEADZONE_ROGUE_DEEP_DIVE.md) | Thermal Borer adds a base weapon with penetrating bolts, heat, a control threshold, and a vent. Its behavior is described numerically in the armory and manual. | A shooter chooses short sustained bursts or a deliberate high-heat slowing burst, then manages the recovery window. |
| [Risk of Rain (2013)](RISK_OF_RAIN_2013_DEEP_DIVE.md) | Feed Debt and Audit Sweep add a known encounter time cost: extra reinforcements and slower machine reuse. Existing 30- and 60-second pressure bands still advance only in combat. | The crew decides whether to spend time on a machine while the reinforcement clock continues. |
| [Risk of Rain 2](RISK_OF_RAIN_2_DEEP_DIVE.md) | Two more authored bay variants per sector, Filter Stack and Rejected Goods, join the seeded geometry mix. Entry and machine placement still use free-space checks. | Height and half-wall routes change firing angles and which station is worth holding. |
| [Gunfire Reborn](GUNFIRE_REBORN_DEEP_DIVE.md) | Control Splice and Service Ward extend the equipment/augment/class layers already in the run. Both augments have specific ranges, durations, charges, and tradeoffs. | A class can take a machine-facing role without requiring a particular starter weapon or a pure damage stack. |
| [Megabonk](MEGABONK_DEEP_DIVE.md) | Bank Signal supplies another cross-weapon combination, while the report shows damage, support, machinery, and reactions. Remote shot audio is throttled and warning cues briefly lower the ambience. | Players can identify an action that made a build work without losing dangerous tells beneath four-player spectacle. |
| [SYNTHETIK: Legion Rising](SYNTHETIK_DEEP_DIVE.md) | Thermal Borer's heat/vent loop is a gun-specific handling rule. A precision reload removes 30 heat, while unlimited reserve ammunition remains. | Good weapon operation matters during the fight, but a missed timing input never strands a player without ammunition. |

## Rules shipped in this pass

- Thirteen guns, 40 augments, seven named bay layouts per sector, and six Overtime protocols (two per sector) are in the current source build.
- Overtime lasts one encounter. The terminal publishes the hazard and extra personal augment draft before voting. A strict majority of living, connected crew must approve it; a tie stays on Stable Route. The host has no hidden override.
- Feed Debt adds three reinforcements, a 1.2-second calibration fault lockout, and a 21-second station cooldown. Whiteout adds two reinforcements, a 2.4-second active frost window, and a 3.2-second slow. Audit Sweep adds four fast reinforcements, a 1.1-second fault lockout, and a 23-second station cooldown.
- Bank Signal marks a surviving target after a wall-bounced hit for the next crew damage event to deal 30% more damage. Control Splice grants three extra-pierce trigger pulls after calibration at a 20% direct-damage cost. Service Ward grants nearby crew 25% damage reduction for four seconds after calibration.
- The service report records each player's damage, kills, skill use, revival, guarding, machine work, bank hits, status reactions, and reload timing. It is feedback for choosing a next build, not a quota gate.

## Acceptance work still requiring people

Automated tests cover the new selection and combat rules, room entry, machine interaction, and four-client protocol. A packaged Windows build checks that the executable can be made from the current source. These checks do not establish that the starter guns can be recognized blind, that the hardest four-player build remains readable, or that Overtime prompts a memorable crew decision. Those require hands-on solo and four-player sessions with audio enabled. In particular, test Filter Stack and Rejected Goods on every sector transition, several Thermal Borer heat cycles, and two consecutive Overtime votes with a tie.

The facility still treats its maintenance crew as raw material. Signs, equipment details, machine behavior, and brief announcements deliver that story; this pass adds no cinematic campaign.

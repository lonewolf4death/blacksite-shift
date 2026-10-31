# BLACKSITE SHIFT — active machinery and bay geometry

Implementation record for v0.22. The prior [CloverPit deep dive](CLOVERPIT_DEEP_DIVE.md) explains why a physical, consequential decision belongs in the run. This pass changes the control from a brief hold into an active job performed under fire.

## The squad decision

An operator presses F at a station. The first person to connect owns that station until they finish, abort, leave reach, disconnect, or are downed. The operator uses A/D to change the selected channel and Space to seal the current stage. Their movement and fire are suspended in the client, and the server refuses weapon fire while the session is active. Combat, enemy projectiles, pressure escalation, hazard cycles, and teammate actions continue. Other players can cover the operator, draw enemies into the machine's target area, or retreat. An operator can abort with F or Escape; a down or loss of line of sight cancels automatically. Damage jams input briefly and resets current pressure stability, but does not destroy all prior stages.

Every station broadcasts its operator and progress in room state. The game panel shows its exact rule, selected and required channels, stages, faults, a moving timing needle or pressure stability meter, and a visible cancellation command. Server state owns targets, sweep, drift, locks, mistakes, authorization, warning, and cooldown. Client input is limited to selection and commit intentions. A disconnected or malicious client cannot send a direct activation message through the network.

| Station pattern | Bay supply | Task | Minimum sustained commitment |
| --- | --- | --- | --- |
| Valve Cascade | Three stations, three distinct strike positions | Select each marked one of three valves and seal three stages. The contactor recovers for 1.5 s between seals. | 3.7 s plus actual selection time. The crew can split between several low-complexity machines. |
| Circuit Bridge | Two stations, separate strike positions | Select each marked one of four circuits and seal during a moving scan window. Three stages; a faulty seal delays the next attempt. | Multiple timing passes and a 1.1 s recovery between successful stages. The operator must watch the scan while the team protects them. |
| Pressure Balance | One station | Adjust one of five pressure values to each marked target, hold it stable for 1.7 s, and seal four stages. Automatic drift shifts the setting every 2.4 s. | More than 6.8 s of stable time, plus adjustments, drift correction and contactor delays. Boss rooms always use this pattern. |

Wave one always uses three Valve Cascade stations to teach the interaction with forgiving options. Later normal rooms choose among five authored bay layouts, which map to three easy, two medium, or one hard station. Boss rooms keep their stable cover layout and have one pressure station. A machine's attack waits 1.25 s after calibration completes, then cycles inside its own marked circle. Each station has its own 17 s cooldown. The processing work order counts distinct targets struck across any station; on a boss wave, the boss itself must be struck.

## Bay geometry and combat rules

Each sector now has five authored cover arrangements plus its fixed boss arrangement. Full walls remain tile 1. Waist-high barriers use tile 2: they block actors and low projectiles below 1.08 m, while allowing standing shots to pass above. Walkable equipment decks use tile 3: their outer half-tile slopes to a 0.62 m top. Server and client share the same floor-height function. Player camera, outgoing projectile height, enemy models, and enemy shots follow the actual deck elevation. Low cover and raised decks are included in deterministic seeded layouts; the stage entry and machine station selection validate safe floor space.

The new geometry is intended to create a reason to move: fire over a half wall, climb a sloped deck for a clearer lane, abandon that vantage when a sniper or floor hazard marks it, and choose which machine radius best catches a group. All machine warning circles remain visible regardless of the reduced flashing setting. Full-wall collision, navigation, safe crew entry, and machine station clearance are checked in tests.

## Playtest gates

1. A first-time player can discover the F prompt, identify A/D and Space, and complete the easy machine without leaving the game to read a guide.
2. An operator notices when a teammate covers them. A solo operator understands that the encounter continues and can abort promptly.
3. The circuit needle and pressure stability display remain readable when four players fire effects nearby; machine attack warnings and boss windups retain visual priority.
4. A low barrier blocks a low shot and permits a standing shot. A deck's rendered slope agrees with camera height and projectile collision.
5. No seeded bay places a station in solid cover or inside its own strike radius. Every four-player entry remains separated and clear.
6. An early failure still permits the squad to win the wave, and no minigame can silently bypass the Overtime vote or overwrite personal loot decisions.

Automated tests verify station counts and positions, deliberate valve input and timing, refusal of blind circuit and pressure commits, low-shot cover behavior, deck height, deterministic layouts, four-player entries, and multiplayer flow. Manual feel and readability should be evaluated with human play sessions before release balancing.


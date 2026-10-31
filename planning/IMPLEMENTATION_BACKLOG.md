# BLACKSITE SHIFT — implementation backlog

Prepared October 29, 2026 for a solo developer with AI assistance. Read the [production plan](PRODUCTION_PLAN.md) for the design, evidence, scope and effort estimates. These are proposed tasks; none is marked complete merely because a similar feature exists in the prototype.

## Working rules

- Work in milestone order, using dependencies to keep the active list small.
- Close a task only when its acceptance condition is observed in a packaged build or an appropriate meaningful test.
- Keep remote-player behavior in scope for every combat feature.
- Keep the current prototype recoverable. Adopt a production stack after B09.
- Treat content counts as ceilings to earn through testing.
- Record build ID, relevant content IDs and reproduction details for failures.
- Use AI assistance for bounded implementation, tools, research and diagnosis; the developer verifies feel, quality and scope.

## First 30 working-calendar days

This example assumes approximately 30 focused hours per week. It starts the combat foundation; it does not deliver the polished slice in one month. Move unfinished work forward rather than declaring a partial system complete.

| Period | Primary work | Reviewable output |
| --- | --- | --- |
| Week 1 | Preserve/reproduce prototype; targeted reference sampling; establish room scale; select and pin a candidate stack | Baseline build, concise decision log, test room and first connection proof |
| Week 2 | Two-machine lobby/transport flow, predicted movement, one gun and one enemy; collect timing/network data | Two people can play the same small encounter from separate machines |
| Week 3 | Improve shooting/reload, obstruction checks, input settings; three graybox weapon identities and damage rules | A repeatable five-minute combat test with logged discrepancies |
| Week 4 | Two enemy roles, room completion, a single upgrade and Overtime experiment; outside observation | Recorded mini-loop and a prioritized list of problems to resolve before art expansion |

If connectivity or the motor fails, spend the later weeks resolving it. The production gate is evidence, not elapsed time.

## M0 — baseline and stack decision

| ID | Task and dependencies | Acceptance condition |
| --- | --- | --- |
| B01 | Preserve and reproduce the existing prototype | A recoverable source baseline exists; its documented Windows build and all 11 existing tests can be reproduced, with environmental exceptions recorded. |
| B02 | Conduct targeted reference sampling | Record observations for each of the ten references: combat/readability where applicable, reward cadence, decision time, visual vocabulary and what serves this game's pillars. Clearly separate observation from inference. |
| B03 | Establish source/asset records | Every imported asset/package has its origin, version and license recorded; source art and generated exports have clear locations. |
| B04 | Create candidate project and version manifest; follows B01 | Exact editor, renderer, networking and transport versions are recorded; an empty Windows build runs on a second machine. |
| B05 | Prove intended connection flow; follows B04 | Two separate computers/accounts connect through the selected lobby/transport path; a full lobby and incompatible version return useful errors. Verify intended relay/API behavior. |
| B06 | Prove predicted movement; follows B04–B05 | Host and remote can move, turn, jump and dash; corrections are measured under 100–150 ms RTT and representative loss. No routine collision escape occurs. |
| B07 | Prove one weapon and enemy; follows B05–B06 | Local feedback is immediate; host determines damage; both players agree on ammunition, health and death. |
| B08 | Prove offline solo and lifecycle cleanup; follows B04 | A solo encounter starts without an online-service request; returning to menu and starting again leaves no duplicate managers, actors or callbacks. |
| B09 | Record stack decision; follows B05–B08 | Evidence covers connection reliability, responsiveness, build reproducibility, package/license costs and known limitations; one production path is selected. |

## M1 — combat foundation

| ID | Task and dependencies | Acceptance condition |
| --- | --- | --- |
| B10 | Add diagnostics and a repeatable stress scene; follows B09 | Build ID, run ID, frame/simulation timing, bandwidth, entity counts and input/correction data can be captured without editing gameplay code. |
| B11 | Implement input and motor settings; follows B06/B09 | Rebinding, sensitivity, FOV, sprint behavior, focus loss and early controller input work; chosen values persist. |
| B12 | Implement camera/muzzle obstruction checks; follows B07 | Shots cannot pass through nearby cover; different FOVs and aspect ratios do not alter the authoritative aim rule. |
| B13 | Implement firing, reload, swap and interruption states; follows B07 | Spam, swap/reload overlaps and stale commands cannot duplicate shots or ammunition; remote presentation remains consistent. |
| B14 | Complete three graybox weapon identities; follows B12–B13 | Carbine, shotgun and arc weapon have distinct handling and feedback; both local and remote players can identify them in play. |
| B15 | Implement damage/status foundation; follows B07 | Tests cover stacking categories, resistances, critical behavior, status expiration, owner attribution and recursion/target limits. |
| B16 | Implement pursuer and ranged enemy; follows B15 | Each has readable preparation, attack, recovery and death; both navigate the test room and retarget after a player leaves. |
| B17 | Implement encounter/attack budgeting; follows B16 | Spawns avoid invalid space and unfair close entrances; simultaneous dangerous attacks obey explicit budgets. |
| B18 | Validate stress behavior; follows B10/B14–B17 | A logged worst-case test demonstrates caps, stable cleanup and acceptable host/client timing; failures produce concrete bottleneck tasks. |
| B19 | Run combat foundation gate; follows B11–B18 | At least five outside observations establish that a short encounter is enjoyable without rewards and identify remaining handling/readability issues. |

## M2 — complete slice systems

| ID | Task and dependencies | Acceptance condition |
| --- | --- | --- |
| B20 | Build authoritative run state machine; follows B19 | Lobby, loading, combat, clear, reward, service, boss, results and return transitions are consistent on host and clients. |
| B21 | Author one connected sector route; follows B20 | Four combat rooms, service access and boss arena can be traversed without softlocks; loading has a timeout/failure path. |
| B22 | Build personal reward drafts; follows B15/B20 | Each player receives valid independent offers, capped items are excluded, choices persist through transitions, and duplicate messages cannot grant twice. |
| B23 | Author eighteen standard modules; follows B22 | Every module has an understandable card, valid stack behavior, observable combat effect and appropriate replication; at least three build routes work. |
| B24 | Build three major graft choices; follows B23 | Each changes combat behavior and has a recognizable presentation; choices serialize and restore correctly. |
| B25 | Build one Overtime interaction; follows B20–B22 | The squad sees hazard/reward, votes, resolves ties predictably and receives exactly the promised result after success. |
| B26 | Build first boss; follows B17/B20–B21 | Three different attacks, positional mechanic, recovery opportunity and phase change work in solo and four-player tests. |
| B27 | Add bruiser and support enemy; follows B16–B17 | Their roles change positioning/target choice; combined encounters remain understandable, including with the boss. |
| B28 | Build ready checks, squad HUD and pings; follows B20 | Players can communicate route, danger and revive needs; draft completion and departure are unambiguous without voice. |
| B29 | Build downed/revive/spectate rules; follows B15/B20 | Solo recovery, teammate revive interruption, elimination and checkpoint respawn all have consistent host-owned outcomes. |
| B30 | Build disconnect and reconnection proof; follows B20/B29 | A briefly disconnected player can reclaim the reserved identity/build from a live host; expiry and failure paths are clear. |
| B31 | Define/test profile and checkpoint schema; follows B22/B24/B30 | A safe-boundary save restores relevant build/run state; an interrupted write recovers a valid backup; schema/content incompatibility has an explicit outcome. |

## M2 — presentation, generation and outside test

These tasks complete the same slice milestone. Art exploration can start earlier, but final production should use the validated room and combat scale.

| ID | Task and dependencies | Acceptance condition |
| --- | --- | --- |
| B32 | Finish reference room and environment kit; follows B21 | One room establishes materials, texture density, lighting, collision, signage and performance; low-effects/brightness settings preserve navigation and threats. |
| B33 | Finish weapon presentation; follows B14 | Three guns have complete viewmodels, fire/reload/swap animation, local/remote sound and bounded effects. |
| B34 | Finish player rigs and graft representation; follows B24 | First-person arms and remote crew bodies animate consistently; grafts do not obstruct aiming or hide teammate identity. |
| B35 | Finish enemy/boss presentation; follows B26–B27 | Silhouettes, tells, hit responses, death and key sounds remain readable in the stress scene. |
| B36 | Build sound priorities and room ambience; follows B33/B35 | Four simultaneous weapons do not drown out important warnings; volume settings and positional behavior work. |
| B37 | Finish UI and onboarding; follows B22/B28/B31 | First-time users can start, understand an offer, revive, finish and return without developer narration; text remains clear at tested resolutions. |
| B38 | Add accessibility/comfort baseline; follows B11/B37 | Input remapping, text scale, color-independent cues, subtitles for critical speech, and adjustable shake/bob/filters are tested. |
| B39 | Add constrained room assembly; follows successful authored-route tests in B21 | A host-selected versioned manifest loads on all clients; rooms/variants differ while required paths stay valid. |
| B40 | Add generator validation and fallback; follows B39 | Thousands of generated manifests pass reachability/spawn checks or fall back safely; failing seeds/manifests are retained. |
| B41 | Establish repeatable packaged slice build; follows B31–B40 | A clean machine can install/run the build; logs and versions are identifiable; return/restart and repeated runs do not accumulate state. |
| B42 | Run outside squad tests; follows B41 | Solo, two- and four-player sessions occur over real separate networks; usability, performance, joins, disconnects and repeat-run interest are recorded. |
| B43 | Decide whether to expand; follows B42 | Critical slice problems are fixed or explicitly rescope the project; budget/schedule are revised from measured work. |

## M3–M4 — Early Access candidate

| ID | Task and dependencies | Acceptance condition |
| --- | --- | --- |
| B44 | Finish unlock/profile progression; follows B43 | New players have a winning baseline; mixed-progression squads remain viable; rewards are not duplicated by reconnection or restore. |
| B45 | Harden suspend/reconnect/update recovery; follows B31/B43 | Safe-boundary suspension, supported older saves, failed writes and expired reconnects pass the documented matrix. |
| B46 | Finish lobby UX and optional public flow; follows B05/B30/B43 | Invites, filters, slot reservation, kick/block, version rejection and host-loss communication work in release builds. |
| B47 | Produce the second sector and Early Access roster; follows B43 | Two suits, six guns, thirty-six modules, six grafts, eight regular types/variants and two bosses meet the same definition of done as the slice. |
| B48 | Balance economy, pacing and player-count scaling; follows B44/B47 | Recorded runs support clear risk/reward and sensible encounter duration; personal resources and catch-up choices work across departures/joins. |
| B49 | Complete controller, comfort and content consistency pass; follows B38/B47 | All menus/actions work with supported inputs; no sector or weapon lacks required settings, cues, text or audio. |
| B50 | Prepare store materials and controlled Playtest; follows representative B47 content | Screenshots/trailer reflect actual gameplay; current platform requirements, content survey, credits and licenses are reviewed. |
| B51 | Run Early Access release-candidate matrix; follows B45–B50 | Clean installs/updates, real-network squads, supported saves and performance targets pass; no known routine blocker remains. |
| B52 | Release readiness decision; follows B51 | Current playable value justifies the price, required review is complete and time/support resources are reserved for patches. Publishing remains a separate user decision. |

## M5 — full release

| ID | Task and dependencies | Acceptance condition |
| --- | --- | --- |
| B53 | Revise priorities from actual play evidence; follows B52 | Weak encounters/items are identified and addressed; requested additions have explicit cost/scope decisions. |
| B54 | Produce final sector and ending; follows B53 | A complete three-sector run has a clear conclusion, final boss and reliable results/unlock flow. |
| B55 | Complete approved roster and difficulty options; follows B53 | Three suits, eight guns, sixty modules, nine grafts, twelve regular types/variants and three bosses have valid interactions and finished presentation. |
| B56 | Finish supported localization and accessibility checks; follows B54–B55 | Text expansion, font coverage, input prompts, subtitles and settings are checked in supported languages and inputs. |
| B57 | Harden compatibility, cleanup and performance; follows B54–B56 | Supported save updates, strongest builds, repeated runs, network degradation and long-session tests pass on representative hardware. |
| B58 | Prepare final release candidate and support plan; follows B57 | Stated full-release features are complete; store materials match the build; rollback/update and patch processes are rehearsed. |

## Targeted hands-on research questions

Budget roughly 12–20 hours for an initial sampled pass where copies/demos are available. Deeper study can follow specific design questions. This work has not been performed as part of the desk research.

| Reference | Question to answer with observation |
| --- | --- |
| CloverPit | Which object proportions, sounds and interactions make a small room feel physical and oppressive? |
| Project P.I.T.T. | How does a limited art vocabulary make machinery and industrial scale understandable? |
| Lethal Company | Which spaces, sounds and shared decisions create memorable cooperative tension? |
| Deadzone: Rogue | How quickly do weapon/augment changes become perceptible, and which FPS threats remain readable under effects? |
| Risk of Rain 1 | When does spending more time become an interesting choice rather than simple punishment? |
| Risk of Rain 2 | What combinations of authored terrain, encounters and rewards make repeated visits feel different? |
| Everything is Crab | Which evolutions change strategy enough to feel like a different build? |
| Gunfire Reborn | How do personal choices and team transitions keep different players engaged? |
| Megabonk | How often does a reward visibly change power or behavior, and when does visual density become difficult to read? |
| SYNTHETIK | Which handling mechanics create mastery, and how much input/attention do they demand? |

For each observation, record the situation, player action, feedback, resulting decision and applicability to this project. A screenshot or note without that connection is less useful than a concrete design question answered.

## Definition of done for a production content item

An item, enemy, weapon, graft or room is complete when its behavior is implemented, ownership/state rules work in co-op, its UI/data are valid, its audio/visual presentation is finished, it saves/restores where applicable, its performance is checked, and relevant failure modes have been tested. A numerical roster entry alone is not finished content.


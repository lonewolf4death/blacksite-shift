# BLACKSITE SHIFT — Megabonk reference deep dive

Prepared October 31, 2026. This expands Section 3 of [PRODUCTION_PLAN.md](PRODUCTION_PLAN.md) and the short [reference-development entry](REFERENCE_DEVELOPMENT.md). I reviewed the developer's Steam store page and official update notes, then compared the documented systems with BLACKSITE SHIFT's current code. This is a research and design study, not a report of hands-on play. **Documented** is supported by the linked developer source, **inference** is an analysis of its design effect, and **proposal** is original BLACKSITE content that is not in the executable unless marked implemented. Prototype values below are not reverse engineered Megabonk values.

## Sources and version notes

| Official source | Documented evidence | Design question |
| --- | --- | --- |
| [Megabonk Steam page](https://store.steampowered.com/app/3405340/Megabonk/) | Third-person 3D survival roguelike; randomly generated maps, hordes and bosses, XP from kills, random upgrade offers with rarity, 20 characters, 70+ items and 240 in-game quests as currently advertised. Its store features list single-player. | How do frequent changes and map traversal make a run feel different without replacing manual shooting? |
| [Developer launch and early patch notes](https://steamcommunity.com/app/3405340/allnews/) | Launch note advertised 20 characters and about 80 items; an early balance patch made characters faster and acceleration snappier, adjusted camera clipping, enemy spawns and teleporter transitions. | Movement feel and valid geometry are core production work, not optional polish. Counts and balance have changed after launch. |
| [Developer v1.0.17 notes](https://steamcommunity.com/app/3405340/allnews/) | Added full map with fog of war and controls for projectile/particle opacity; distinguished a shrine on the minimap; described opacity and rendering cost at extreme density. | A powerful build needs a way to remain readable and performant. |
| [Developer Spooky Update notes](https://steamcommunity.com/app/3405340/allnews/) | Added a map, character, weapon, items, enemies, bosses, challenges, advanced settings and item feed; reported late-game FPS work and a per-tick proc cap on one effect. | New content multiplies combinations and performance work; cap event fan-out deliberately. |
| [Developer later UI and balance notes](https://steamcommunity.com/app/3405340/allnews/) | Added a display of useful stats for each weapon and unique character stats, banished-item visibility, an enemy attack indicator color option, and a change making item proc order independent of pickup order. | Tooltips, deterministic effect order and warning visibility are part of build trust. |

The store lists single-player at the time of this review. The developer's earlier notes describe multiplayer as future work. BLACKSITE must design its own four-player loot, vote, scaling and visual ownership rules; Megabonk is evidence for solo escalation and readable growth, not a ready-made co-op policy. The official sources do not establish how players actually rank every item, how long most runs last, or which late-game combinations dominate. Those claims would require instrumented play or a broader study.

## Core design reading: visible acceleration

**Documented:** Megabonk lets players defeat enemies, collect XP, level up, receive random offers of differing rarity, upgrade weapons and find items while moving through randomized maps. **Inference:** the rhythm works when progress can be *seen and felt* frequently: a new attack shape, a larger covered area, a changed route to a chest, or a character becoming fast enough to chase a different objective. Its scale and absurdity are part of its appeal, but BLACKSITE's first-person manual fire, Overtime machinery and four-player threat grammar set different constraints. The transferable idea is that a build gives repeated visible proof of change.

BLACKSITE currently gives personal augment drafts after encounters, extra drafts for Overtime and sector-account performance, a salvage-earned reroll, boss grafts and armory choices. Those are already more structured than kill-XP level-ups. Their advantage is that a player is never forced into a card menu while holding a machine lane. Their risk is that several consecutive encounters may feel the same if the choices are percentage-only or if an equipped effect has no visible cue. The next research question is not “How many items can we add?” It is “How often does a player gain a new useful action, and can they see it in the next fight?”

## 1. Model the reward cadence before expanding the pool

Do not import real-time level-up freezes into a non-pausing co-op shooter. Set a deliberate BLACKSITE cadence: each normal room clear pays one personal draft; successful Overtime pays another; a completed shared salvage quota pays one personal reroll; a sector boss pays a graft and a visible sector-account settlement. The game already implements these broad rules. Instrument time and decision *quality*:

| Moment | Existing or proposed signal | Desired player explanation |
| --- | --- | --- |
| First augment | Existing personal card from a controlled offer mix. | “My gun now rewards this action.” |
| First armory choice | Existing second firing pattern. | “I switch weapons in this situation.” |
| Salvage reroll | Existing earned replacement of all three cards. | “We earned a better chance and I used it because my offered plan was weak.” |
| Overtime payout | Existing extra draft after a voted hazard. | “The risk bought this branch of the build.” |
| Boss graft | Existing physical suit modification. | “My run now has a signature behavior.” |

Proposed telemetry: seed, class, wave, offered IDs and rarity, picked ID, choice time, reroll use, weapon switch rate, skill use, kill source, damage source and whether an augment's trigger ever fired in the next room. No personally identifying telemetry is needed for a local test; an in-memory or exported incident log is sufficient. Flag an item if it is frequently chosen but its behavior never activates, or if players cannot explain its effect after using it. A reward that changes only 3% damage may still be a useful stabilizer, but it should not be the only visible result of a critical Overtime decision.

## 2. Rarity should change a plan, not hide the rules

The official Steam page says upgrade offers vary in rarity. **Inference:** rarity creates anticipation, but a rare item disappoints if its effect is just a larger generic number. BLACKSITE's common, rare and signature labels should signal *decision complexity and possibility*, not guaranteed superiority. Keep each card specific about duration, target limit, cooldown, stack behavior and exclusions.

Proposed offer policy, to tune against real sessions:

- **Common:** one clean reliability modifier or narrow behavior change. Examples: +25% direct weapon damage, +12% movement speed, or a visible first-shot condition. A common card must be understandable in under five seconds.
- **Rare:** a new interaction with a predictable action loop. A bank-shot card, a reload-triggered slow, or a kill-then-move speed burst. State what happens when multiple copies are held.
- **Signature:** class or boss-graft style mutation that can define the run and that a teammate can observe. Offer only when its prerequisite exists or the card supplies its own enabling action.

Never let rarity be a substitute for exact math. If two effects share a keyword, the field manual should say whether they stack additively, multiply, refresh duration or select the strongest instance. If a proc can feed another proc, define that dependency explicitly. The developer's later Megabonk notes report changing item proc order so pickup order no longer changes behavior; BLACKSITE should likewise make effect resolution deterministic and independent of draft chronology unless chronology is a declared feature.

## 3. A proposed combination grammar for controlled spectacle

Megabonk advertises many item synergies, and its later patches show both numerical interactions and bugs in high-density combinations. BLACKSITE should define a compact grammar before adding dozens of cards. Four combat verbs can cover many combinations:

1. **Mark:** identify a target or lane for a limited time. An example is a harpoon target that rewards follow-up direct hits.
2. **Move:** reposition through a dash, slide, climb or controlled pull to access an angle.
3. **Convert:** turn a status, ricochet, precision reload or class skill into a distinct secondary effect.
4. **Cash out:** spend charges or a prepared condition on an intentional shot or skill.

An item combination passes only if it changes a decision, not merely a damage multiplier. Proposed examples:

| Original combination | Player action created | Failure or cost | Readability rule |
| --- | --- | --- | --- |
| **Bank Signal + Survey Thread** | Rebound a carbine round to reveal a shielded target, then move for a direct finishing lane. | Direct first hits are weaker on the variant; the reveal ends after 3 s. | One target outline, no full-screen flash. |
| **Quench Valve + Kinetic Rig** | Use a skill near hostiles to slow a pocket, then dash into the group for a controlled impact. | Requires close range and spends both long skill cooldown and dash. | One low ring per event; enemy attack marks remain stronger. |
| **Siphon Halo + Snap Freeze** | Precision reload near a machine to pulse and slow threats, creating a short operating window. | Spends the charged round bonus and asks for close timing. | Separate heal/slow icons, not stacked overlapping rings. |
| **Volatile Mix + Arc Relay** | Apply toxin, ignite a selected cluster, then aim a shock shot at the slowing survivor. | Separate source cooldowns; reactions cannot recursively trigger themselves. | One reaction number per target and a capped chain line. |

Some listed components are existing; **Bank Signal** and **Survey Thread** are proposals. The table is a design test, not a promise that the full combination ships now. At the server level, tag each effect with owner, originating shot, generation depth, cooldown key and target set. Limit recursion depth to one additional generated effect unless a specific card says otherwise. Apply a per-source and per-target cap before spawning particles or network events. If a player can multiply one hit into thousands of invisible reactions, the design has failed even if the frame rate survives.

## 4. Movement must give new routes, not just a speed number

Developer patch notes explicitly adjusted character speed and acceleration, enemy spawns, camera clipping and teleport transitions. Later notes made pots reward movement and routing. **Inference:** traversal, discovery and survival are coupled: going somewhere new matters when the map contains things worth reaching and the character can turn and accelerate responsively. BLACKSITE's user has repeatedly emphasized movement feel and varied height, half walls and stages. The design response should be geometric as well as numerical.

Existing sprint, slide, dash, jump and class mobility must be tested in rooms with actual tactical height. Proposed authored bay set:

| Bay | Height/cover contract | Route choice | Machine pressure |
| --- | --- | --- | --- |
| **Loading Gantry** | Ground lane, 1.3 m service platform and 0.8 m half wall; two ramps. | Fast ground flank or elevated sightline with exposure. | Three short valve stations split across both levels. |
| **Filter Stack** | Two staggered mezzanines, opaque duct trunks and a drop back to ground. | Climb to a sniper perch or cut through the ducts under fire. | One hard pressure machine on a vulnerable mid-level. |
| **Rejected Goods** | Offset piles with low firing cover, overhead moving gantry, broad side route. | Cross directly under a telegraphed strike or take a longer safe loop. | Two bridge machines separated enough to require rotation. |

These rooms are **proposals**, not shipped layouts. They need a single shared height/collision representation for the server and renderer. Enemy navigation, hits, spawn clearance and station reachability must all agree. A valid player spawn requires headroom, floor support, and a path to more than one lane; entering a new stage must clear stale client prediction. The earlier wall-spawn bug is a release regression gate. Movement benchmarks should record acceleration to sprint, 180-degree turn feel, dash-to-landing control, jump onto a platform, sliding under a half wall, and recovery after touching an edge. A movement upgrade should enable a route or risk choice, not simply shorten a hallway.

## 5. Map information and loot routing

Megabonk's v1.0.17 notes add a full map with fog of war and distinguish a shrine color on the minimap. **Inference:** even in a dense action game, knowing where useful objectives are supports route planning. BLACKSITE can borrow the principle in an industrial way without turning each encounter into a scavenger hunt.

**Proposal:** a sector workboard available in service, showing authored room names, known machine station count, the current Overtime hazard/reward, and one optional route objective. During combat, a compact local scanner can mark already-seen stations and last known squad pings, but it should not reveal hidden enemies through walls. A work order clue such as “Two coolant contactors above the inspection deck” prompts exploration of the bay's height. The player still fights and aims; mapping helps the crew allocate tasks.

If a shortcut, cache or station is optional, publish how it pays. For a three-machine room, each easy station should have an independent progress cue; for one hard machine, the crew should understand why it takes longer and what covering it accomplishes. Avoid a loot object that only the first player can claim unless its ownership policy is displayed. If discovery requires a player to leave the team, give the group a ping and a reason to accept that split.

## 6. Spectacle has a visual and audio budget

The developer added projectile/particle opacity control and warned that some transparency choices can affect rendering at extreme projectile density. Subsequent notes report late-game FPS improvements and a per-tick proc cap on one effect. **Inference:** late-build spectacle is a production budget, not just an art flourish. BLACKSITE's four-player FPS camera makes overlapping friendly effects especially costly because an obscured sniper line or machine footprint can kill a player who was making a correct decision.

Prioritize visual layers by consequence:

1. **Highest priority:** hostile attack lane, impact footprint, active machinery, downed ally, and collision edge. Shape, sound and text must carry these even if color is ambiguous.
2. **Middle priority:** the player's own bullets, hit confirmation, active class skill and the target status needed for a chosen build.
3. **Lower priority:** teammate bullets, repeated damage numbers, decorative sparks, spent shells and distant chain effects.

The current scene caps damage number and debris counts; this pass adds an **Ally Projectile Visibility** slider, default 65%, range 25–100%. It affects only other players' physical projectile meshes on this client. Your own shots and all enemy projectiles, telegraphs and server hit rules retain full strength. The minimum prevents an ally attack from becoming completely invisible. This is a small implementation of the visibility priority, not a full maximal-build performance guarantee.

Further **proposals:** cap cosmetic chain lines per frame, combine repeated damage numbers from the same source/target within 0.15 s while retaining exact server totals, limit simultaneous shot audio voices by distance/priority, and reduce decorative flashes before dimming threat language. Use shape and position before color coding. The client may reduce visual particles but never drop authoritative damage events. If a card promises six fragments, the server still simulates six; the renderer may show a bundled trail only when the danger stays understandable.

Measure a reproducible worst case: four players with chain, bounce, fragments and area effects in a boss room with a sniper lock, sapper blast and machine sweep. Capture frame-time percentiles, render count, audio peak and player warning recognition. A steady average FPS is insufficient if a single 300 ms hitch hides the strike's final warning. Test the minimum visibility setting as well as default and full visibility; the setting must never change enemy cues.

## 7. Unlocks and quests should teach play

The official store advertises hundreds of in-game quests and many unlockable characters/items. **Inference:** challenges can direct players to discover systems, but a large count is not automatically replayability. BLACKSITE is a smaller game with four suits and a defined nine-wave contract. Its first unlocks should act as tutorials for interesting verbs, without requiring grind before a class feels complete.

Proposed original *work certifications* (future, not implemented):

- **Clean Lane:** cancel a marked enemy windup with Shockwave while a teammate is operating a machine. Unlocks a Breacher visor cosmetic and a field-manual incident note; no mandatory combat power.
- **Return to Sender:** bank a carbine projectile into a hostile from behind cover. Unlocks an alternate carbine sound/receiver cosmetic and an optional rebound-focused augment in the pool.
- **Two Hands on the Valve:** in a voted Overtime encounter, clear two separated stations without any operator downing. Unlocks an alternate machine placard story fragment and a future bay variant.
- **Last Shift:** revive two crew members in one contract and finish the sector. Unlocks a Medic suit identification plate and contractor announcement, not an essential heal upgrade.

Every certification needs an exact progress definition, a visible in-run tracker and a result panel showing why it completed or failed. Do not award kills to the wrong player when poison or a delayed explosion finishes a target. Do not require online accounts for local progression. A certification that asks a player to sabotage the team or ignore Overtime's vote is bad content regardless of reward. Challenge unlocks can broaden later runs, but all four starter roles and the signature Overtime mechanic must be fun on a fresh install.

## 8. A result panel should teach causality

Megabonk's update notes add a useful-stats window for weapons/characters and an optional item feed. Later notes correct descriptions and proc order. **Inference:** as build complexity rises, the game must help the player connect a choice to an outcome. BLACKSITE already shows damage numbers and trackers, plus a field manual with exact base effects. A future end-of-encounter panel should be short enough for a co-op service window:

| Panel line | Example | Why it matters |
| --- | --- | --- |
| Primary build action | “Bank shots hit 11 targets; 4 were behind cover.” | Confirms a behavior-changing card mattered. |
| Class contribution | “Shockwave canceled 3 attacks; 1 protected an operator.” | Makes support visible beside damage. |
| Work and risk | “Overtime Backfeed active; 2 stations cleared; 1 operator down.” | Connects the chosen hazard to the result. |
| Next decision | “You earned 1 draft and 1 salvage reroll.” | Shows why the next menu has its options. |

These are proposed UI strings, not shipped totals. The server needs to record events with attribution and cause. Do not show a large ranked damage board as the primary reward; it can push Medic/Vanguard toward unsafe solo damage. Preserve optional detail for players who want exact totals, but put one or two explanatory lines first. A run summary can compare the player's current build to their previous run by action types, without comparing individual worth to teammates.

## 9. Co-op escalation requires explicit ownership and voting

Megabonk's current store lists single-player, so its reward flow does not solve BLACKSITE's four-player interruptions. The existing BLACKSITE rules are: personal drafts, server-authoritative choices, one earned personal reroll per eligible player, a majority Overtime vote with stable on tie, an encounter-limited Overtime condition, a host-visible service timer, reconnect reservations and timed revives. Keep those rules visible as reward density grows.

For a future XP-like mid-fight milestone, do **not** open four simultaneous menus. Queue the resulting choices for service. If a player dies after contributing to the shared salvage quota, publish whether they receive a draft on revival, at sector transition, or not at all. When a player disconnects, their unspent personal choice remains with their run state until the reservation expires; no teammate can claim it. A host departure cannot silently force a risky Overtime setting. If an optional machine is activated by one operator, that is an encounter action; choosing a squad-wide hazard still requires the ballot.

Scale enemy numbers by active crew only with visible bounds. A four-player squad can produce four overlapping build engines, so the maximum simultaneous major windups should grow slowly, not fourfold. Difficulty can rise through enemy combinations, coverage and timed decisions while keeping each warned attack recognizable. Damage and healing must be attributed to original owners through delayed effects. With unlimited reserve ammo, reload cadence remains a handling choice, not a resource bottleneck.

## 10. Production order and acceptance tests

The most useful work order is:

1. Record the four starter guns with no augments and confirm cadence, recoil, reload, impact and sound are distinct. Fix a dull starter before adding item content.
2. Instrument draft offers and whether picked augment actions actually fire in the following encounter. Remove or rewrite cards whose only visible effect is a number.
3. Build one tall bay and one half-wall bay under a shared collision/spawn contract. Repeat all stage transitions with four players and seeded rooms.
4. Run the four-player maximal-effects test and tune readability, cosmetic budgets and hostile cue priority.
5. Test the Overtime vote with players who have seen the hazard/reward only once. If it causes hesitation without a meaningful decision, simplify the card before adding more variants.
6. Only then widen the augment and bay pool, using authored variants recombined by seed.

| Practical gate | Prototype target |
| --- | --- |
| Base weapon identity | Most blind testers distinguish the four starters by feel/sound, without names or upgrades. |
| Visible adaptation | After each of the first three rewards, a player names a new action they will try. |
| Movement | A player reaches both ground and elevated objectives without camera clipping, stuck movement or wall spawns. |
| Shared danger | At least one co-op story comes from choosing Overtime or a machine route, rather than random failure. |
| Max build readability | Four players identify sniper, sapper, boss and machine warnings amid late-build effects. |
| Performance | No sustained hitch in the final warning window; capture frame-time percentile and audio peak, not only average FPS. |
| Rules | Ties remain stable, personal rewards cannot be stolen, stale selections fail, reconnect state restores. |

These are intended playtest gates. The automated suite can verify vote math, draft tokens, effect caps, spawn clearance and exact state transitions; it cannot certify movement feel or visual clarity. The current build has not passed the full four-player maximal-effects human test.

## Six constraints and narrative fit

Megabonk's useful lessons are reward cadence, movement-linked routing, many possible combinations and explicit late-build visibility/performance controls. BLACKSITE applies them under its six constraints: weapons must feel good first; upgrades should change actions; industrial spaces must be made through proportions, surfaces, light, sound and interaction; co-op choices require deliberate rules; warnings must survive four-player spectacle; authored rooms can recombine. The premise remains a contractor sending a maintenance crew into a sealed processing complex that treats employees as raw material. Signs, equipment descriptions, machine behavior and short announcements are enough for the first release. The recurring Overtime hazard/reward vote remains central and must prove itself alongside shooting.

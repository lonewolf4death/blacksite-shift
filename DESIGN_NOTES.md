# Design notes and research

The current build is an original, compact first-person co-op shooter. These references informed the systems rather than supplying assets, names, characters, or level layouts.

| Reference | Researched design principle | BLACKSITE SHIFT response |
| --- | --- | --- |
| [Gunfire Reborn official site](https://gfr.yijoys.com/en/) | Heroes with different abilities, randomized stages and weapons, and four-player co-op. | Four named operative kits, individual build choices, two gun slots, three cycling sectors, and room-code co-op. |
| [Deadzone: Rogue developer store page](https://store.steampowered.com/app/3228590/Deadzone_Rogue/) | First-person co-op combat centered on combining augments and elements against hostile machines. | Server-tracked projectile combat, mechanical enemy roles, fire/frost/toxin/shock effects, and cross-element reactions. |
| [Borderlands 3 publisher overview](https://newsroom.2k.com/news/borderlandsr-3-is-now-available-worldwide) | Distinctive weapons and deep class skill trees make loot and character choice meaningful. | Ten weapons with different firing rules and 24 talent nodes across twelve two-tier paths. |
| [Risk of Rain 2 developer store page](https://store.steampowered.com/app/632360/Risk_of_Rain_2/) | Combining loot in surprising ways while mastering characters through repeated co-op runs. | Wave-by-wave augment stacking, sector bosses, escalating loops, and deliberate item synergies. |

The presentation follows the requested rough industrial mood through simple 3D geometry, limited color palettes, high-contrast terminal typography, harsh colored lights, fog, and dense HUD telemetry. Movement retains acceleration, air control, sprint, jump, slide, dash, and aim-down-sights. The prototype favors readable attack rules and immediately visible build effects over a large amount of cosmetic loot.

## Scope and next design decisions

This build is a playable content slice with three sector layouts and boss encounters. The rooms are hand-authored variations rather than fully procedural maps. Co-op uses direct room codes and a trusted-host server; there is no matchmaking, account progression, or public server hardening. The next substantial step would be procedural room assembly with path validation, more boss-specific tells and phases, and persistent unlocks tied to completed runs.

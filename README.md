# Kurukshetra: A Life

A narrative RPG in which you create an original character and live one whole life inside the Mahabharata, from childhood beside the young princes to the 18-day war and what comes after. The great events of the epic are fixed. Your place in them is not.

> You can't change the Mahabharata. You can decide who you were inside it.

## Play

Open `game/index.html` in a browser. No build step and no install. Keep the `game` folder together so the art and scripts load.

A life takes about 45–60 minutes. The game saves itself at every scene (in that browser), and **Menu → Move this life to another device** gives you a save code you can paste anywhere.

## What's in the game

| Act | Ages | Content |
|---|---|---|
| I · Childhood | 6–14 | Homeland, the princes at play, a sage on the road, a friend for life, Bhima poisoned at Pramanakoti, a fight at the fair |
| II · Training | 14–20 | Six teachers, seven paths, Ekalavya's fee, a sparring trial, the tournament, Drona's fee, a vow by the river |
| III · Young adult | 20–30 | The hermit's secret, the family debt, the lac house, Draupadi's swayamvara, choosing a court, marriage, the Rajasuya |
| IV · The fracture | 30 | The dice game in four beats: invitation, stakes, Draupadi's question, the cloth that does not end |
| V · Exile | 31–44 | Three roads (forest, court, your own life), Vasu, the incognito year in Matsya, the secret of Karna's birth, choosing a side |
| VI · The war | 44 | The eve of battle, Bhishma's nine days, the bed of arrows, Drona's plan, the Chakravyuha, the night battle, Drona's death, Karna's death, the last day, Duryodhana at the lake, the night raid |
| VII · Aftermath | 44+ | The women on the field, Bhishma's last teaching, the years that remain |

**Endings:** Glorious death, Fallen at Kurukshetra, Into the wheel, Beside Karna, The wise elder, Renunciation, The teller, Vengeance, The homecoming, Broken survivor, The wanderer.

## Systems (PRD section)

- **Canon lock, "witness and wound"** (§4): canon anchors always play; your choices change only your own story.
- **Duty, not morality** (§9.1): teacher's debt, loyalty to your king, family duty and conscience pull against each other.
- **Vows** (§9.2): six vows, up to three at once. Choices tagged "retreat", "lie" and so on break the matching vow automatically.
- **Boons and curses** (§9.3): astras, foresight, healing hands; curses that stay hidden and strike at the worst moment.
- **Aging and injuries** (§9.4): strength fades with age, wisdom grows; permanent wounds change your stats.
- **Relationships and memories** (§9.5): bonds with canon and original characters, who remember specific moments.
- **Reputation** (§9.6): six factions.
- **Combat** (§9.7): turn-based, with three abilities per path, astras with a dharma check, sparing and withdrawing. All input goes through one command layer (ready for touch).
- **Story mode** (§10): you cannot die in battle.
- **Skill checks** show their odds before you choose.

## Code layout

```
game/index.html          page shell
game/css/                styles
game/js/engine/          rules: state, conditions and effects, scene flow, saves, combat (engine-agnostic)
game/js/content/         the story as plain data, one file per act
game/js/ui/              screens: title, creation, scenes, battle, ledger, menus
game/art/                concept art
tests/playthrough.js     automated playthroughs
docs/                    PRD, project plan, art brief
```

Content is data. A scene is an object with a witness layer, the player's choices and their effects; the ▲/▼ previews on every choice are generated from the same data the engine applies.

## Test

```
npm install
npm test             # 300 random lives through the real UI
npm run test:story   # 150 lives in story mode
```

The test plays random lives in a headless browser and reports crashes, dead ends, broken references, win rates for every battle and the spread of endings.

## Status

Pre-production. All story text is a working draft after the public-domain K.M. Ganguli translation and must pass advisory board review (PRD §12) before public use. Concept art is placeholder; open notes are in `docs/Art_Brief.md`.

## Languages

The game plays in English and Hindi. Switch on the title screen or in Menu; the choice is remembered, and a browser set to Hindi starts in Hindi.

- English is the source text, written in the content files. Every displayed string passes through `K.tr`, which looks it up in `game/js/i18n/<lang>.js`.
- Hindi verbs agree with the speaker's gender, so Hindi strings use `{g:masc|fem|neutral}` forms filled from the player's pronoun, and combat lines use postposition forms such as `{tne}` and `{tko}`.
- The Hindi is a draft and needs a native speaker's review before release.

To change or add text: `node tests/strings.js collect` lists every string (new ones get new ids in `tests/strings.json`), translate them in `i18n/hi/part*.json`, then `node tools/build-i18n.js hi` builds the dictionary and checks placeholders. `node tests/strings.js check hi` plays lives in Hindi and lists anything still in English.

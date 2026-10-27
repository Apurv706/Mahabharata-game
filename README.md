# Kurukshetra: A Life

A narrative RPG in which you create an original character and live one whole life inside the Mahabharata, from childhood beside the young princes to the 18-day war and what comes after. The great events of the epic are fixed. Your place in them is not.

> You can't change the Mahabharata. You can decide who you were inside it.

## Play

Open `game/index.html` in a browser. No build step and no install. Keep the `game` folder together so the art and scripts load.

A life takes about 45–60 minutes. The game saves itself at every scene (in that browser), and **Menu → Move this life to another device** gives you a save code you can paste anywhere.

## What's in the game

| Act | Ages | Content |
|---|---|---|
| I · Childhood | 6–14 | Homeland (Hastinapura, Panchala, Matsya, Mathura, Anga, a charioteer family, a Nishada village or Gandhara), the princes at play, a sage on the road, a friend for life, Bhima poisoned at Pramanakoti, a fight at the fair |
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
- **Enemy intent and field events**: each enemy shows its next move ("Next: Heavy blow → you"). Once in every deadly fight something happens on the field (a conch, an arrow storm, Bhishma's banner, Ghatotkacha in the dark). A fallen friend can be pulled out of the fighting for your turn.
- **Timed moments**: at Draupadi's question and the wheel formation a lamp burns down beside the choices. If it goes out, the scene's silent choice is made for you. Scene data: `lamp: { secs, silent, note }`. Off in the menu.
- **Dice games** (`js/ui/games.js`): pasha against old Haridatta at the spring fair, and spotting Shakuni's swapped die in the dice hall (it shows a face a long die does not have). A choice with `game` picks its `win` or `lose` branch.
- **Story echoes**: Ugra from the fair turns up on day one (beside you or across the field), the Nishada archers answer your whistle on the night of the raid if you helped Ekalavya, Sudatta's grandson brings the note back after the war, Charu asks you home when the old smith is dying, your spouse says which side they want, close bonds you neglect for a whole act drift, and Karna's secret can be spent (Krishna stops you).
- **Secrets** you hold are listed in the ledger (`K.SECRETS`).
- **Chance events** (`js/content/events.js`): five slots, each drawing one of two small events or nothing, so no two lives meet the same things (`K.slot`).
- **Book of Lives** (`js/ui/lives.js`): every finished life is kept in this browser, with an endings gallery (11 endings, the unfound ones as hints). A new life can remember a past one and starts with its karma.
- **Sound and music** (`js/ui/audio.js`, `music/`): three original pieces, one per stage of a life: *Vijaya* (raga Bhairavi, heroic: alap, gat and antara over the Sa-Pa drone, no chord changes) for the title, childhood, training, young adulthood and aftermath; *Chakravyuha* (Purvi, fusion) for the dice game, the exile years and timed or high-stakes moments; *Dharmayuddha* (Bhairavi, battle anthem) for the war and every fight. They are 128 kbps MP3 loops (about 1.1 MB each), loaded only when their stage is reached, and crossfade on a change. Opened from a file on disk, the game falls back to an improvised tanpura, bansuri and tabla ensemble made in the browser. Effects (quill, conch, dice, blows, gong) are synthesized. The menu has music on/off, a music volume slider and sound effects. The pieces were composed as code; the renderer is in `tools/music/`.
- **Skill checks** show their odds before you choose. What you did earlier counts (`K.MERITS`): winning the archery at Kampilya helps later archery tests, being seen at the tunnel counts against stealth (±2 at most). Fights won and lost are kept too: every third win adds +1 attack, and a lost fight leaves you shaky (−1) for the next. The character sheet shows the record, and the ending sums it up.
- **Action tests** (`js/ui/trials.js`): moments where you do the thing rather than choose it. Four kinds: aim (release as a swinging target crosses your line), push (time a push as a closing ring meets the mark), steady (keep your hand over a frightened horse's mood) and retort (answer a taunt before the lamp burns down). The stakes are shown first; your stats widen the window, and how you play decides. A choice opts in with `game` and `trial: { attr, skill, rules, stakes, practice }`; its `win`, `close` and `lose` branches follow. One test per act: Act I opens with an uncounted practice throw at age 6 ("Three pebbles"), then a friendship has to be earned (Arjuna's lamp, Bhima in the river, Karna's horse, Duryodhana's brothers; choosing Charu means a bout with Ugra at the fair instead). A failed test gets one second chance at the spring fair; failing that too counts twice in the record, leaves a −1 merit on the skill and costs standing with whoever watched. Under the test harness a test rolls against the same stats.
- **Teachers beyond your station**: Kripa and Vidura can be asked even when your family is not of the court; it is a check, and a refusal sends you back to choose again.
- **Map** (`js/ui/map.js`): the subcontinent drawn in code (Natural Earth coastline, public domain), with the kingdoms at their traditional places. When a scene takes you somewhere new, a short journey plays over it: the road draws itself, with the whole subcontinent in a corner inset. The Map button shows the road so far (zoomed, or the whole subcontinent), and the ending shows it once more. Canon scenes before the war do not move you; the war gathers everyone at Kurukshetra.

## Code layout

```
game/index.html          page shell
game/css/                styles
game/js/engine/          rules: state, conditions and effects, scene flow, saves, combat (engine-agnostic)
game/js/content/         the story as plain data, one file per act, plus chance events
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

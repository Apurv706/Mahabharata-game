# Product Requirements Document
## Mahabharata RPG — working title: *Kurukshetra: A Life*

| | |
|---|---|
| **Status** | Draft v0.7 (browser edition as it is on 3 November, §16; remaining tasks, §17; storylines, weapons, magic and the puppet, all built, §18; changes from the 29 October playtest, §18.11; moments, the practice ground and vows that matter, §18.12; the war storylines, §18.13; the puppet's look, master leather, §18.14; less to read, §18.15) |
| **Last updated** | November 3, 2026 |
| **Owner** | [Founder / Creative Director] |
| **Doc type** | Living PRD; sections marked **[OPEN]** still need decisions |

---

## 1. Summary

*Kurukshetra: A Life* is a narrative RPG in which the player creates an original character and lives one full lifetime inside the Mahabharata, from childhood in the age of the young princes to the aftermath of the 18-day war. The great events of the epic are fixed. The player's place in them, along with their loyalties, vows, relationships and death, is not.

**One-line pitch:** *You can't change the Mahabharata. You can decide who you were inside it.*

**Comparable titles:** Crusader Kings III (life simulation, generational legacy), The Witcher 3 (morally weighted choices in a rich mythic world), Black Myth: Wukong (a culturally specific epic made for a global audience), Ghost of Tsushima (respectful cultural authenticity).

**Where it stands (November 3, 2026):** a complete browser edition is playable in English and Hindi on phones and desktops (§16), with every storyline proposed in §18 built, including the war storylines (§18.13). The remaining work is in §17.

---

## 2. Vision and design pillars

1. **Canon is fixed, fate is yours.** Major events in the epic always happen. The player chooses where they stand, what they do and what it costs them.
2. **Duty over morality meters.** There is no good/evil bar. Choices weigh competing duties (to teacher, king, family, vow, conscience) against each other, and every path costs something.
3. **A whole life, felt.** Childhood friendships, training, marriage, exile, war and old age. Time passes, bodies age, people die.
4. **Reverent, not timid.** The epic is treated with the seriousness of scripture and the drama of literature. Divine figures are depicted with dignity and are never playable.
5. **Built for the world, rooted in India.** Authentic art, music, language and philosophy, readable by a player who has never heard of Arjuna.

---

## 3. Target audience and platform

| Segment | Description | Priority |
|---|---|---|
| Global narrative-RPG players | PC/console players who love story-driven RPGs and mythic settings | Primary |
| Indian and diaspora core gamers | PC/console players who know the epic and want to see it done well | Primary |
| Indian and global mobile players | Huge audience (mobile is roughly 79% of India's games revenue) with low spending per player | Secondary: served by a planned mobile port (§15.3) |

- **Platform strategy: PC/console first, mobile port later.** Launch on PC (Steam / Epic), then PS5 / Xbox Series, then iOS / Android as a dedicated port. **[OPEN]** Whether to aim for a Switch 2 port.
- **Browser edition (built):** the whole game also runs in a web browser on phones (upright only), tablets and desktops (§16). **[OPEN]** Whether it ships as the game (for example in a desktop wrapper on Steam) or stays the prototype for an engine build.
- **Business model:** Premium (one-time purchase) on PC/console. Possible paid story expansions. The mobile model is in §15.3. No real-money mechanics, loot boxes or paid randomness on any platform (see §13).
- **Suggested engine:** Unreal Engine 5, which also opens a path to the Epic MegaGrants program. Its mobile renderer and scalability settings support the later port, provided the team follows the port-readiness rules in §15.3 from the start.

---

## 4. The core rule: canon lock

### 4.1 What is fixed
Every **canon anchor** event happens regardless of what the player does. Examples: the lac-house fire, Draupadi's swayamvara, the dice game, the exile, Abhimanyu's death in the Chakravyuha, the deaths of Bhishma, Drona, Karna and Duryodhana, and Ashwatthama's night raid.

### 4.2 What the player controls
- **Presence:** whether they are there.
- **Stance:** whether they speak, act, stay silent or leave.
- **Side effects:** effects on their own relationships, reputation, vows, body and survival.
- **Local outcomes:** fates of original (non-canon) characters, including family, friends, rivals and soldiers under their command.

### 4.3 Design pattern: "the witness and the wound"
Each anchor event has (a) a **witness layer**, where the player sees canon play out, and (b) a **wound layer**, an original consequence that only the player's story carries. Example: during the dice game, Draupadi's humiliation unfolds as in canon. If the player objects (as Vikarna and Vidura did in canon), they gain the Pandavas' trust but make an enemy of Dushasana, which is paid off on war day 16.

### 4.4 Canon references
- Narrative source: the Sanskrit text, using the BORI Critical Edition as the primary reference and the public-domain K.M. Ganguli English translation for working scripts.
- Where regional versions differ (for example, Karna at the swayamvara), the team picks one and documents the choice in the Lore Bible.

---

## 5. Character creation: origins

The player chooses an **origin** (homeland and family circumstance). Origin sets starting relationships, early opportunities and how the world treats the character. **It never locks abilities or paths.**

| Origin | Starting context | Built-in tension |
|---|---|---|
| **Hastinapura (court family)** | Child of a palace official; grows up beside the Kuru princes | Divided loyalties when the family splits |
| **Panchala** | Drupada's kingdom, rival of Drona | Drona's old grudge against Panchala |
| **Matsya** | King Virata's land, a quiet kingdom | Hosts the Pandavas' incognito year; the Kichaka episode |
| **Mathura (Yadava)** | Krishna's and Balarama's people, on the Yamuna (replaced Dwaraka in the build) | Yadavas fight on both sides of the war |
| **Anga** | Karna's kingdom, gifted to him by Duryodhana | Loyalty to Karna and Duryodhana |
| **Charioteer (suta) family** | Like Karna's adoptive family; Champa years before the move to the capital | Social contempt, closed doors, fierce pride |
| **Nishada forest village** | Forest people outside the city order | Ekalavya's story; whether teachers will accept you |
| **Gandhara** | Shakuni's distant homeland | Seen as a foreigner at court |

**Also chosen:** name, gender, appearance, a childhood temperament (Bold / Thoughtful / Devoted / Cunning) that tilts early dialogue options, and one **family heirloom** (a bow, a manuscript, an amulet, a debt) that becomes a story thread. In the build the homeland is chosen on a map.

**Design note on caste and status:** Social hierarchy exists in the world and is shown honestly through how NPCs treat the player, which doors open and which teachers refuse. The game never says a character is worth less, and every vocation is available to every origin. The epic itself raises this question through Karna and Ekalavya, and the game lets players experience it rather than lecturing about it.

---

## 6. Life stages (campaign structure)

The campaign is split into seven acts that follow the epic's timeline. Each act has canon anchors, open-ended "life" content, and an act-end **defining choice**.

### Act I — Childhood (ages 6–14)
- **Setting:** The player's homeland, with visits to Hastinapura.
- **Canon anchors:** The princes' rivalry; Bhima's strength and Duryodhana's resentment; Bhima poisoned and thrown into the river.
- **Gameplay:** Mostly social and exploratory. Games, errands and small adventures build **childhood bonds** with canon and original characters.
- **Defining choice:** Who your childhood best friend is. That bond carries emotional weight for decades.

### Act II — Training (ages 14–20)
- **Teacher choice (see §7):** Drona, Kripa, Balarama, a forest hermit, or a court minister.
- **Canon anchors:** The tournament where Karna challenges Arjuna and is mocked for his birth; Ekalavya's thumb; Drona's demand for Drupada as payment for teaching.
- **Gameplay:** Skill trees open up; sparring and trials; first combat.
- **Defining choice:** At the tournament, do you stand with Karna, with the princes, or stay silent?

### Act III — Young adult (ages 20–30)
- **Canon anchors:** The lac house at Varnavata (the Pandavas' "death"); Draupadi's swayamvara; the kingdom divided; Indraprastha founded; the Khandava forest burned; Yudhishthira's Rajasuya sacrifice.
- **Gameplay:** The player chooses a court, may marry, takes on missions as an adult, and their reputation starts to matter.
- **Defining choice:** Pick a court: Hastinapura, Indraprastha, your homeland, or none.

### Act IV — The fracture
- **Canon anchor:** The dice game and the humiliation of Draupadi.
- **Gameplay:** A single, very long scene played in close to real time. Every NPC in the hall reacts to what the player does.
- **Defining choice:** Speak, act, stay silent or leave. This is the most weighted choice in the game.

### Act V — The exile years (13-year time skip)
- **Player choice of path:**
  - **Forest:** Follow the Pandavas through exile (episodes such as the Yaksha's questions, Arjuna's quest for divine weapons, Jayadratha's kidnapping of Draupadi).
  - **Court:** Stay in Hastinapura and watch Duryodhana's power and the court's decay up close.
  - **Own road:** Return home, make your fortune, raise a family.
- **Incognito year (Matsya):** All paths come together for the Kichaka episode and the Kaurava cattle raid on Matsya.
- **Gameplay:** Time-skip montage with key "life beats" (marriage, children, deaths, gains in skill and fortune). The character visibly ages.
- **Defining choice:** Which side you commit to for the coming war.

### Act VI — The war (18 days)
See §10. Each day is a chapter. The character can die on any day, and that ends the game in a full, valid ending.

### Act VII — Aftermath
- **Canon anchors:** Ashwatthama's night raid; the women's grief on the battlefield; Gandhari's curse; Bhishma's teachings from the bed of arrows; Yudhishthira's coronation.
- **Gameplay:** Mostly reflective. Visit the dead, settle debts and vows, decide how to end your life.
- **Endings:** See §11.

---

## 7. Teachers

The teacher is the player's first major relationship. It sets the starting skill tree and creates a lifelong **teacher's debt (guru-dakshina)** that can be called in at any time.

| Teacher | Access | Specialty | Their price |
|---|---|---|---|
| **Drona** | Hard to get unless born at court; Nishada and suta origins are refused | Archery, divine weapon (astra) lore | A dakshina that may set the player against their friends |
| **Kripa** | Open to court-adjacent origins | Balanced arms, tactics | Loyalty to the Kuru throne |
| **Balarama** | Mathura origin or a quest | Mace, wrestling | Neutrality in the war (Balarama himself stays out) |
| **Forest hermit** (original) | Open to all | Archery, survival, mantras | A secret that could curse you if revealed (echoes Karna and Parashurama) |
| **Vidura's circle** | Court origins | Statecraft, law, espionage | Constant moral scrutiny |
| **Self-taught** | Open to all | Slower progress, unique "Ekalavya" skill line | No debt, but no protection |

---

## 8. Paths (vocations)

Paths are chosen in Act II and can be broadened later. Every path has combat, social and story content.

| Path | Fantasy | Combat role | Canon touchstones |
|---|---|---|---|
| **Archer (dhanurdhara)** | The master bowman | Ranged damage, astras | Arjuna, Karna, Drona |
| **Mace fighter** | Raw strength | Melee tank, duels | Bhima, Duryodhana, Balarama |
| **Charioteer (sarathi)** | The driver who sees the whole field | Mobility, battlefield control, buffing your warrior | Krishna as Arjuna's driver; Shalya as Karna's |
| **Strategist / minister** | Advisor, policy-maker | Commands formations (vyuha) | Vidura, Shakuni (the dark mirror) |
| **Healer (vaidya)** | Saving lives in a war of death | Support, triage | Original; Ayurvedic tradition |
| **Spy / envoy (duta)** | Reading people, carrying secrets | Stealth, information | Envoys before the war; Sanjaya's vision |
| **Bard (suta storyteller)** | Recording the war for history | Morale, inspiration; the narrator | The epic itself is told by bards |

**Bard meta-option:** A bard character's journal becomes part of the in-game "telling." In New Game+ or the legacy mode, the player hears their previous character's life sung as a ballad.

---

## 9. Core systems

### 9.1 Duty system (dharma) — replaces a morality meter
The character carries several **obligations**, each with a strength value:

- **Teacher's debt** (guru-rina)
- **Loyalty to king / court**
- **Family duty**
- **Friendship bonds** (one per close relationship)
- **Vows** (see 9.2)
- **Conscience** (the player's own sense of right)

Key choices pit two or more obligations against each other. Honoring one weakens another. NPCs react to which obligations the player keeps or breaks. There is no "correct" answer, only the person you become.

**Design principle:** A good choice for the player is one where reasonable people in the epic would disagree.

### 9.2 Vows (pratijna)
- The player can take vows at key moments: never to retreat, never to lie, celibacy, revenge on someone, never to strike a certain person.
- **Benefit:** Vows give power: stat boosts, special abilities, NPC respect.
- **Cost:** Breaking a vow brings a lasting penalty and visible shame. Some vows will be tested by canon events (as Bhishma's and Yudhishthira's were).
- **Limit:** Up to 3 active vows at a time. The browser edition allows one exception: the Samshaptakas' oath in the war is a fourth vow above the limit, for the war only (§18.13). **[OPEN]** Whether to allow vows to be released through penance. (The browser edition lets one heavy penance a life lift a broken vow's price, §18.12.)

### 9.3 Boons and curses
- **Boons** are earned through penance, service to sages, or heroic acts. Examples: a divine weapon, protection, foresight.
- **Curses** come from insulting sages, betraying a teacher or hurting the innocent. They stay hidden and **fire at a scripted worst moment** (as Karna's curses did on day 17).
- The player always finds out *that* they were cursed, but not necessarily *when* it will strike.

### 9.4 Aging and the body
- Life runs from age 6 to as late as 70+.
- Stats shift with age: strength and speed peak in the 20s–30s; wisdom, command and astra mastery keep growing.
- Injuries can be permanent (lost eye, damaged arm), changing abilities and appearance.
- Time skips are presented as illustrated montages with player choices.

### 9.5 Relationships
- Each significant NPC has a **bond** value plus **memories**, which are flags for specific moments they remember and bring up later.
- **Canon characters** can be mentors, friends, rivals or enemies, but their canon fates and core arcs don't change.
- **Original characters** (family, spouse, children, comrades, rivals) are fully dynamic and can live or die.
- **Marriage and family:** Optional. Children grow up during the exile time skip and can fight in the war.

### 9.6 Reputation
Separate reputation tracks for each faction (Kuru court, Pandavas, Panchala, Yadavas, sages and ashrams, common people). Reputation decides access, war roles and who will stand with you.

### 9.7 Combat
- **Personal combat:** Third-person action combat suited to each path. Weapon types: bow, mace, sword, spear, discus. Exact feel **[OPEN]**: options are Souls-like, action-RPG or tactical pause. (The browser edition uses turn-based fights with timed block and dodge; §16.5.)
- **Astras:** Divine weapons earned through teachers and boons, with strong limits (cooldowns, conditions, moral cost for misuse).
- **Chariot combat:** Driving and fighting from a moving chariot on the battlefield, as one player (warrior) or with an NPC charioteer.
- **Formation layer (vyuha):** Strategist players set formations for their unit (Chakra, Krauncha, Makara, Garuda and others).
- **Input abstraction (for the mobile port):** Combat actions (attack, dodge, draw bow, invoke astra, steer chariot) are defined as abstract commands, never hard-wired to buttons, so touch controls can be added later without rewriting combat logic.

---

## 10. The war: 18 days

Each day is a chapter with its own canon anchor, battlefield map, objectives and **personal stakes**. The player's role (warrior, charioteer, strategist, healer, spy, bard) changes how each day plays.

| Day(s) | Kaurava commander | Canon anchor | Player content (examples) |
|---|---|---|---|
| Before day 1 | — | The Bhagavad Gita (Krishna and Arjuna) | Witnessed only, never interactive. A quiet scene before the storm. |
| 1–9 | Bhishma | Bhishma unstoppable; heavy Pandava losses | First battles, first kills, first friends lost |
| 10 | Bhishma | Bhishma falls on the bed of arrows (Shikhandi, Arjuna) | Visit Bhishma that night |
| 11–12 | Drona | Plan to capture Yudhishthira | Guard or hunt the king |
| 13 | Drona | **Abhimanyu in the Chakravyuha** | Choose to ride in beside him, or be one of those who couldn't break through |
| 14 | Drona | Jayadratha killed at sunset; night battle; Ghatotkacha killed by Karna's spear | Night fighting, chaos, torches |
| 15 | Drona | "Ashwatthama is dead" — Drona killed | The player can witness or take part in the half-truth |
| 16–17 | Karna | **Karna's death** (chariot wheel, curses) | The best moment for Karna-bonded characters |
| 18 | Shalya | Shalya falls; **Bhima and Duryodhana's mace duel** | The last day; survival is uncertain |
| Night of 18 | — | Ashwatthama's night raid on the Pandava camp | Survival horror sequence; your family may be in the camp |

In the browser edition the days also carry the war storylines of §18.13 (Yuyutsu's call, Iravan, the Samshaptakas, Bhurishravas, the kings' fall, the Shakti, your child, the great duel, the lake) and Bhishma's two scenes.

**Death rules:**
- Death in battle is a valid ending, not a "game over." It triggers the epilogue and legacy flow.
- An optional "Story Mode" lets players survive to the end to see every chapter.

---

## 11. Endings and legacy

### 11.1 Ending types
| Ending | Condition |
|---|---|
| **Glorious death** | Die on the battlefield with vows intact |
| **Broken survivor** | Survive, but with most bonds lost |
| **The wise elder** | Survive and become an advisor at Yudhishthira's court |
| **Renunciation (vanaprastha)** | Leave for the forest, following Dhritarashtra, Gandhari and Kunti |
| **The teller** | Bard path: your account becomes part of the epic |
| **Vengeance** | Pursue a vow of revenge past the war's end |

Each ending gets an illustrated epilogue showing what happened to the player's family, friends and rivals.

The browser edition has 16 endings: the six above, The homecoming, The wanderer and Fallen at Kurukshetra, and seven for particular deaths (Into the wheel, Against the boy in the wheel, Beside Karna, A life cut short, The burnt house, The oath to the death, The one who crossed). Each opens full-screen under its name (1 Nov) [35].

### 11.2 Legacy mode (post-launch / DLC)
Play as your own child in King Parikshit's era, inheriting your reputation, feuds, unfinished vows and heirloom. This sets up a natural sequel: Parikshit's reign, the Yadavas' self-destruction, and Dwaraka sinking into the sea.

---

## 12. Cultural integrity and sensitivity plan

This is a **launch-critical risk area**. Past games that used Hindu figures (Sony's *Hanuman: Boy Warrior*, Hi-Rez's *Smite*) faced organized protests. In India, complaints can also lead to legal action under laws on outraging religious feelings.

### 12.1 Hard rules
- **Krishna and other divine figures are never playable** and never controlled by the player.
- No romantic or sexual content involving divine figures. Canon relationships (such as Draupadi's marriage) are depicted with dignity.
- No comic or parody treatment of sacred figures, scriptures or rituals.
- The Bhagavad Gita is witnessed, never turned into gameplay or a dialogue tree.
- Combat against canon heroes happens only where the epic supports it (for example, Kaurava-side players face Pandava forces), and duels against key heroes are framed with respect.

### 12.2 Process
- **Advisory board:** At least two Sanskrit and Mahabharata scholars, one practicing religious advisor, and voices from different regional and caste perspectives.
- **Review gates:** Lore Bible sign-off before production, script review per act, and art review for every canon character.
- **Lore Bible:** A single source of truth for every canon fact, interpretation choice and sensitivity ruling.
- **Community preview:** Closed playtests with Indian and diaspora players before marketing reveals.
- **Crisis plan:** Pre-written public responses and a named spokesperson.

---

## 13. Legal and compliance

| Area | Requirement |
|---|---|
| **Source material** | Sanskrit text and Ganguli translation are public domain. Do **not** use copyrighted modern translations, TV serial designs (e.g., B.R. Chopra's 1988 series, the 2013 Star Plus series), or Amar Chitra Katha art. Create an original visual identity. |
| **India online gaming law** | The Promotion and Regulation of Online Gaming Act, 2025 bans real-money gaming. Premium single-player and social online games are allowed, and registration for social games is voluntary. **The dice game must never involve real money or paid randomness.** |
| **Age ratings** | IARC (global digital), ESRB, PEGI. Expect a Teen/16+ rating for battlefield violence. |
| **Trademark** | Check the title against existing marks before public announcement. |
| **Religious-sentiment law (India)** | Legal review of all marketing and key scenes before release in India. |
| **AI-generated art and video** | The browser edition's paintings and living paintings are AI-generated; disclose this on Steam and keep the generation records (art_review/, store/README.md). |

---

## 14. Art, audio and language direction (initial)

- **Visual style:** Painterly realism inspired by Indian miniature traditions (Rajput, Pahari, Mughal court painting) for UI and epilogues; grounded, earthy realism in 3D. **[OPEN]** Stylized vs. photoreal. The browser edition uses warm painterly scene paintings in three shapes: 3:1 for desktops, 16:9 for wide stages, and 9:16 for upright phones.
- **Characters on screen:** Tholu bommalata leather puppets for the player and every character, drawn as a master craftsman would cut them (§18.14): curved, tapered limbs on thread-tied joints, a firm cut edge, rows of punched holes, printed borders and jewellery, in opaque colour. Animals in tests follow the same style.
- **Architecture:** Draw on early historic Indian architecture, not anachronistic later temple styles. Document choices in the Lore Bible. Recurring slips to check for in generated art: domes, Gothic or later temple spires, castle towers, Greek columns, East Asian roofs, modern bullseye targets, cube dice, European swords, crescent emblems.
- **Music:** Original score using Hindustani and Carnatic instruments (bansuri, veena, mridangam, shehnai) with an orchestral layer for battles. The browser edition has three recorded pieces (heroic, fusion, battle) and five win themes; everything else (a short piece for each of 16 places, test beds, the call to arms, moment themes) is synthesised in code (§18.11 S1).
- **Language:** Full English voice-over at launch; Hindi voice-over as a priority second language. Sanskrit for mantras and ritual; key terms (dharma, astra, vyuha) kept with an in-game glossary. The browser edition is text-only, in English and Hindi.

---

## 15. Scope: vertical slice and phases

### 15.1 Vertical slice (to raise funding / find a publisher)
**Content:** Act II (Training) through the archery tournament, plus war day 13 (Chakravyuha) as a battle showcase.
**Proves:** Character creation, one teacher, two paths (Archer, Charioteer), the duty system, one vow, combat and chariot combat, and the "witness and wound" pattern.
**Target length:** 60–90 minutes.

The browser edition (§16) already covers far more than this slice and can serve as the playable pitch.

### 15.2 Phases
| Phase | Goal | Indicative length |
|---|---|---|
| 0. Pre-production | Lore Bible, advisory board, core system prototypes | 4–6 months |
| 1. Vertical slice | Playable demo for publishers and grants | 6–9 months |
| 2. Production | Acts I–VII, all paths, all war days | 24–36 months |
| 3. Launch | PC first, then consoles | — |
| 4. Post-launch | Hindi VO, legacy mode, expansions | Ongoing |
| 5. Mobile port | iOS / Android release (see §15.3) | 9–15 months, starting after PC launch |

**[OPEN]** Team size and budget. The original Raji team grew from 3 to 13 people, which is a useful lower bound for an indie path. A full open-world version is AAA-scale.

### 15.3 Mobile port plan

**Approach:** The full PC/console game ships first. Mobile follows as a dedicated port of the same story, systems and saves, not a separate spin-off. Ports are expensive when a game wasn't built for them, so the port-readiness rules below apply **from pre-production onward**.

**Port-readiness rules (apply from day one)**
- **Scalable assets:** Every asset has LODs and a low-spec texture tier. No feature may depend on high-end-only rendering (for example, Nanite or Lumen with no fallback).
- **Hub-friendly level structure:** Levels are streamed in chunks small enough to fit mobile memory budgets.
- **Adaptive UI:** UI is built for both controller/mouse and touch, with scalable text and tap-sized targets. Dialogue and choice screens are touch-first by design.
- **Input abstraction:** See §9.7.
- **Data-driven narrative:** Story, choices, vows and relationship flags are stored as data, so they port unchanged.
- **Cloud saves / cross-progression:** Players can continue a life on PC and finish it on a phone.

**What changes on mobile**
| Area | PC / console | Mobile port |
|---|---|---|
| Combat | Real-time third-person action | Same systems with touch controls: assisted targeting, swipe dodges, gesture-drawn astras, auto-steer option for chariots. Optional **tactical mode** (pause and command) as an accessibility setting. |
| World | Full-fidelity hubs | Same hubs at lower fidelity; lighter crowds and battle density on the war days |
| Session length | Long scenes | Act chapters split into 10–20 minute episodes with save points; the dice game (Act IV) is split into segments |
| Download | Full install | Small base download; acts downloaded as needed |
| Orientation | — | Upright (portrait) only on phones, as in the browser edition |
| Performance target | — | 30 fps on mid-range Android phones (around US$300); higher on recent iPhones. **[OPEN]** Minimum device spec. |

**Mobile monetization**
- **Model:** Free to download with Acts I–II (childhood and training) free; one purchase unlocks the full life. Possible regional pricing for India.
- **Not allowed:** Gacha, loot boxes, paid character pulls, energy timers, or paid randomness of any kind. These conflict with the design pillars and carry religious-sensitivity risk (for example, "pulling" a canon hero), and real-money payouts are illegal in India.
- **Optional:** Cosmetic-only purchases (heirloom designs, chariot banners) that don't touch canon figures.

**Port options [OPEN]:** Build the port in-house with a dedicated mobile team, or partner with a specialist porting studio.

---

## 16. The browser edition (built, October–November 2026)

The game is playable today as a browser game (vanilla JavaScript, no engine), at apurv706.github.io/Mahabharata-game/game/, and on a private Claude play page in two parts (§16.10). It is the working prototype of the full design: all seven acts, every origin, teacher and path, the duty system, vows, curses, divine weapons and magic, the war's 18 days with its storylines (§18.13) and 16 endings, in English and Hindi. This section records how it plays on 3 November and the decisions taken while building it; §17 lists what is left. Numbers in brackets are the Change List's.

### 16.1 Screens and devices
- **Phones play upright only.** Turned sideways, a full-screen card asks the player to turn the phone back; the game pauses underneath (tests, the lamp and fight timing run on a pausable clock) and resumes where it was. Tablets and desktops play either way.
- **One slim top bar** of icons (Character, Journal, Map, Menu, Standing), clear of the notch; smaller type on phones.
- **The story box opens at its full size** over the painting and the story is written into it; lines and choices not yet written keep their room, so the box no longer grows line by line (owner, 2 Nov) [71]. The choices are always on screen. Story text and choices are a size smaller than in October; act cards, the dream and full-screen moments are unchanged [60]. No screen holds more than half a phone of text (§18.15) [69].
- On newer iPhone Safari, whose address bar floats over the page, the story sheet reaches the bottom of the screen [45].

### 16.2 How a life and a scene open
**A new life** opens with a short sequence, about thirteen seconds or a tap [37, 45]: the homeland's painting, introduced as on the character screen; the child, six, walking home and in at the lit doorway; supper with grandmother, mother and father on a mat with leaf plates; bed on a rope charpai as the clay lamp goes out; dream bubbles rising, and the war opening out of the last one. The dream is the thirteenth day at Kurukshetra ("None of this has happened yet"): grown, with a sword, three rounds against two soldiers and a warrior in a dented helmet whose face you cannot see, under a banner you cannot tell. It ends straight in white, then the dark room: the child wakes shaking, the mother kneels with a lamp, the father speaks of the war the sages foretell. Then the Act I card. The dream is not on the record or the map, the age stays six, and the earliest memory opens with the dust that is not there. Until `scene_home_supper` and `scene_home_night` arrive (`docs/Art_Brief_Opening.md`), the rooms are a plain wall and a drawn doorway.

**A scene:**
1. **Act card** at the start of each act: the act's number and name, one line, a gong; about 3 s or a tap. The sutradhara puppet opens it.
2. **Title card** for big moments (act openings, the epic's own scenes, tests, fights, every ending): Unwritten/Written, the title, age and place, the player's puppet; about 1.5 s. Ordinary scenes get a short title over the painting. Menu switch: Scene titles full / short.
3. **The whole painting**, large and centred (or its living painting, full-screen, for about 4 s).
4. **The story box rises over the painting** at its full size and the story is written in; the painting holds still, also while a choice's outcome is written [60, 71].
5. **The painting moves up once** into the space above the page, shown as large as the space allows (it may trim up to two-fifths of its width around its subject). A button or a tap shows it whole and replays its clip.

The quill writes every line; writing only the important lines was tried on 2 November and put back the same day [40]. Menu switch: Reveal the story line by line.

### 16.3 The player's puppet
The player and every character are drawn as **tholu bommalata** leather puppets: top knots with cloth bands, gold stepped crowns for kings and princes, sages' bare knots with rudraksha, tilak, earrings, sacred thread and dhoti; women in saris with bun, braid, nose ring and bangles. The puppet stands large on the story page's top edge and reacts to what happens (§18.9).

Since the quality review (2 November) [46–53]:
- **Weight.** Each joint is driven by a spring timed by the clock (`ui/puppet-anim.js`), so it moves the same on any screen: limbs overshoot and settle, a blow has a wind-up, a short freeze on contact, knockback and flakes of leather, and the dead fall limp from the feet. With reduced motion the older fixed poses are used.
- **Staging.** Figures are solid (no blur or see-through far figures or limbs) [46, 71], with a soft shadow under each, and larger in fights. Each test gives the right gear: a bow to shoot, empty hands to wrestle, hold steady or creep.
- **Who is who.** Each kind of enemy has its own outline (bandit, palace guard, soldier, archer, horseman, champion). Crowns are only for the named heroes, each with his own mark: Karna's armour and earrings, Arjuna's gold-tipped Gandiva and twin quivers, Bhima the broadest with a studded mace, Duryodhana's jewelled mace, Bhishma in white with a long white beard, Drona's forked grey beard and water-pot, the jewel in Ashwatthama's brow [49].
- **Weapons** were redrawn on 1 November: a ribbed gada with a spike, a khadga with a cross-guard, a leaf-headed spear with a red tassel, a recurved bow held at its grip, a dagger. The rods on the hands are gone [35].
- The backlit-leather look was tried and rejected (2 November); colours stay opaque.

The look is being redrawn as master leather (§18.14; being built 3 November).

### 16.4 Tests
- **22 kinds of skill test,** each a minute or two: archery, wrestling, steady hands, stealth, noticing, mudra and verse drills, rhythm, chariot, boat and foot races, herding, the ring puzzle, retorts, drawing the bow, the dice, Shakuni's hands, three board games (chaupar, tigers and goats, Moksha Patam), and since 31 October the cellar fuse and the burning house (§18.2), the commander's formation and the army battle (§18.3), and the breath test (§18.7). The timing test has three faces: Kripa's sword drill, the practice post and the village gate [52]. Word tests are best of 3 [45]. Two failures can close a way and send the player back to an earlier choice (loop-back), at most once per act.
- **Every test is played on its painting.** The stage painting is the playing field: the top bar and page fall away, the puppets stand big on the painting, the test's name and score sit at the top and the controls at the foot; rules are one line on a card before, and the verdict (You win / So close / You lose) is written over the scene after. Archery has a straw target swinging from the branch, always above the archer's head; hits stay in the target and swing with it; the bow is drawn square to the shot with the arm trembling with the aim's waver [34, 50]. Animals are leather puppets. In stealth the puppet creeps, freezes trembling in the light, and drops its basket and runs when seen; the guard strides with his torch held up and stops and lifts it before he turns [51]. Races run as vertical courses on the tall course paintings; against a rival the chariot has a Whip (Space: double speed for 1.5 s, 6 s to recharge) and wheels that clash on contact, and Karna drifts between lanes and now and then cuts across you after a warning [53]. A teacher or elder watching thinks, rather than cheers, when you slip [54].
- **Failure has teeth (peril).** Some checks and tests set the player against someone who can have them killed or locked away. Fail one while out of your depth (under an even chance on a check, or below 4 in the test's attribute plus skill on a second attempt) and the failure is death or a cell, not a bruise; a capable player who fails gets the ordinary setback. The choice card shows a skull (can cost your life) or bars (can cost your freedom); the "Danger:" line is gone (§18.15) [69]. Story mode turns a death into a scar. A cell offers a stealth escape over the wall or the long wait (in the war, waiting means sitting out the rest of it); the ending remembers either.
  - Death: listening to Shakuni at Indraprastha; calming the kings at the swayamvara; the Varnavata tunnel (Purochana's guard); drinking at the Yaksha's lake unanswered; breaking into the wheel after Abhimanyu; helping Karna lift his wheel; waking the camp on the night of the raid; the fight in the reeds at Duryodhana's lake (§18.13).
  - A cell: warning Panchala's villages (Kaurava outriders); calling Shakuni's dice false; stepping between Dushasana and Draupadi; Vidura's message and the steward's family on the night of the exile (Duryodhana's men); carrying the wounded under fire (taken by the enemy); a Pandava seen warning Duryodhana at the lake.
  - In automated play (random choices) about 1 life in 12 ended in a peril death, half of them before the war (measured 29 October).
  - A peril death ends on the painting of the place it happened ("A life cut short" before the war; "Into the wheel" and "Beside Karna" in it), with `scene_cell`, `scene_prisoners_pen` and `end_cut_short` in the game.
- **Chance in skill tests.** Not every good attempt succeeds: in archery the aim wavers and each arrow drifts (less for a better archer), so a perfectly timed shot hits about 3 in 4 for a beginner and nearly always for a master. What you see is what counts: the target is drawn as wide as its hit zone [25].
- Tall (9:16) stage paintings for all 50 test stages are in the game for upright screens.

### 16.5 Fights
Turn-based fights with puppets on a painted stage, timed block and dodge, adaptive enemies, lasting scars. **Fights are full-screen on their painting**, like the tests: the fight's name at the top, the two sides standing big on the painted ground, each side's strength, the last lines of the fight and the player's moves on cards across the foot; on phones the moves are a strip of three, names only [48].
- **Meeting a blow** (§18.9): jump, duck, sidestep or block as the blow comes; the window is ±0.2 s for a block and ±0.17 s for a dodge around the mark, and a press while your own move is still playing is ignored [54]. "Meet blows for me" in the menu (on by default in story mode).
- **Targets:** tap a figure on the field to target it; the target has a "Your target" label and a ring of light at its feet; every enemy faces you [34, 43, 71]. With a command rank and someone beside you, the target is marked: a gold pennant flies over it and your company turns on it, with Command adding +1 at 4 and +2 at 7 [33].
- **Moves are animated:** an archer's quick shot, the aimed shot held with a trembling arm, a volley of three arrows, the pinning shot left in the ground at the foe's foot, sparks on a guard, healing herbs in green light. The enemy's next blow waits until your move has played out [48].
- **Friends** called for help come in from the edge of the stage, speaking (§18.1) [26, 48].
- **Fights of other kinds** in the war's side battles: escort, break through, weather it, chariot duel, archery at range, mace duel, carry the wounded (§18.13) [67]. Hold fights show the round count during the fight [68].
- 70 encounters; 21 fight backgrounds, each 16:9 for wide screens with a 9:16 version for upright ones, and the test stages.
- **Balance** (`tests/balance.js`, careful player): the target is about 60–70% won in an even fight and about 40% in a hard one. In October even fights were won about 63% of the time and hard fights about 41%. A short run on 3 November (60 lives) gave about 85% and 56%, above the target; to be looked at again (§17).

### 16.6 Living paintings
25 Runway clips (7 key moments, 6 endings, 12 key scenes) play in place of their paintings, silently, once, resting on the last frame; on phones at full width during the scene's opening, on desktops full-screen. MP4 (H.264) only, about 0.2 to 1.4 MB each and 20 MB in all; the VP9 WebM copies were dropped on 31 October so that the published game stays within its file limit. Menu switch; off with reduced motion or data saver. The burning house also has fire drawn in code (embers and a flickering glow), which plays where a phone will not play clips, such as iPhone Low Power Mode [35]. No more clips will be made (decided 29 October); all other motion is drawn in code.

### 16.7 Language
English and Hindi. The string collector (`tests/strings.js`) finds 4,074 strings the player can see (3,405 on 30 October); the Hindi dictionary has 6,211 entries and loads only when Hindi is chosen. In 8 automated Hindi lives on 3 November one string was left in English ("hermit"). Switching language mid-test follows in place [41]. The English text was checked against the humanizer patterns, and the Hindi updated to match [44, 68]. The Hindi is a draft and needs a native reader's review.

### 16.8 Quality checks
- **Playthroughs** (`tests/playthrough.js`): hundreds of automated lives through the page; no crashes, no dead ends; the map follows the story.
- **Engine lives** (`tests/lives.js`): random lives through the engine alone, a few thousand a minute: saved lives come back unchanged, Continue resumes on the saved scene, no text shows an unfilled {token}, nobody fights on both sides, every life ends [32].
- **Rules** (`tests/rules.js`): 99 numbered groups of checks on vows, weapons, friendships, moments, ages, the war storylines, fight kinds and choice cards.
- **The war:** `tests/command.js` plays the war as a commander on both sides; `tests/crossing.js` forces lives across at Yuyutsu's call and checks that nothing of the old side follows them, every way of proving yourself is reached, and the map marker stands in the new camp.
- **Balance:** `tests/balance.js` for fights; `tests/race_balance.js` for the chariot race with the whip and contact (a whip user beats Karna about 93% of the time, as before; one who never whips now rarely wins) [53].
- **Strings** (`tests/strings.js`): collects every visible string and checks a language's coverage in played lives.
- **Screen fit** (`tests/layout.js`): iPhone SE, 15, 15 Pro Max, Pixel 7, iPad, laptop and desktop, upright and sideways, with stand-in notches; checks the top bar, page fit, choices on screen, every test and fight, the journey, the windows, the act and title cards, the painting's placement, the turn card and pause, the page while it is written, the painting holding still while it is written, every enemy facing you; for tests and fights on their painting, that they fill the screen, hide the top bar, and keep every control on screen and clear of the notch and home bar.
- **On GitHub, on every push to main:** "Engine checks" (`tests/rules.js` and 600 lives of `tests/lives.js`) and "Screen fit" (`tests/layout.js` in Chromium, WebKit (Safari) and Firefox, on Ubuntu 24.04 for WebKit) [32, 71]. The other suites are run by hand.

### 16.9 Build size (3 November)
| Part | On disk | What a player downloads |
|---|---|---|
| Code, styles, page | 1.7 MB | about 490 KB compressed |
| Hindi dictionary | 1.3 MB | about 310 KB compressed, only for Hindi |
| Paintings (448 WebP + 16 PNG: 3:1, wide 16:9, tall 9:16) | 127 MB | only those shown, the next scene's fetched while you read |
| Living paintings (25 clips, MP4) | 20 MB | only scenes reached |
| Music (3 pieces, 5 win themes) | 4.3 MB | streamed as needed |
| **Total** | **149 MB** | |

The per-life download (25 to 35 MB on 30 October) has not been measured again since the paintings doubled. The game folder holds 564 files. The paintings' JPG originals (235 MB) are kept outside the game in `assets/art_src/`; `tools/webp-art.py` converts new ones.

### 16.10 The private play page in two parts
The private play page holds at most 512 files, fewer than the game now has, so it carries the game in two parts (2 November) [61, 66]: **Part One** (Acts I–IV) and **Part Two** (Acts V–VII), each with only the paintings its acts use. A life crosses from one to the other by its save code; Part Two also offers a ready-made life to begin at Act V, and "Begin at the war" from ready-made lives on the eve of the war, three on each side. Built by `tools/split/build.js` (with `part.js` and `gen_war.js`); not loaded by the GitHub build, which stays one game.

## 17. Remaining tasks (3 November)

### Built since v0.6
- The rest of §18: friends in any fight, the lac house, command, threads and episodes, weapons, magic and tapas (31 Oct) [26–31].
- The 18 critical code-review issues (1 Nov) [32]; the leader's mark [33]; fixes from tester screenshots and passes [34–36, 41–43].
- A faster start: the opening sequence and the dream of the war, stakes before age 8, Ugra and Charu at seven (2 Nov) [37–39, 45].
- The quality review's puppet, staging, fight-move and test work (2 Nov) [46–54]; pose blending, the last item of §18.9.
- The war storylines (2 Nov, §18.13) [55–59, 62–68].
- Less to read, choice icons, hidden locks, the weapon grid and the dice hall in five screens (2 Nov, §18.15) [69, 70].
- From the owner's play: the story box opens whole, solid figures, tap to target, the act never goes back [60, 71].
- The private play page in two parts (§16.10) [61].
- Art: everything ordered by 31 October is delivered and in the game, with no stand-ins; the war storylines' 31 paintings and the great duel's two arrived on 2 November.

### Being built
1. **Master leather** (§18.14), from 3 November, in `ui/puppet.js` and the puppet section of `css/screens.css`. Then every pose, test stage and fight checked again, and frame rate on a mid-range phone in a three-a-side fight.

### Art (needs an artist)
2. The opening sequence: `scene_home_supper` and `scene_home_night`, wide and tall, to replace the plain wall; each homeland's house at dusk if there is time (`docs/Art_Brief_Opening.md`).
3. Retouches when convenient (`docs/Art_Brief_Remaining.md`): the torii-like gates in `stage_shiva_mountain`, `stage_naga_bank` and `scene_bard`; prayer flags and chortens on the two mountains. For later paintings, vary the skyline away from the Sanchi stupa and torana.
4. Five Steam screenshots, captured from the game.

### Review and release (needs people)
5. Native Hindi review of all 4,074 strings, and of the Hindi logo.
6. Advisory review: canon portraits, every living painting (faces, hands, canon figures), Draupadi in the dice and exile images, the key art, and Krishna's puppet in the day-9 wheel moment (§18.13).
7. Fill in the **[confirm]** lines of the AI disclosure (`store/AI_DISCLOSURE.md`): the image tools the artists used, how much of the story text was edited by hand, and the review status. Its counts (about 230 paintings, about 3,300 Hindi strings) are out of date.
8. Playtests: the timed block and dodge on phones; whether board games finish within two minutes; whether loop-backs read clearly; whether title cards, the opening sequence and the 4-second clip moments feel welcome after an hour; whether archery's chance feels fair; whether full-screen tests and fights read clearly on a small phone; whether the choice icons say enough now that cards carry no effect lines; whether the war storylines reach enough lives; how the fight balance feels after the 2 November changes.
9. **[OPEN]** Packaging for Steam (a desktop wrapper around the browser build) and whether the browser edition becomes the shipped game or stays the prototype for the engine build.

### Recorded, not built
10. **Returning to a page replays its writing and music** (user feedback): coming back to a page writes it out again and starts its music again.

---

## 18. Storylines added (proposed 29 October; built 29 October to 2 November)

Ideas to deepen a life, all inside the canon lock (§4): the epic's events happen as written, so Karna, Duryodhana and the Pandavas cannot die early at the player's hand, and the lac house still burns. The tension comes from what the player risks inside those fixed events. The pictures each needs are in `docs/Art_Brief_New_Storylines.pdf`; all have arrived. Every proposal in §18.1 to §18.9 is built (31 October, Change List 26–31), each described under its "As built" note. §18.13 adds the war storylines (2 November), §18.14 the puppet's new look (decided 3 November) and §18.15 the reading cut (2 November).

### 18.1 Friends who come to help (build first)
- In a fight, a friend with a high bond (about 7 or more) can step in at a turning point: "Bhima comes through the gate." Once per fight, as an ally unit with their own way of fighting: Bhima takes the blows, Arjuna strikes from range, Karna is fierce and unpredictable, Charu has no armour.
- Only where the friend could be: no Arjuna during his year away, no Bhima for a Kaurava-side player, nobody in the Pandavas' hidden year who would give them away.
- A friend who helps can be hurt or scarred, and that is remembered in the bonds panel and the journal. Calling Charu, who has no armour, is a real risk.
- Uses the existing ally system in fights and the bonds; no new art.
- **As built (30 October):** every fight has "Call for help" once. Outside the war (`engine/friends.js`): a friend with a bond of 7 or more, or your friend for life at 5 or more, comes for three rounds with their own way of fighting (Bhima draws the blows and guards, Arjuna shoots from range and pins, Karna strikes heavy and feints, Duryodhana with the mace, Charu with a hammer and no armour); only where they could be (not dead, not a friendship that ended, no Arjuna in his years away during the exile, no prince in the hidden year, no one from the other side once you have chosen yours). A friend below two fifths of their strength when the fight ends carries a scar for you, remembered in the bonds panel and the journal; Charu can die in a deadly fight you called them into, and the call button says so. The war keeps its own rule (`K.warHelp`).

### 18.2 The night the lac house burns (Act III)
- Players at Varnavata who are inside the house on the night of the fire play a timed escape on a top-down plan of the burning house: open doors, wake sleepers, read where the smoke is going, reach the tunnel.
- Variant for those who know of the plot (Vidura's people, spies): earlier that night, find and cut Purochana's oil-soaked fuse lines in the cellar; each line cut buys time in the escape. The fire still comes.
- Outcomes: reach the tunnel and survive (Bhima's debt); reach it late and lose someone you carried; fail and die in the fire (its own death ending, the burnt house at dawn). Warning the Pandavas helps Vidura's plan; staying silent to protect your own family is remembered.
- New test kinds: escape (a maze under a clock) and fuse (trace and cut), on two new stages.

As built: two scenes follow the lac house tunnel, a3_fuse and a3_fire (act3.js), with both tests in ui/lachouse.js. a3_fuse comes only to those who know the plot (taught by Vidura, on the spy path, or having helped dig the tunnel). There you choose to cut the oil lines, warn Yudhishthira plainly, or stay silent. The fuse test has three lines and a guard's lamp sweeping the cellar: hold to cut while the light is away, and being seen twice ends it. Every line cut slows the fire later. Cutting or warning sets bhima_debt, a flag later scenes can read. a3_fire is canon and comes to everyone. Those inside the house (they tried to wake the Nishada family, dug the tunnel, warned, or cut) play the escape from inside. Those outside can run in from the door or stay in the lane. The escape is a 5×5 room plan. The fire spreads from Purochana's corner toward the tunnel and smoke slows you; stuck doors and waking sleepers need a hold, and carrying someone slows each step. Results: reach the tunnel to escape, with carried_out_lac if you brought someone; reach it as the last rooms burn and lose the one you carried, with a scar; or be caught. Being caught means death and the ending "The burnt house" (art end_fire). In story mode it means burns instead. There is no loop-back. Staying beside the sleepers who will not wake is a deliberate death. The escape and the cellar both use full-screen paintings (stage_lac_fire_top, stage_lac_cellar, and their tall versions). Canon is unchanged: the house burns, the Pandavas escape, and the Nishada family and Purochana die. The ending's telling recalls the cut lines, the warning, the carry or the burns.

### 18.3 Rising to command, and holding against Karna or Duryodhana (Act VI)
- The first rung is earned, not handed out: on the eve of the war the commander tests anyone who asks for a company ("Set the formation", §18.11 C1).
- Rank: company leader, then division officer, then a seat at the war council, earned through duty, the command skill and each war day's result.
- Army battles: deploy two or three companies into the day's array (vyuha: crane, wheel, crocodile, needle), then rounds of orders: hold, flank, fall back, send help.
- Facing the other side's champions is won by holding, never by killing. Pandava side: keep Karna's chariot pinned until sunset; keep Duryodhana's division off the king's flank for ten rounds. Kaurava side: hold against Arjuna's chariot; stand against Bhima's charge. Losing breaks the company and costs scars, capture or, if the player stays, death.
- New: an array test on a top-down battlefield; four holding fights with their own backgrounds (two for each side); council and promotion scenes.

*As built (content/command.js, ui/army.js):* rank is three flags — `role_command` (won at the muster), `role_division` (promotion scene before Bhishma's fall: Command 4+ and a won last day) and `role_council` (before the fourteenth day: Command 5+, still a division officer, company intact) — shown as a "Rank" line in the character sheet and named in the telling. Division officers may set the day's array twice (at dawn on the eleventh and the fifteenth days): the `array` test places the companies on three marks of a crane, wheel, crocodile or needle on the `stage_vyuha_top` painting, then 4–6 rounds of orders (hold, flank, fall back, send help to a sector) against a pushed line with a strength bar; Command and Statecraft widen each swing. A held line is remembered; a broken one (`line_broken`) sends the enemy into the next deadly fight already inspired. The four holding fights use `enc.hold` in the combat engine: the fight is won when the round passes the hold count with the player alive, a countdown line closes each round, and the champion can never be brought below a tenth of his strength (canon lock: champions are held, never killed). Pandava: Karna's chariot until sunset (6 rounds), the king's flank against Duryodhana (8 rounds — shortened from ten so it can be won). Kaurava: Arjuna's chariot (6), Bhima's charge (7). Each is offered once, only to division officers or council members, and the council's flank choice decides which of the side's two is offered. A lost hold breaks the company (`company_broken`: no company at your side for the rest of the war) and leads to a last choice — fall back with a scar, rally (a Command test, capture on failure) or stay with the men who stayed (death). Three council scenes (before days 15, 16 and 17) choose the flank, can press for a truce at dusk (`council_truce`, for the threads), and let the player counsel mercy or speak against the night raid and against killing Karna at his wheel. Paintings: `scene_command_banner` (promotion), `scene_war_council`, `stage_vyuha_top`, and `fight_karna_chariot`, `fight_duryodhana_line`, `fight_arjuna_chariot`, `fight_bhima_charge` for the holds.

### 18.4 Threads that run through a life
- **A rival:** Ugra, the bully from the spring fair, grows up beside you, rises in the opposite camp and meets you again in the tournament and on the field.
- **The secret you carry:** you learn Karna's birth before he does; who you tell changes how they treat you.
- **Mentor's fall:** Drona orders something wrong (Ekalavya, the capture plot); obey or refuse.
- **A sibling on the other side** of the war.

*As built (game/js/content/episodes.js; every scene there is optional, comes before a scene every road reaches, and has an id starting `ep_`):* Ugra, met at the spring fair, waits at the princes' tournament for a wrestling bout (push test, tournament arena); writes before the war as a captain of levies in the other camp; and meets you on the seventeenth day: fight him, or try to send him home with all his men. The secret: before Karna's own scene you may tell Duryodhana (Karna's bond falls, and he remembers who told), Yudhishthira, Kunti, or no one. The teacher's wrong ask comes from each teacher in their own way: Drona's are already in the main story; Vidura asks you to spy on your friend, Kripa asks you to swear the throne is right before the dice, Balarama and Mauni ask you not to fight at all (a promise kept or broken). An elder brother or sister (Dev or Devi) is chosen in childhood; before the war they come home in the other side's colours: promise to look away (and take their amulet), argue them round, or say nothing; on the seventeenth day you meet across a spear's length.

### 18.5 Episodes
- **Exile:** a storm in the forest (survival run); the Yaksha's lake as a fuller riddle test where losing costs a friend.
- **The hidden year:** keeping your false name in Virata's court (a test of nerve); Kichaka's court: help Draupadi with her dignity kept, by stealth in the dancing hall at night.
- **War:** a night raid on the enemy's supply carts; carrying false orders across the river between the camps (burn them or deliver them); the truce at dusk, when soldiers of both sides meet at the river and you see an old friend; trying to break into the wheel after Abhimanyu, knowing the story will not let you save him (designed as the last stand, §18.11 C2).
- **Duty clashes:** asked to confirm "Ashwatthama is dead" (against the vow of truth); asked to help Shikhandi's charge at Bhishma; ordered to strike while Karna is out of his chariot (against the vow to spare the unarmed).
- **After the war:** rebuilding Hastinapura's ruined quarter; whom to forgive (a riverside rite for the dead); teaching a student of your own path; a pilgrimage with the elders.

*As built:* the storm is a run on foot through the falling branches (race test, `vehicle: "foot"`, exile storm stage). At the Yaksha's lake, a player whose friend is Charu and who answers wrong the second time sees Charu drink first; a second riddle test answers for both, and losing it (or running for the camp) costs Charu's life. The hidden year: the steward's questions (retort test, Virata's court) and Kichaka's dancing hall (sneak test, Kichaka's hall at night), where Draupadi is helped out of the way and Bhima does what the story says. The war: the supply carts (sneak test on the supply camp stage; caught, you fight your way out), false orders (swim the river crossing with the packet, which weakens the enemy line in the next fight; or burn it, which inspires your own), the truce at dusk (when someone you love is across the river), and riding in front of Shikhandi (a fight held for three rounds against Bhishma's guard, never Bhishma; Pandava side only). The other two duty clashes are vow scenes (content/vows.js). After the war: the ruined quarter (with your hands or by organising it), the rite at the river (send a lamp for whoever killed your dead too), a student who is set the test of your own path, and the walk with Dhritarashtra, Gandhari and Kunti.

### 18.6 Small systems
- Bards sing what you did, and get it wrong unless you correct them.
- Letters from friends on the other side during the war.
- Scars and keepsakes that become choices later.

*As built:* the bard sings one thing you did turned the other way round (a lore check to correct him); if it stands, the Book of Lives ends with "They say that…", the wrong version. Two letters come under a truce flag from a friend, your sibling or Ugra on the other side (after the tenth day, and the night before the seventeenth); one kept becomes a keepsake. Keepsakes (`S.keepsakes`: the letter, your sibling's amulet, Kesava's hammer, an arrow from the supply camp) are laid out on a cloth after the war, and each is a choice: burn, return, send to the river, hang over your door. Every thread and episode adds its line to the telling (`K.TELL_HOOKS`).

### 18.7 Divine weapons and shields
Builds on the existing boons (one generic astra, foresight, healing hands) and curses (misusing an astra on the helpless).
- **Emphatic, not story-altering.** Against ordinary foes (bandits, a Gandharva, raiders, an enemy company) an astra wins the fight in one full-screen moment. Against the epic's heroes (Karna, Arjuna, Bhishma, Drona, Ashwatthama) it is met by its counter-weapon in mid-air, as it is throughout the epic: a spectacular clash that buys rounds in a holding fight, never a kill.
- **Limits.** Once per battle. The mantra fails at the worst hour if the player broke their teacher's trust (the existing hermit's curse). Turning it on the helpless brings the existing curse.
- **Out of reach:** Brahmastra, Pashupata, Narayanastra. At most the Brahmastra is offered once as a temptation with a terrible price, as it was to Ashwatthama, and can be refused.
- **Seen and heard:** every invocation is a full-screen moment drawn in code over the battle painting, with its own effect per weapon and a mid-air clash against a counter-weapon (§18.11 C3).

| Weapon | In a fight | Earned by |
|---|---|---|
| Agneyastra (fire) | Strikes every enemy; burning | Penance at a fire altar: a steady test held through a season of storms |
| Varunastra (water) | Puts out fire, cures burns, stuns | Diving for a sage's lost offering in a deep lake (a breath test) |
| Vayavyastra (wind) | Scatters the line, breaks guards; buys rounds in a holding fight | The climb to a Himalayan hermitage (a course up the mountain) |
| Sammohana (stupor) | Puts an enemy group to sleep (Arjuna at Virata); escape or spare without killing | Answering a Gandharva's riddles |
| Nagapasha (serpent noose) | Binds one foe alive: capture, not kill | Healing a wounded naga by the river |

Shields and protections: a sage's **kavacha** (turns one fatal blow per war; a lesser echo of Karna's armour, never his); a **charmed shield** (blocks the first blow of every fight); a **raksha sutra** tied by mother or spouse before the war (once, turns a peril death into a wound).
Other ways to earn: a year serving a sage; returning a stolen temple offering (stealth); sparing a defeated Gandharva (canon: Arjuna and Chitraratha); a teacher's gift at a high bond (Drona, Kripa, Mauni already); a test at Shiva's mountain, shown only as light and a voice (no divine figures).

### 18.8 Magic, blessings and tapas
- **Tapas** (spiritual merit) is the resource: earned by keeping vows over years, penance, service to sages and hard right choices; spent to invoke magic. Breaking a vow drains it.

| Magic | Effect | Source |
|---|---|---|
| Bala and Atibala mantras | No hunger or fatigue: +1 might and grace for an act | A sage's teaching (Vishwamitra's mantras to Rama) |
| Mritasanjivani root | One extra life: the next death is undone, then it is gone | A healer's deathbed gift, or a dangerous climb |
| Antardhana (vanishing) | Pass one stealth check or test, once per act | A Gandharva or naga teacher |
| Elders' blessings | +1 to every test for a day | Mother before the war; Bhishma; the teacher |
| Soma at a great sacrifice | +2 to one attribute for a test day, −1 the next | A yajna at Indraprastha or Hastinapura |
| Rite to lift a curse | Removes one curse at a heavy tapas cost | Sages, a long penance |

- Every effect is temporary, charged or once only, and shown before the player chooses (spend and gain), like odds and danger today. Magic can carry a player through a peril, a holding fight or a hard test; the epic's events still happen as written. Spent carelessly, it costs tapas or brings a curse.

#### 18.7 and 18.8 as built (31 October)
Code: `content/astras.js` (weapons, givers, quests, magic, shields, the temptation), `ui/breath.js` (the new breath test), hooks in `engine/core.js`, `flow.js`, `combat.js`, `abilities.js` and the sheet (`ui/ledger.js`). Hindi in `i18n/hi/manual_weapons.json`. Rule checks in `tests/rules.js` §12–18.
- **Tapas** (0–20, on the sheet as a meter): +1 an act for each kept vow (celibacy +2), +3 for penance, +2 for serving the sages or answering the Yaksha, +1 for hard right choices (Ekalavya, Charu, water for Bhishma, freeing the captive, forgiving the debt) and for each quest won. A broken vow halves it. Choices preview "Tapas +n" / "Costs n tapas"; locked choices read "Needs n tapas".
- **Named weapons** live in `S.astras` ([{id, from}]); the old generic astra (`boons:["astra"]`, `S.astra`) still works beside them. All astras share one "once a battle" mantra. With two or more, the fight shows a single "Invoke astra" card that opens a chooser. The moment names the weapon and its mantra. Against the epic's heroes each one is met by its counter-weapon (a clash, never a kill).

| Weapon | In a fight | Quest (act 5, before) | Condition (giver) |
|---|---|---|---|
| Agneyastra | Strikes all; burning (7% a round) | Fire altar, steady test (before Jayadratha) | Never on one who cannot fight back (the fire: stays, mantra cursed) |
| Varunastra | Puts out burning, stuns | Deep lake, new **breath** test (before Matsya; the strong) | Never lie about where it came from (the sage takes it back) |
| Vayavyastra | Scatters, breaks guards, +2 rounds held | Climb on foot through rock and ice (before Matsya; the nimble); or a year serving a sage; or Shiva's mountain | Never turn from a fight you chose (the hermit takes it back) |
| Sammohana | Puts enemies to sleep (spareable) | Gandharva's riddles, retort test (before Vikarna); or sparing the Gandharva | Never on the sleeping or unarmed |
| Nagapasha | Binds one foe alive (spareable) | Healing a naga, steady test (before the forge) | Never on one who cannot fight back |

At most two quests are offered in a life (`S.astraOffers`). The dive and the climb share a road, so the player's stronger side (might or grace) decides which one comes.
- **Shields:** the charmed shield (returning the stolen temple lamp, a sneak test) turns the first enemy blow of every fight. The kavacha (Shiva's mountain, only light and a voice, with sages rep 6 or more) leaves you at 1 hp once in a lethal fight. The raksha sutra (the night before the war) undoes one death outside battle as a scar.
- **Magic:**
  - Bala and Atibala: 3 tapas at the forest sages, +1 might and grace until act 6.
  - Sanjivani root: the near-miss on the climb; undoes one death, after the raksha.
  - Antardhana: from the spared Gandharva; once an act a failed stealth check passes, or a sneak/herd test is skipped ("Vanish instead").
  - Elders' blessing: war eve, +1 to every test for the next few choices.
  - Soma: 2 tapas at the Rajasuya; +2 to your best attribute for a day, then −1 for a day.
  - Rite to lift a curse: 6 tapas at the forest sages.
- **The Brahmastra** is offered once, on the last night (before the raid). Taking it costs all tapas, brings a curse and costs conscience −3; it is never a usable weapon. Refusing it gives tapas +2. The Pashupata and Narayanastra do not appear.
- **Art:** the paintings for the fire altar, deep lake, mountain path, Gandharva grove, naga bank, Shiva's mountain, temple offering, sage's year, Brahmastra night, raksha sutra and Soma arrived on 31 October; `STANDIN` in `astras.js` is now empty. Retouches to `stage_shiva_mountain`, `stage_naga_bank` and `stage_mountain_path` are in §17.
- **Since 31 October:** an astra's condition broken by a choice shows as a broken-arrow icon on the card, and the "Tapas +n" previews are gone with the other effect lines (§18.15) [69]. The Varunastra dive is played in the water [71].

### 18.9 The puppet as the heart of the action
The tholu bommalata puppets (drawn in code; no paintings needed) become fully animated and playable.
- **Active defence in fights**, replacing the button-and-bar block and dodge: the enemy puppet visibly winds up, then the player **jumps** a low arrow (swipe up or ↑), **ducks** a high swing (swipe down or ↓), **sidesteps** a thrust or an elephant's charge (swipe sideways or ←/→) or **blocks** with a shield (hold or space). Arrows fly as leather cut-outs with a shadow trail. A perfect move opens a counter-strike; late takes a graze; wrong takes the hit. Fits the existing timed defence, so balance holds; story mode and an assist setting dodge automatically. Holding fights against Karna's arrows or Bhima's charge become a run of reads and dodges.
- **A better puppet, closer to the real craft:** articulated shoulder, elbow, hip and knee moved like a puppeteer's rods (one central rod, two to the hands, faintly visible); poses blend instead of snapping, with sway in the dangling limbs; a hop with a little hang at the top; the turn (flipping the puppet to face the other way) for retreat or surprise; light and distance (a rival looms large and soft when far from the screen, sharp as he steps in); a moving jaw for speech.
- **The puppet tells the life:** it ages from child to elder across the acts; it carries the path's gear (bow and quiver, mace, chariot whip, healer's satchel), scars as stitched leather patches, a faint glow for an astra or raksha sutra; it bows, folds its hands, turns away in shame, trembles before a peril. A sutradhara (narrator) puppet introduces each act.
- **Inside the tests:** move the puppet along the wall in stealth; the bow arm follows the aim; wrestlers lock and strain; the puppet rides the chariot or boat and leans into turns.
- **As built (30 October), the leftovers:** a hinged lower jaw (the beard rides on it) that moves while a line of speech is written: a speaker who has a puppet now speaks through a small figure of their own beside the line; the turn (`pose-turn`: the figure flips to face away, the rods staying) when you withdraw from a fight; light and distance in the arena (enemies far from you a little larger and softer, sharpening as they step in to act); elders grey and stooped; an archer's quiver and a healer's satchel; and the menu's "Meet blows for me", which resolves the defence moments on the kinder odds (on by itself in story mode) and changes nothing when off. Still to do: pose blending between joints.
- **Built 2 November (quality review) [47–53]:** pose blending, as springs on every joint (`ui/puppet-anim.js`; §16.3), with wind-ups, hit-freeze, knockback and slack-limbed falls; the bow held upright with a string drawn to the face; the stealth creep and the guard's torch; leather chariots with horses, a driver and the whip; wrestlers and the timing test's three faces. Next: the master-leather redraw (§18.14).

### 18.10 Order of work
All steps are built (29 October to 2 November), except the master-leather redraw in step 5, which is being built from 3 November.
0. The playtest changes in §18.11, built together with the next art batch. *Built 29 October.*
1. Friends in fights (no art). *Built 30–31 October.*
2. The lac house escape (6 pictures), and three pictures for failure, already built (a cell, a prisoners' pen, a life cut short). *Built 31 October.*
3. Command, arrays and the holding fights, for both sides (12 pictures). *Built 31 October.*
4. Threads, episodes and the after-war scenes, a few at a time (21 pictures). *Built 31 October.*
5. The puppet: active defence (jump, duck, sidestep) first, then joints and pose blending, then redrawing the figure as master leather (§18.14), then gear, ageing and scars (no paintings). *Built 29 October to 2 November; master leather being built 3 November.*
6. Divine weapons, shields, magic and tapas (31 pictures: 14 emblems, 6 test stages in tall and wide, 5 scenes; in `docs/Art_Brief_Weapons_Magic.pdf`). *Built 31 October.*

### 18.11 Changes from the 29 October playtest
Collected from play feedback. **Built 29 October** (all items below, D1 to F5; the owner asked to build them together, without waiting for the art batch). Numbers in brackets are the project's `Change_List.md`. Where the annex art (`docs/Art_Brief_Annex_Playtest.pdf`) has not arrived, the game uses existing paintings: the war field for the last stand, Drona's training ground for the audition, the wheel's top-down field for the formation test, the night battlefield for the chariot run, and the path painting for the armoury.

As built, two details differ from the proposal: the armoury is the existing path choice reworked (seven things laid out, each saying whether it suits you; its test follows at once and a double failure sends you back to choose again), and divine gifts by weapon wait for §18.7, since the game still has one generic astra. (31 October: §18.7 gave five named astras, open to every path; which quest comes depends on might or grace, not the weapon [30, 36].)

**Decided**
- **D1. Ugra's wrestling bout** [1] plays on the empty fair-ring painting (`fight_fair_ring`), not the fair scene that already shows two wrestlers.
- **D2. Drona is selective** [2]. Anyone may ask, but a player not of the court first passes a very hard archery audition (Drona's bird at long range, a tiny target, low odds). Pass: he takes you grudgingly, and the court remembers. Fail: choose another teacher (the existing loop-back). Court children go straight to his usual test.
- **D3. Choosing a weapon: choose, then prove it** [3]. An armoury scene: bow, mace, sword, chariot reins, staff, each with a hint from your attributes ("Your might suits the mace"). Pick one, then its test. Fail twice and that weapon is crossed out (loop-back). The weapon later decides which divine gifts suit you (archers: astras; mace and wrestling: Bala and Atibala; healers: Sanjivani; spies: Antardhana). *As built:* seven things (the bow, the mace, the reins, statecraft, healing, secrets, the vina); divine weapons stay open to every path [36]. *Since 2 November* the choice is a grid of weapon pictures you tap, and the cards no longer say which one suits your best attribute (§18.15) [69].
- **D4. Archery aim and placement** [4]. The player's puppet in the lower-left third facing right; the teacher at the left edge, smaller and further back; another student on the right, smaller; figures never overlap. The aim line starts at the bow hand and points diagonally at the target; the arrow flies along it in a slight arc, shrinking with distance; the bow arm and shoulders turn toward the target and follow moving targets.
- **C1. Becoming a commander: "Set the formation"** [13]. On the eve of the war, strategist training or Command 4 only lets you *ask* for a company. The army's commander tests you: Dhrishtadyumna for the Pandavas, Bhishma for the Kauravas (Bhishma also refuses Karna a place while he commands). The test (Command + statecraft), on the top-down field painting already in the game (`stage_chakravyuha_top`, no new art): the commander names a formation (crane, eagle, crescent); archers, chariots, spearmen and elephants arrive one at a time and you place each on its mark before the drums stop; then the enemy probes one flank and you send the reserve to the right place. Second chance as usual; fail twice and the company goes to someone else and you fight in the front line, with a journal line (no peril; it is a drill). The role then matters (today the `role_command` flag is never read): commanders lead their company in every war battle (the Command move gets an ally), face the day-13 wheel as their company's leader, and are named in the telling and the ending.

**Also built (proposed, then included in the build)**
- **C2. Inside the Chakravyuha: a real last stand** [15]. Today "Stay beside Abhimanyu to the end" is a single choice that kills at once.
  - *The fight:* a holding fight beside Abhimanyu (an ally) against Drona and Karna, with Kripa, Ashwatthama and Duryodhana's sons as the ring. The epic's beats arrive round by round as field events: on Drona's word Karna cuts Abhimanyu's bow from behind; his charioteer and horses fall; his sword breaks; he fights on with a chariot wheel. Each round held spares Abhimanyu wounds and is counted.
  - *The divine weapon fails here, as in the epic:* an astra is answered by Drona's or Karna's counter-weapon in mid-air (C3). It buys a round, never the fight.
  - *The last test, "The ring closes":* a rings test made deliberately unwinnable (the openings never all line up). Not scored as pass or fail; it measures how long you hold, and the ending says so ("{name} held the ring open for forty heartbeats beside Abhimanyu").
  - *Then the fall:* its own death screen (`end_wheel`), not "Fallen at Kurukshetra". Story mode: dragged out unconscious, as with other deaths.
  - Kaurava side: the same fight from the other side; the order to cut his bow comes to you (obey, refuse, hold back). "Cut your way back out" stays the escape.
  - *Added 29 Oct:* on the Kaurava side, holding your stretch of the ring is a fight no one survives, as on that day: Abhimanyu's arrows grow surer round by round; only withdrawing saves you (story mode: a wound). Its own ending, "Against the boy in the wheel". In both wheel fights: **Call for help** once (Karna or Duryodhana come for two rounds if you are their friend; on the Pandava side Jayadratha's line holds and no one comes), and the astra is listed for everyone (greyed for those never given one; Abhimanyu answers it with its counter).
- **C3. Divine weapons look and feel divine** [16]. Every invocation is a short full-screen moment drawn in code over the battle painting (no new art, no video): the painting darkens, the mantra appears as a line of light, the puppet raises the weapon. Agneyastra: fire rains down, orange light and embers. Varunastra: sheets of rain, a blue tint, steam where fire was. Vayavyastra: wind and dust, banners whipping, the enemy pushed back. Sammohana: a violet haze, the foes slump asleep. Nagapasha: a serpent coil around one foe. Today's generic astra: a white bolt and a shockwave. Against a hero, the counter-weapon clash: two streaks meet in a white flash, a shockwave ring and a short screen shake. A synthesised sound swell. Reduced motion: one soft flash; nothing flashes more than three times a second. Can ship first with the one astra the game already has.
- **C4. A test for the chariot driver** [14]. "Driving a chariot" on the eve of the war needs only chariot skill 2; add a short chariot run (the race mechanic, on the battlefield painting) before a warrior accepts you as driver.
- **F1. Puppets floating in fights** [8]. Fights that borrow tall test-stage paintings put the figures on the sky. Each fight background records its ground line and the figures' feet stand on it; a soft shadow under each puppet; a screen check that every fight's figures stand on their painting's ground.
- **F2. Moves that cannot be used** [9] ("Command: no ally to command", "Close formation" one-on-one): hide them, or grey them into a small "other moves" row.
- **F3. The lac house burns before the fire** [10]. The Varnavata opening plays the clip that ends in flames. Open on the calm painting with no clip; play the fire clip when the story reaches the fire (and as the start of the escape, §18.2). Check every clip's last frame against the scene that plays it.
- **F4. The guard in stealth tests** [11]. The guard carries the torch and the beam comes from it; he patrols the far side while the player moves from the left through the shadows; he pauses and lifts the torch before turning (a tell); when he sees you he steps toward you and the beam locks on. All stealth tests.
- **F5. The map follows the story** [12]. Today the map ignores story scenes before the war unless they name a destination, though almost all put the player there; the marker stays put through Pramanakoti, the road to Panchala, the Rajasuya, the dice invitation and the whole exile (Kamyaka, Dvaita, Matsya, back to Hastinapura). Drop that exception so a scene naming a town moves you there; give towns to the Yaksha's lake (Dvaita), Karna at the river (Hastinapura), Ekalavya's forest (Hastinapura) and Duryodhana's lake (Kurukshetra); add a playthrough check that no scene names a town the marker isn't on.

**Done** (pushed 29 October): the lotus-pond game and four other choices now show what happened; every second-chance scene opens on its test's painting.

**Built 29 October, late (sound and the puppet)**
- **S1. Sound, all synthesised in code** (no recordings, no voices): the great war's fights open with a call to arms (conches answering each other, nagara drums rolling faster, hooves and chariot wheels, a wordless roar of many voices, an elephant); other fights with a drum call. A fall in battle muffles the world, slows to a heartbeat, one far conch, then silence before the ending; a friend falling stops the drums for a breath; a death outside battle tolls one low bell; when the ring closes in the wheel the music stops dead. Tests play a quiet bed by kind (archery and other timing tests: a drone with no beat; stealth: a drone and a quickening heartbeat; wrestling: dhol; board games and wits: sparse veena; war tests: nagara; the rhythm test keeps its own beat), and a losing sting sits beside the winning themes. Each place plays its own short piece once per arrival (about a minute: raga, lead voice, drum and the sounds of the place), e.g. Hastinapura in Yaman with a shehnai-like reed and pakhawaj; the Nishada villages in Bhupali with bamboo flute, frame drum, birds and insects; Gandhara in Multani with rabab-like strings; the exile forests in Malkauns with night insects.
- **P1. Active defence** (§18.9): a blow aimed at you is read and met: the enemy winds up, a leather cut-out (arrow, blade or charge) flies at the height it will strike, and you jump a low one, duck a high one, sidestep a thrust or charge (swipe, arrow keys or buttons), or block anything for half the harm. Perfect timing with the right move: a counter-strike; the right move late: a graze; the wrong move: the full blow. Your puppet hops (with a little hang at the top), crouches or steps aside. With timed moments off, and in the automated tests, blows are met by chance as before.
- **P2. The puppet** (§18.9, first part): the puppeteer's main rod faintly visible; dangling limbs sway; a scar is a stitched patch of darker leather; a faint glow about one who carries a divine weapon; new poses (hands folded, a bow, shame, trembling): the figure trembles before a choice that could cost your life or freedom, turns away in shame after a wrong, folds its hands after respect given; the sutradhara opens each act beside its name; in the chariot race the figure leans into each turn; wrestlers close and lean into each other. Still to do: the jaw for speech, light and distance, the turn, ageing details and gear beyond what the figure already carries.
- **M1. The family's move to Hastinapura** plays on the map after the scene that tells why the family was called there (scenes marked `travelAfter`), not before it.

### 18.12 Moments, the practice ground and vows that matter (built 30 October)
Decided 30 October in a design session, then built. Numbers in brackets are the Change List's.

**Moments** [22]. The big milestones of a life get a few seconds of their own: a painting moving slowly, a gold title, one line of memory, a short theme synthesised in code; a tap goes on. They are noticed in the engine whatever choice or test caused them, and kept as cards in the character sheet and in the Book of Lives.
- *Kinds:* a friend for life ("A friend for life: Karna"; your figure and your friend's step in from the clear side edges and reach for each other's hands); a divine weapon (the screen darkens, the mantra runs as a line of light, an arrow of light rises from the weapon on the ground into your raised hand and the faint glow stays; the giver's condition is shown); your teacher's yes; your marriage; a vow (its gift, watchers and price); a company of your own. A friendship that ends gets a grey farewell with the friend's last words.
- *Paintings (option B, arrived 30 October):* one per friendship (Arjuna's lamp at night, Bhima at the river, Duryodhana by the lotus pond, Karna and the horse, Charu at the forge), the astra in the forest clearing, the teacher at dawn, the wedding hands over the fire; tall and wide. Vows and the company use option A (the vow's emblem over the vow painting; the strategist's emblem over the war's eve); where a person has no moment painting, their portrait stands in a gold frame over the place.
- *Themes:* friendship, the flute in Yaman over a tabla rising to a held note; divine weapon, a far conch, temple bells and a drone opening into a chord; milestones, one bronze bell and the flute in Desh; farewell, the flute alone, falling. Reduced motion: the still painting and the title.
- *Waiting on art:* repaints of Duryodhana's moment (glass lanterns, pagoda roofs, two boys dressed alike), Bhima's wide moment (faces) and Vidura's portrait (a modern pen); the five weapons' own moments come with §18.7. *All arrived and installed 31 October* [22]. Since 1 November a painting that already shows the friends has no puppets over it [35].

**The practice ground** [23]. Rehearsal only (option 1): practice changes nothing in the story, the stats or the record. Reached from the menu between scenes, offered beside a second chance after a failed test, and after a lost fight that was not deadly. Every kind of test met in this life or an earlier one can be practised (others locked); sparring under the real fight rules at a chosen strength, never deadly, against training partners only (a straw dummy, a fellow student, the teacher; never the opponent who beat you); a drill for reading blows (jump, duck, sidestep, block), slow then faster. The teacher's figure gives a tip for each kind; three speeds (slow and normal slow the test's clock; real is the test itself); a "Show me" button; the training-ground painting and a calm tabla drill under it. Everything runs on a copy of the life that is put back exactly when it ends. Never inside a deadly fight or a perilous choice; war fights cannot be retried. Test kinds met in earlier lives are remembered from now on, and each life's list is kept in its Book of Lives entry. The two timed shows (signs in order, the thrower's hands) follow the speed setting; for the four board games the same three buttons set how much the teacher helps instead (Point it out / When I ask / No help), the hint being the move a careful player would make.

**Vows that matter** [24]. Each vow has a gift while kept, watchers who share its value, and a price when broken, all shown when you swear it (on the choice and in its moment), in the character sheet, and on any choice that would break it ("Breaks vow: Never to speak a lie · Yudhishthira, Vidura, the sages will not forgive it · your chariot wheel will stick at the worst moment"). Since 2 November a choice that would break a vow shows the vow's emblem struck through instead, labelled with the vow and its watchers; the price is no longer shown there (§18.15) [69]. Watchers' bonds fall by 3 when a vow is broken. Gifts grow the longer a vow is kept: one more point after holding firm in a deadly fight (never to retreat), after fifteen years kept (honest persuasion, the common people's warnings), and Bhishma's blessing in the war (celibacy). Spiritual merit for celibacy waits for §18.8.
- *Never to retreat:* +1 attack; one more after holding firm through a deadly fight. Watchers Bhima, Karna, your company. Broken: the company is shaken (weakened) in its next fight; the strength is lost.
- *Never to lie:* "My word": once in each act, a statecraft test that is not itself a lie passes without a roll ("Your word is enough"); +1 on honest persuasion. Watchers Yudhishthira, Vidura, the sages. Broken: "My word" is gone, and once, in a deadly fight of the war, the chariot wheel sticks in the earth (a curse that fires as the fight begins).
- *Never to strike the unarmed:* common people warn you of ambushes (+1 stealth); a foe you spared may drag you out of a deadly fight once (a scar instead of death). Watchers Arjuna, Charu, the common people. Broken: a weapon given on this condition is lost.
- *Never to strike Karna:* in the war, under this vow on the Pandava side, Karna answers your call across the lines and stands your enemies off (never against his brothers). Broken: his friendship ends at once, with his last words.
- *Celibacy:* +1 Wisdom; Bhishma's blessing on the eve of the war (+1 defence). Broken: no blessing, and the Wisdom point is lost.
- *Vengeance:* +1 attack against the one sworn against; unanswered at the end, the telling darkens.
- *Friendship ends below 3:* any loss that takes your friend for life below 3 ends the friendship (said on the choice before you make it): a farewell, the friend leaves the bonds panel, and a call for help no longer reaches them. Every deadly fight of the war now has "Call for help": your friend comes if on your side, otherwise is too far down the line.
- *A divine weapon's condition,* named by its giver and shown in its moment and the character sheet: Drona, never against someone who cannot fight back; Kripa, never lie to me or before the court; Mauni, never say who taught you; the voice in the fire (penance), never against someone who cannot fight back. A teacher takes the weapon back at once; the fire's gift stays, but its mantra fails once in a deadly fight.
- *Friends who pull at a vow:* new scenes, each only when it applies: your friend asks you to lie for them at court (Act III; Duryodhana's version when he is your friend; refusing raises Vidura or Yudhishthira); your wounded friend begs you to fall back at a river crossing (Act V, never to retreat); your friend wants a bound spy silenced (Act V, never to strike the unarmed); a Pandava friend wants you to loose at Karna, stuck open in a ford during the cattle raid (Act V, never to strike Karna). Each has an honest third way through a test.
- *The way back:* one heavy penance a life, at an ashram before the war, lifts a broken vow's shame (the price, not the gift; watchers +2, conscience +2); a lost friend returns only through a scene with that friend (a ride to their camp before the war; a test of wisdom, easier after penance). The telling names broken vows atoned, lost friendships and broken weapon conditions.

### 18.13 The war storylines (built 2 November)
Proposed and built on 2 November, and on the public site the same day after the full test pass. Numbers in brackets are the Change List's; storyline numbers (#1 to #8) are the proposal's. Code: one file per storyline in `content/war_*.js`, with `war_reach.js` loaded first; `ui/fightmodes.js` and `ui/warmap.js`; Hindi in `i18n/hi/manual_war_*.json`; checks in `tests/rules.js` and `tests/crossing.js`. Paintings: a batch of 31, and the great duel's two (`scene_duel_ground`, Vrishasena's portrait). Each storyline comes only to the lives it fits, in scenes before the war days that every road reaches. Canon holds: every canon death comes on its day, and champions are held, never killed.

- **Yuyutsu's call (#1, days 1–4)** [64]. Before the first arrow Yudhishthira calls that anyone may still change sides. A Kaurava-side player may cross with Yuyutsu: every bond on the old side falls by 3, a friend for life there ends at once, and crossing counts as retreat. The new side gives a place, not trust: rank and the call for help are lost, and a guard sleeps across the tent door. You prove yourself by any of: the day-2 duel against the man your old side sends (Ugra if he stood beside you, otherwise Kanaka from your old company); explaining to Dhrishtadyumna why you spared him; a test of truth before Yudhishthira on the third night; catching the real spy who copies the array on the fourth. Not proven by then, you stay suspected for the war: no rank, no help, the worst postings. A Pandava-side player may instead call a sibling across (a statecraft test). Everything after follows the new side. Its own ending, "The one who crossed".
- **Iravan (#2, day 8)** [62]. Pandava players with a naga tie ride beside Arjuna's son by Ulupi against Shakuni's horse (a six-round hold). At dusk he is dead, as written; his body can be carried to the river under fire (a stealth test), and then a naga of Ulupi's people answers one call for help in the war. The nagas' trust also comes from leading families out of the Khandava fire, or leading the cobra out of the well-house as a child.
- **The Samshaptakas' oath (#3, day 12)** [63]. Kaurava side: swear with the Trigartas to fight Arjuna until he or you die, a fourth vow above the limit, for the war only (+2 attack, +1 defence). You hold in front of Arjuna's chariot on days 12 and 16; withdrawing breaks the oath. Falling with it on you is its own ending, "The oath to the death". Pandava side: the crescent array that keeps Drona's eagle off the king.
- **Bhurishravas (#4, day 14)** [57, 58]. Hold him off Satyaki, then choose while he sits after losing his arm (the vow never to strike the unarmed). Every Pandava fighter is ordered to ride with Satyaki that day, and how the ride goes sets how worn out Satyaki is when Bhurishravas reaches him. Satyaki is a full, larger figure.
- **The Shakti spent (#5, the night of day 14)** [56]. Kaurava side: hold off Ghatotkacha's night form and call Karna in. Pandava side: try to reach Karna's chariot before he throws. What you said is what Karna answers on day 17.
- **Your king falls (#6, day 15)** [57, 58]. For those born in or serving Panchala or Matsya: carry your king from the field, see Dhrishtadyumna go for Drona, and take word home. The cry "Ashwatthama is dead" is a lie, and joining it breaks the vow never to lie; days 14 and 15 are quoted back at you in one night debate.
- **Your child on the field (#7)** [55]. The child raised in the exile years may serve another company: choose his commander, tie a thread on his wrist on the eve (a moment), receive two letters from his lines, and on one day his line comes up beside yours, where a call for help can reach him. What he lived through decides his fate, the night raid included.
- **The lake (day 18)** [62]. Spies, scouts and Duryodhana's friends search the reeds of Dvaipayana at dusk (a noticing test) and fight in the reeds after dark, beside or against Ashwatthama, Kripa and Kritavarma (who cannot be killed); then tell the Pandavas, keep silent, or warn Duryodhana. He never runs, the hunters always tell, and the duel is fought as written.

**The great duel (#8, day 17)** [59]. Kaurava side: guard Karna's son Vrishasena; he falls when it ends, however long you held. Four rounds or more and Karna's last words name it; withdraw early and he never looks at you again. Pandava side: ride at Arjuna's wheels with the Panchala princes Yudhamanyu and Uttamaujas while the two champions' divine weapons clash overhead; held to the end, and the princes remember you on the night of the raid. Both fights use the chariot controls.

**Arjuna and Bhishma, shown twice** [65]. Day 9: Krishna takes up the wheel and Arjuna holds him back. Pandava side, a hold first in the line breaking under Bhishma's arrows; Kaurava side, in Bhishma's guard as Krishna runs at him. That night, those close to Yudhishthira or Arjuna go with the brothers to Bhishma's tent, where he names Shikhandi. Day 10: the barrage of arrows and the fall, with one choice (go to him, hold the line, look away). Both are moments staged with puppets over the field painting; no god is painted, and Krishna never strikes Bhishma. This is the only scene with Krishna's puppet.

**Reach** [66]. Every storyline has a plain entrance, and weaker ties bring more lives to it, strongest first: its own entrance, a company posted there by the morning's orders, a friend's word the night before, the word round the camp, and the war-day map on days 14 and 15 (the field from above, with a tappable spot for each place to stand, `ui/warmap.js`). Only fighters are drawn in by a weaker tie, and the opening line says how they came. Early ties are seeded in Acts III and IV: Satyaki at the swayamvara, little Vrishasena in Anga. Part Two of the private play page offers "Begin at the war" (§16.10). The sibling on the other side is one line on the eve of the war [71].

**Fights of other kinds** [67, 68]. In side battles only, each a hold of four rounds with one twist: escort (keep someone whole), break through (a lane each round), weather it (no striking back: guard in time and take cover), chariot duel, archery at range, mace duel, carry the wounded. By path on days 6 and 11 (one optional skirmish each), and on canon days: Bhishma's arrows (day 3), Supratika's charge (12), the outer ring of the wheel (13), the road to Jayadratha (14), the Narayana weapon (15, lay down your weapons), an archer across the field (16), the last champion (18). At most one special kind a war day. The live kinds play as their test on the fight's stage (race, aim, parry drill, steady hands); with motion off, and under the tests, they are the plain hold. Main fights keep their form and length (`tests/rules.js` §90). A cart, an elephant and the Narayana weapon are drawn as what they are.

### 18.14 The puppet's look: master leather (decided 3 November; being built 3 November)
**Decision (3 November, owner):** the characters stay tholu bommalata leather puppets, redrawn as a master craftsman would cut them (option B of the five compared on the puppet-options test page). Being built from 3 November.

**What changes.** The figure keeps today's identity: the same colours, the same opaque leather, the same faint outer glow, the same profile and joints. What changes is the craft of the cut:
- **Curved, tapered limbs.** Calf and forearm swell; ankle, wrist and neck narrow, in place of today's straight wedges and rectangles.
- **Joints you can see.** At each joint (shoulder, elbow, hip, knee) the two pieces overlap on a leather disc tied with a thread knot, as on real puppets. This suits the spring-driven rod motion already approved.
- **A firm cut edge.** A dark outline, slightly heavier than today's, so the figure reads as a cut-out against any painting.
- **Ornament where a craftsman puts it,** not all over: punched holes in rows along hems, crowns, armlets and the dhoti's edge (replacing today's even dot grid); a printed border on the dhoti or sari, a zigzag with dots in the trim colour; a scalloped hem below it; necklaces and chains as strings of beads; gold armlets, bracelets and anklets; pleats and a sash end falling from the waist.
- **Bigger hands and eyes.** A larger almond eye and fuller hands, as puppet makers exaggerate them, so expressions and gestures read on a phone.
- **Crowns** keep the approved tall form with a gold fan behind the head, now with tiers outlined in the trim colour and rows of punched holes.
- **The puppeteer's main rod** stays, faint, from the waist down out of the frame.

**What stays.** Master leather is drawn under every puppet decision of the quality review (2 November) and changes none of them: the spring-driven motion, wind-ups, hit-freeze and slack-limbed falls; solid far enemies, ground shadows, figures half the stage's height, the right gear for each test; the fight-move animations and the upright, drawing bow; the archery, stealth, race and timing-test changes; the enemy silhouettes, crowns only for the named, each hero's own mark, and age shown in Bhishma's and Drona's beards.

**What it does not do.** No backlight: the backlit-leather treatment was tried and rejected on 2 November, and colours stay opaque. No change of medium: the four other styles were set aside (A, today's puppet unchanged; C, Kalamkari painted cloth; D, Ravanachhaya pure shadow; E, painted cut-outs shaded like the paintings).

**Cost and risk.** About a week, all in code (`ui/puppet.js` and the puppet section of `css/screens.css`); no new paintings and no new AI art. Every body part is redrawn, so every pose (about 30), every test stage and every fight must be checked again. The joint origins in CSS must match the new parts exactly; a screen check should confirm that no limb separates at its joint in any pose. Figures carry more detail, so drawing cost per frame rises a little: check the frame rate on a mid-range phone in a three-a-side fight.

### 18.15 Less to read (decided and built 2 November)
The owner's decisions of 2 November on how much a player has to read [69, 70]:
- **Every question cut to the bare minimum,** and scene-setting to a line. Canon boxes ("As it is written") are one sentence; test rules one line. No screen holds more than half a phone of text (36 screens did before, none after). Ekalavya and the swayamvara show only the choices.
- **No effect lines on choice cards.** Bonds, duties, reputation, skills and odds are found in play, not shown before the choice. This replaces the ▲/▼ previews, the "Danger:" line (§16.4) and the "Breaks vow:" line (§18.12).
- **Icons instead,** small, in the ink of the card, each with its full words as its label: a bow (leads to a fight); a skull (can cost your life); bars (can cost your freedom); the vow's emblem (swears a vow, with its gift and price as the label); the vow's emblem struck through (breaks one of your vows, naming who will not forgive it); a split heart (ends a friendship); a broken arrow (breaks a divine weapon's condition). A plain choice has none.
- **Hidden locks.** At the teacher and the ashram, choices you cannot take are not shown (if none can be taken, they stay). Elsewhere a locked choice shows its short reason, and a way closed by two failed tests stays on the page, struck through.
- **The weapon grid.** The weapon choice (§18.11 D3) is a grid of weapon pictures you tap.
- **The dice hall in five screens:** the invitation; Shakuni's hands (spotting the cheat calls it out); the hall, with the stakes and Draupadi's question together and four choices, and no walking out partway; the robe; the road out. (§6's single long scene of Act IV stands for the full game.)

## 19. Success metrics

| Metric | Target **[OPEN — set with publisher]** |
|---|---|
| Steam wishlists before launch | — |
| Review score (Steam / Metacritic) | — |
| Completion rate of Act IV (dice game) | High; tests narrative engagement |
| Ending distribution | Wide spread = choices feel meaningful |
| Cultural reception | Endorsement from advisory board; no major organized protests |

---

## 20. Key risks

| Risk | Impact | Mitigation |
|---|---|---|
| Religious backlash | Very high | §12 hard rules, advisory board, community previews |
| Caste portrayal criticized | High | Show social hierarchy honestly; never gate abilities by birth |
| Scope too large | High | Vertical slice first; acts can ship as episodes if needed |
| Compared unfavorably to Black Myth: Wukong / The Age of Bhaarat | Medium | Differentiate on narrative RPG and life simulation, not pure action |
| Low Indian spending | Medium | Premium global launch; India pricing strategy |
| Funding | High | Publishers, Epic MegaGrants, Indian government AVGC programs, crowdfunding (backed by a demo) |
| Mobile port cost or quality | High | Port-readiness rules from day one (§15.3); budget the port as its own phase; test a mobile build of the vertical slice early |
| Action combat feels poor on touch | Medium | Assisted controls plus optional tactical mode; touch playtests during production |
| AI-generated art criticized or slips on period details | Medium | Disclose on Steam; review every image against §14's checklist; advisory review of canon figures |

---

## 21. Open questions

1. Combat feel: Souls-like, action RPG, or tactical?
2. Open world vs. hub-based acts?
3. Stylized vs. photoreal art?
4. Can the player romance canon (non-divine) characters, or only original characters?
5. Release acts episodically or as one complete game?
6. How much of the exile years is playable vs. montage?
7. Co-op or multiplayer: none, or a separate war mode later?
8. Minimum mobile device spec, and in-house port vs. porting partner?
9. Should the vertical slice include a rough mobile build to prove the port is feasible?
10. Does the browser edition ship as the game (for example on Steam in a desktop wrapper), or stay the prototype for an engine build?

---

## Appendix A — Glossary
- **Astra:** Divine weapon invoked with mantras.
- **Dharma:** Duty / right conduct; the game's moral core.
- **Guru-dakshina:** The fee or service a student owes a teacher.
- **Pratijna:** A solemn vow.
- **Sarathi:** Charioteer.
- **Suta:** Charioteer/bard community; Karna's adoptive family.
- **Tholu bommalata:** The leather shadow-puppet theatre of Andhra Pradesh; the look of the browser edition's characters.
- **Vyuha:** Military formation (e.g., Chakravyuha, the wheel formation).
- **Vanaprastha:** Retiring to the forest in later life.

## Appendix B — Sample player life (narrative test case)
A charioteer's daughter from Anga trains in secret under a forest hermit after Drona turns her away. She stands beside Karna at the tournament and becomes his friend for life. She swears never to retreat. During the exile she raises a son in Anga. Before the war, she learns the secret of Karna's birth and must decide whether to tell him; in canon, Kunti and Krishna reveal it, so her choice shapes only whether he hears it first from a friend. On day 13 her son is among the warriors around the Chakravyuha. On day 17 she drives a chariot near Karna's when his wheel sinks. Canon says Karna dies. Whether she keeps her vow and dies with him, or breaks it to get home to her son, is her story.

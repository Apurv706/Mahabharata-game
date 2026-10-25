# Product Requirements Document
## Mahabharata RPG — working title: *Kurukshetra: A Life*

| | |
|---|---|
| **Status** | Draft v0.2 (adds mobile port plan) |
| **Last updated** | October 25, 2026 |
| **Owner** | [Founder / Creative Director] |
| **Doc type** | Living PRD; sections marked **[OPEN]** still need decisions |

---

## 1. Summary

*Kurukshetra: A Life* is a narrative RPG in which the player creates an original character and lives one full lifetime inside the Mahabharata, from childhood in the age of the young princes to the aftermath of the 18-day war. The great events of the epic are fixed. The player's place in them, along with their loyalties, vows, relationships and death, is not.

**One-line pitch:** *You can't change the Mahabharata. You can decide who you were inside it.*

**Comparable titles:** Crusader Kings III (life simulation, generational legacy), The Witcher 3 (morally weighted choices in a rich mythic world), Black Myth: Wukong (a culturally specific epic made for a global audience), Ghost of Tsushima (respectful cultural authenticity).

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
| **Dwaraka (Yadava)** | Krishna's and Balarama's city | Yadavas fight on both sides of the war |
| **Anga** | Karna's kingdom, gifted to him by Duryodhana | Loyalty to Karna and Duryodhana |
| **Charioteer (suta) family** | Like Karna's adoptive family | Social contempt, closed doors, fierce pride |
| **Nishada forest village** | Forest people outside the city order | Ekalavya's story; whether teachers will accept you |
| **Gandhara** | Shakuni's distant homeland | Seen as a foreigner at court |

**Also chosen:** name, gender, appearance, a childhood temperament (Bold / Thoughtful / Devoted / Cunning) that tilts early dialogue options, and one **family heirloom** (a bow, a manuscript, an amulet, a debt) that becomes a story thread.

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
| **Balarama** | Dwaraka origin or a quest | Mace, wrestling | Neutrality in the war (Balarama himself stays out) |
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
- **Limit:** Up to 3 active vows at a time. **[OPEN]** Whether to allow vows to be released through penance.

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
- **Personal combat:** Third-person action combat suited to each path. Weapon types: bow, mace, sword, spear, discus. Exact feel **[OPEN]**: options are Souls-like, action-RPG or tactical pause.
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

---

## 14. Art, audio and language direction (initial)

- **Visual style:** Painterly realism inspired by Indian miniature traditions (Rajput, Pahari, Mughal court painting) for UI and epilogues; grounded, earthy realism in 3D. **[OPEN]** Stylized vs. photoreal.
- **Architecture:** Draw on early historic Indian architecture, not anachronistic later temple styles. Document choices in the Lore Bible.
- **Music:** Original score using Hindustani and Carnatic instruments (bansuri, veena, mridangam, shehnai) with an orchestral layer for battles.
- **Language:** Full English voice-over at launch; Hindi voice-over as a priority second language. Sanskrit for mantras and ritual; key terms (dharma, astra, vyuha) kept with an in-game glossary.

---

## 15. Scope: vertical slice and phases

### 15.1 Vertical slice (to raise funding / find a publisher)
**Content:** Act II (Training) through the archery tournament, plus war day 13 (Chakravyuha) as a battle showcase.
**Proves:** Character creation, one teacher, two paths (Archer, Charioteer), the duty system, one vow, combat and chariot combat, and the "witness and wound" pattern.
**Target length:** 60–90 minutes.

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
| Performance target | — | 30 fps on mid-range Android phones (around US$300); higher on recent iPhones. **[OPEN]** Minimum device spec. |

**Mobile monetization**
- **Model:** Free to download with Acts I–II (childhood and training) free; one purchase unlocks the full life. Possible regional pricing for India.
- **Not allowed:** Gacha, loot boxes, paid character pulls, energy timers, or paid randomness of any kind. These conflict with the design pillars and carry religious-sensitivity risk (for example, "pulling" a canon hero), and real-money payouts are illegal in India.
- **Optional:** Cosmetic-only purchases (heirloom designs, chariot banners) that don't touch canon figures.

**Port options [OPEN]:** Build the port in-house with a dedicated mobile team, or partner with a specialist porting studio.

---

## 16. Success metrics

| Metric | Target **[OPEN — set with publisher]** |
|---|---|
| Steam wishlists before launch | — |
| Review score (Steam / Metacritic) | — |
| Completion rate of Act IV (dice game) | High; tests narrative engagement |
| Ending distribution | Wide spread = choices feel meaningful |
| Cultural reception | Endorsement from advisory board; no major organized protests |

---

## 17. Key risks

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

---

## 18. Open questions

1. Combat feel: Souls-like, action RPG, or tactical?
2. Open world vs. hub-based acts?
3. Stylized vs. photoreal art?
4. Can the player romance canon (non-divine) characters, or only original characters?
5. Release acts episodically or as one complete game?
6. How much of the exile years is playable vs. montage?
7. Co-op or multiplayer: none, or a separate war mode later?
8. Minimum mobile device spec, and in-house port vs. porting partner?
9. Should the vertical slice include a rough mobile build to prove the port is feasible?

---

## Appendix A — Glossary
- **Astra:** Divine weapon invoked with mantras.
- **Dharma:** Duty / right conduct; the game's moral core.
- **Guru-dakshina:** The fee or service a student owes a teacher.
- **Pratijna:** A solemn vow.
- **Sarathi:** Charioteer.
- **Suta:** Charioteer/bard community; Karna's adoptive family.
- **Vyuha:** Military formation (e.g., Chakravyuha, the wheel formation).
- **Vanaprastha:** Retiring to the forest in later life.

## Appendix B — Sample player life (narrative test case)
A charioteer's daughter from Anga trains in secret under a forest hermit after Drona turns her away. She stands beside Karna at the tournament and becomes his friend for life. She swears never to retreat. During the exile she raises a son in Anga. Before the war, she learns the secret of Karna's birth and must decide whether to tell him; in canon, Kunti and Krishna reveal it, so her choice shapes only whether he hears it first from a friend. On day 13 her son is among the warriors around the Chakravyuha. On day 17 she drives a chariot near Karna's when his wheel sinks. Canon says Karna dies. Whether she keeps her vow and dies with him, or breaks it to get home to her son, is her story.

# Project Plan
## *Kurukshetra: A Life* — Mahabharata RPG

| | |
|---|---|
| **Status** | Draft v0.1 |
| **Last updated** | October 25, 2026 |
| **Companion doc** | Mahabharata_RPG_PRD.md (v0.2) |
| **Strategy** | PC first → consoles → mobile port |

---

## 1. Planning assumptions

These assumptions drive every date and number below. Change one and the plan moves.

- **Start date:** Pre-production begins **January 2027** (Month 1, "M1").
- **Team model:** Small core team based mainly in India, scaling up after funding. Art, audio, voice-over and porting are partly outsourced.
- **Engine:** Unreal Engine 5 with the port-readiness rules (PRD §15.3) from day one.
- **Funding:** Founders and grants fund Phase 0 and most of Phase 1. A publisher or investor funds Phase 2 onward, secured with the vertical slice.
- **Scope:** Hub-based acts, not open world (recommended answer to PRD open question 2). An open-world version would add roughly 30–50% to production time and cost.
- **Working rhythm:** Two-week sprints, monthly milestone reviews, and formal **gates** at the end of each phase.

---

## 2. Timeline at a glance

| Phase | Months | Calendar (indicative) | Gate at the end |
|---|---|---|---|
| **0. Pre-production** | M1–M6 | Jan – Jun 2027 | G0: Concept and Lore Bible approved |
| **1. Vertical slice** | M7–M15 | Jul 2027 – Mar 2028 | G1: Slice done, funding secured |
| **2. Production** | M16–M45 | Apr 2028 – Sep 2030 | G2: Alpha (M33), G3: Beta (M41), G4: Content complete (M45) |
| **3. PC launch** | M46–M48 | Oct – Dec 2030 | G5: Release candidate |
| **3b. Console launch** | M49–M54 | Jan – Jun 2031 | Platform certification |
| **4. Post-launch** | M49 onward | 2031 → | Patches, Hindi VO, legacy-mode DLC |
| **5. Mobile port** | M49–M63 | Jan 2031 – Mar 2032 | Store submission (iOS / Android) |

**Critical path:** Lore Bible → core systems prototype → vertical slice → funding → Act production → war days (Act VI, the biggest content block) → beta → launch. Funding at G1 is the single biggest schedule risk; nothing in Phase 2 can start at full scale without it.

---

## 3. Workstreams

Ten parallel workstreams run across the whole project. Each has one owner.

| # | Workstream | Owner (role) | Scope |
|---|---|---|---|
| W1 | Narrative and Lore | Narrative Director | Lore Bible, story, scripts, branching, canon anchors |
| W2 | Cultural Advisory | Cultural Lead + Advisory Board | Reviews, sensitivity rulings, community previews |
| W3 | Game Design and Systems | Lead Designer | Duty system, vows, boons/curses, aging, relationships, combat design |
| W4 | Engineering and Tech | Technical Director | Engine, tools, combat code, save system, port readiness |
| W5 | Art | Art Director | Visual identity, characters, environments, UI, miniature-style epilogues |
| W6 | Audio and VO | Audio Lead | Score, sound design, voice-over (English, then Hindi) |
| W7 | QA and Playtesting | QA Lead | Test plans, bug tracking, playtests, performance targets |
| W8 | Production | Producer | Schedule, budget, sprints, vendors, risk register |
| W9 | Business, Funding, Legal | Founder / Business Lead | Grants, publisher deals, contracts, trademark, compliance |
| W10 | Marketing and Community | Community Manager | Socials, Steam page, Discord, diaspora outreach, crisis plan |

---

## 4. Phase 0 — Pre-production (M1–M6)

**Goal:** Prove the concept on paper and in rough prototypes, and set up the guardrails before any expensive content is made.

### 4.1 Deliverables
| Deliverable | Workstream | Due |
|---|---|---|
| Studio setup: entity, bank account, contracts, IP assignment for all contributors | W9 | M1 |
| Advisory board recruited (2 scholars, 1 religious advisor, diverse regional and caste voices) | W2 | M2 |
| **Lore Bible v1:** canon anchors per act, version choices, sensitivity hard rules | W1, W2 | M4 |
| Answers to PRD open questions 1–3 (combat feel, world structure, art style) | W3, W5 | M3 |
| Paper prototype of the duty and vow systems (spreadsheet + playable text scenes) | W3 | M3 |
| Grey-box prototype: movement, one weapon, chariot driving, a choice scene | W4 | M5 |
| Mobile feasibility spike: grey-box build running on a mid-range Android phone | W4 | M6 |
| Visual target: 3–5 key art pieces and one in-engine "beauty corner" | W5 | M6 |
| Tech plan: engine version, source control, build pipeline, data-driven narrative tool (e.g. Ink, Yarn Spinner or articy:draft) | W4 | M2 |
| Epic MegaGrant application submitted | W9 | M3 |
| Trademark search on the working title | W9 | M2 |
| Slice plan and budget for Phase 1 | W8 | M6 |

### 4.2 Gate G0 — exit criteria
- Lore Bible v1 signed off by the advisory board.
- Duty and vow systems are fun on paper (5+ internal testers make distinct choices in the test scenes).
- Grey-box build runs on PC and on the target mid-range phone.
- Phase 1 is funded (founders, grants or angels).

---

## 5. Phase 1 — Vertical slice (M7–M15)

**Goal:** A 60–90 minute playable demo at near-final quality that convinces publishers and investors.

**Slice content (from PRD §15.1):** Character creation → Act II training under one teacher → the archery tournament (defining choice) → war day 13, the Chakravyuha. Paths: Archer and Charioteer.

### 5.1 Milestones
| Milestone | Month | Content |
|---|---|---|
| **M1-S: Systems first playable** | M8 | Character creation, duty system, one vow, save/load working in engine |
| **M2-S: Combat first playable** | M10 | Archery and chariot combat, one enemy set, basic AI |
| **M3-S: Training act playable** | M12 | Teacher, sparring, tournament scene with full branching |
| **M4-S: Chakravyuha playable** | M14 | Battle map, Abhimanyu sequence, "witness and wound" pattern |
| **M5-S: Polish and pitch** | M15 | Final art pass, music, English VO for key scenes, trailer, pitch deck |

### 5.2 Parallel tasks
- **W2:** Script and art review of every canon character in the slice. One closed community preview (20–40 Indian and diaspora players) at M14.
- **W4:** Rough mobile build of the slice (PRD open question 9) to prove the port path.
- **W9:** Publisher shortlist (10–15 names) by M10; pitch meetings M15–M16. Apply to Indian AVGC and state game-development programs.
- **W10:** Social channels and Discord live by M9; Steam "coming soon" page at M15 to start collecting wishlists.

### 5.3 Gate G1 — exit criteria
- Slice complete and stable, with no crash-level bugs.
- Advisory board sign-off on all slice content.
- Playtest: 70%+ of players say their tournament choice felt meaningful.
- **Funding for Phase 2 signed** (publisher, investor or a combination).

**If funding isn't secured by M16:** Fall back to an episodic plan. Ship Acts I–II as a smaller standalone release to generate revenue and audience, and fund later acts from it (PRD risk mitigation "acts can ship as episodes").

---

## 6. Phase 2 — Production (M16–M45)

**Goal:** Build all seven acts, all paths and all 18 war days.

### 6.1 Production order
Content is built in the order that reduces risk. The hardest and most reused systems come first, and the dice game and the war are started early because they are the biggest set pieces.

| Block | Months | Content | Why this order |
|---|---|---|---|
| P1 | M16–M21 | All systems feature-complete: all 7 paths, all teachers, aging, relationships, reputation, boons and curses, vyuha formations | Every act depends on these |
| P2 | M19–M26 | **Act IV (dice game)** and **Act VI war framework** (battle tech, day structure, days 1–10) | Biggest, riskiest set pieces |
| P3 | M22–M30 | Acts I, II (full), III | Early life and branching foundations |
| P4 | M27–M36 | Act V (exile paths, time skip, Matsya incognito year) and war days 11–18 + night raid | Depends on Act III–IV choices |
| P5 | M33–M41 | Act VII, all endings, epilogues, story mode | Needs all earlier flags in place |
| P6 | M38–M45 | Full VO recording, music final, localization text, polish, performance | Final content lock |

### 6.2 Milestone gates
| Gate | Month | Criteria |
|---|---|---|
| **G2: Alpha** | M33 | Whole game playable start to finish with placeholder content where needed; all systems in |
| **G3: Beta** | M41 | Content complete with final assets; advisory board full-script sign-off; external closed beta |
| **G4: Content lock** | M45 | Only bug fixes after this point; age-rating submissions (IARC, ESRB, PEGI) |

### 6.3 Ongoing in Phase 2
- **W2:** Script review per act as each is written; art review per canon character; two more community previews (Alpha, Beta).
- **W4:** Monthly performance check against the mobile low-spec tier, so the game never drifts out of port range.
- **W7:** Weekly builds with automated tests for branching (every flag combination at act boundaries).
- **W10:** Trailer beats at Alpha and Beta; demo for Steam Next Fest around M40–M42.
- **W9:** Legal review in India of marketing and key scenes before Beta.

---

## 7. Phase 3 — Launch (M46–M54)

| Step | Month | Notes |
|---|---|---|
| Release candidate and launch-day patch | M46–M47 | |
| Crisis plan rehearsed; spokesperson briefed | M46 | PRD §12.2 |
| **PC launch (Steam / Epic)** | M48 (Dec 2030) | **[OPEN]** Avoid big-release windows; confirm with publisher |
| Console certification (Sony, Microsoft) | M48–M52 | Allow 2–3 months for certification and fixes |
| **Console launch** | M52–M54 | |

---

## 8. Phase 4 — Post-launch (M49 onward)

- **First 90 days:** Bug-fix patches, balance updates, community feedback round-ups.
- **Hindi voice-over:** Recorded during production (P6) if budget allows; otherwise shipped as a free update within 6 months.
- **Legacy mode DLC:** Play as your child in Parikshit's era. Pre-production can start at M45 with a small team.
- **Other languages:** Tamil, Telugu, Bengali subtitles, plus major global languages, based on sales data.

---

## 9. Phase 5 — Mobile port (M49–M63)

| Step | Months | Notes |
|---|---|---|
| Port decision: in-house vs. porting studio | M42–M45 | Decide before launch so the team is ready |
| Touch controls, tactical mode, mobile UI pass | M49–M54 | Built on the input abstraction from Phase 0 |
| Asset downscale, streaming, episode splitting, download-on-demand | M49–M56 | |
| Cross-progression and cloud saves live | M54 | |
| Device testing (target: 30 fps on ~US$300 Android) | M54–M60 | 20+ device test matrix |
| Soft launch in 1–2 markets | M60 | Tests Acts I–II free → unlock model |
| **Global iOS / Android launch** | M62–M63 (early 2032) | Regional pricing for India |

---

## 10. Team plan

Head count by phase (full-time equivalents; outsourced work not counted).

| Role | Ph 0 | Ph 1 | Ph 2 | Ph 3–4 | Ph 5 |
|---|---|---|---|---|---|
| Creative Director / Founder | 1 | 1 | 1 | 1 | 0.5 |
| Producer | 0.5 | 1 | 2 | 1 | 1 |
| Narrative (director + writers) | 1 | 2 | 4 | 1 | 0.5 |
| Game designers | 1 | 2 | 5 | 2 | 1 |
| Engineers | 1 | 3 | 8 | 4 | 4 |
| Artists (2D, 3D, animation, tech art) | 1 | 4 | 12 | 2 | 2 |
| Audio | 0 | 0.5 | 2 | 1 | 0.5 |
| QA | 0 | 0.5 | 4 | 3 | 2 |
| Community / marketing | 0 | 0.5 | 1 | 2 | 1 |
| Cultural lead | 0.5 | 0.5 | 1 | 0.5 | 0.5 |
| **Total (approx.)** | **6** | **15** | **40** | **17** | **13** |

**Key first hires (in order):** Technical Director, Narrative Director, Lead Designer, Art Director, Producer.

---

## 11. Budget (rough, to be validated)

**Assumption:** India-based team, blended fully loaded cost of roughly US$3,000–4,500 per person-month, plus outsourcing. These are planning ranges, not quotes; validate with a producer and local salary data in Phase 0.

| Phase | Person-months (approx.) | Team cost | Other costs | Phase total |
|---|---|---|---|---|
| 0. Pre-production | ~35 | $105k–160k | Advisory fees, tools, legal: $30k–50k | **$135k–210k** |
| 1. Vertical slice | ~135 | $400k–610k | Outsourced art, VO, music, trailer: $100k–200k | **$500k–810k** |
| 2. Production | ~1,200 | $3.6M–5.4M | Outsourcing, full VO, score, mocap, localization: $0.8M–1.5M | **$4.4M–6.9M** |
| 3. Launch (PC + console) | ~50 | $150k–225k | Certification, ratings, launch marketing: $200k–500k | **$350k–725k** |
| 5. Mobile port | ~170 | $510k–765k | Device lab, porting partner (if used), store marketing: $100k–300k | **$610k–1.07M** |
| **Total through mobile launch** | | | | **≈ $6.0M–9.7M** |

Marketing spend beyond launch is usually covered by the publisher and is not included.

---

## 12. Funding plan

| Source | Target phase | Amount (indicative) | Action |
|---|---|---|---|
| Founders / friends and family | Phase 0 | $100k–200k | Secure before M1 |
| Epic MegaGrants | Phase 0–1 | Grants vary | Apply M3 with prototype |
| Indian government AVGC and state game programs | Phase 1–2 | Varies | Research and apply M6–M12 |
| Angel / seed investors | Phase 1 | $300k–600k | Pitch with Phase 0 prototype at M5–M7 |
| **Publisher deal** | Phase 2–3 | $4M–7M | Pitch with vertical slice at M15–M16 |
| Crowdfunding (optional) | Phase 1–2 | $100k–400k | Only with a strong demo; also builds community |
| Platform deals (console or mobile store support) | Phase 3–5 | Varies | Explore after Beta |

---

## 13. Decision schedule

Open questions from the PRD, with the gate by which each must be decided.

| # | Decision | Decide by | Owner |
|---|---|---|---|
| 1 | Combat feel (Souls-like, action RPG, tactical) | M3 | Lead Designer |
| 2 | Open world vs. hub-based acts (plan assumes hubs) | M3 | Creative Director |
| 3 | Stylized vs. photoreal art | M3 | Art Director |
| 4 | Romance with canon characters, or only originals | M4 (Lore Bible) | Narrative + Cultural Lead |
| 5 | Episodic vs. complete release | G1 (M15) | Founder + publisher |
| 6 | How much of the exile years is playable | M18 | Lead Designer |
| 7 | Co-op or multiplayer war mode | M24 | Creative Director |
| 8 | Minimum mobile spec; in-house vs. porting partner | M45 | Technical Director |
| 9 | Mobile build in the vertical slice (plan assumes yes, rough) | M7 | Technical Director |

---

## 14. First 90 days (January – March 2027)

**Weeks 1–4**
- Register the studio; sign IP-assignment agreements with all contributors.
- Hire or confirm the Technical Director and Narrative Director.
- Set up tools: source control, task tracker, Unreal project, narrative tool.
- Run a trademark search on the working title.
- Draft the advisory board invitation and list of 10 candidates.

**Weeks 5–8**
- Advisory board: first 2–3 members confirmed.
- Lore Bible outline: canon anchors for all seven acts.
- Paper prototype of the duty system: three test scenes (tournament, dice game, day 17).
- Decide combat feel, world structure and art direction (decisions 1–3).

**Weeks 9–13**
- Grey-box: movement, one weapon, chariot driving.
- Epic MegaGrant application submitted.
- First internal playtest of the paper prototype.
- Angel investor list and teaser deck drafted.

---

## 15. Governance and tracking

- **Sprint cadence:** Two-week sprints with a short demo at the end of each.
- **Monthly review:** Producer reports schedule, budget burn and top 5 risks.
- **Gate reviews:** Founder, leads and (for G0, G3) the advisory board. A gate can pass, pass with conditions, or fail and repeat.
- **Risk register:** Starts from PRD §17; reviewed monthly.
- **Documents of record:** PRD (what we're building), this plan (how and when), Lore Bible (what's canon), decision log (what we chose and why).

---

## 16. Top schedule risks

| Risk | Early warning sign | Response |
|---|---|---|
| Funding not secured at G1 | No term sheet by M14 | Switch to episodic release of Acts I–II |
| War days take longer than planned | Days 1–10 not done by M26 | Reuse battle templates; merge quieter days (e.g. 2–9) into montage |
| Advisory review slows scripts | Review backlog over 4 weeks | Add a second review track; review outlines before full scripts |
| Key hire missing | Lead role unfilled by M3 | Contract senior freelancer as interim |
| Mobile performance drifts | Low-spec build under 25 fps at a monthly check | Fix before adding new content |
| Branching explosion | QA can't test all flag combinations | Cap flags carried across acts; automated branch tests |

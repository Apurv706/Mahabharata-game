# Code review: 31 October 2026

*Kurukshetra: A Life*, version 53 (commit c18e074), about 21,000 lines excluding the Hindi table.

Four separate reviews covered the engine, the story content, the interface, and the mini-games with the tests and tools. Each critical finding was reproduced (in Playwright, jsdom or simulated lives), and each one was then checked again against the code.

- The content review also walked about 15,000 random lives.
- The existing suites still pass: rules 76/76, playthroughs with 0 crashes and 0 stuck lives, and screen fit in all three browsers.
- Most of the critical issues are on paths those suites do not exercise: keyboard timing, imported save codes, resuming a save, rare story branches, and the tools.

**Totals:** 18 critical issues and about 60 good-to-improve issues.

---

## Critical (fix before the next release)

### Saves and save codes

1. **A pasted save code can run code in the page, and it stays.**
   - **Where:** `puppet.js:40,148` puts the character's temperament into the page unescaped. `ledger.js:16` does the same with bond, duty and tapas numbers.
   - **Failure:** a crafted "Move this life to another device" code runs script as soon as it is loaded, again on every Continue, and, once that life ends, every time the Book of Lives opens (via `lives.js:22,73`), even after the save is deleted.
   - **Why it gets through:** `K.importCode` (`flow.js:396`) checks only the version number and the scene.
   - **Fix:**
     - Validate imported saves: merge onto `K.newLife()`, accept only known ids, and coerce numbers.
     - Keep only known temperament ids in the class name, and escape the meter values.
     - Add a `script-src 'self'` Content-Security-Policy. The game has no inline scripts, so it is compatible.
2. **A malformed save code overwrites the current life, then crashes every Continue.**
   - **Where:** `flow.js:396–405` and `modals.js:70`. The code replaces `K.S` and is autosaved before anything is rendered. A missing field (for example `injuries`) then crashes the ledger on every load.
   - **Also:** the error handler writes to a modal that is already closed, so it crashes too. Codes like `123` show a raw TypeError.
   - **Fix:** validate first, swap the life only on success, and show errors while the dialog is still open.
3. **Continue can skip the scene you saved on.**
   - **Where:** `flow.js:58`. `K.go` runs the scene's conditions again when resuming. Scenes that set a flag on entry then fail their own condition: `w_eve` (the raksha thread and blessings) and `w_brahmastra`.
   - **Effect:** in 160 random lives, `w_offering`, `w_dive`, `w_climb` and `w_mountain` were also skipped. A weapon quest offer is used up without being shown.
   - **Fix:** when resuming the saved scene, use it directly.
4. **Saving on a result page lets the same choice be made twice.**
   - **Where:** `K.choose` changes the life before `S.scene` moves on. "Save a copy", the export code and the story-mode switch save the live state (`modals.js:103,111,113`).
   - **Effect:** loading that save offers the choice again, so effects double, checks re-roll and fights are fought again.
   - **Fix:** save a snapshot taken at the last scene change.

### Input

5. **Number keys act on the hidden previous screen, and a held key repeats.**
   - **Where:** the keyboard handler `dom.js:528` ignores title cards, moments, `e.repeat` and modifier keys. `renderScene` hands over to the title card before clearing the old keys (`scene.js:65` vs `:110`).
   - **Failures (confirmed):**
     - Pressing 1 twice skips an event scene: its effects are applied but it is never shown.
     - A choice can be applied twice.
     - Holding 1 for two seconds made 4 choices across 4 scenes.
     - After dying, 1 on the ending card crashes (`battle.js:371`).
     - Two overlapping moments leave an overlay that cannot be closed.
     - In the dice-hall "hands" test, two keys within 1.1 s finish it twice (`games.js:140`).
   - **Fix:**
     - Clear the keys when title cards, moments and journeys start.
     - Ignore `e.repeat` and Ctrl, Alt and Meta.
     - Make go, choose and done run once only.
     - Queue moments instead of overlapping them.
6. **The timed lamp comes back after a result and chooses again.**
   - **Where:** `scene.js:118,309,356`. With "Reveal the story line by line" off, or with reduced motion on, redrawing a scene restarts its lamp. That happens after a fight, after a language switch, and after returning from practice.
   - **Failures (confirmed):** at day 13, after winning "Hold at the gate", the lamp burns out and starts the same fight again. At Draupadi's question, the silent choice is applied on top of yours.
   - **Fix:** stop the lamp in `showAfter`, and refuse a second choice in a scene already answered.

### Game rules

7. **Soma and Bala permanently lower an attribute near the cap.**
   - **Where:** `flow.js:82,164`. The boost is clamped at 8, but the payback is a fixed −3/+1 (Soma) or −1 (Bala). Might 7 ends at 6.
   - **Fix:** remember the change actually applied and reverse exactly that.

### Story

8. **"Before" scenes are lost when an event slot draws nothing** (about 30% of lives).
   - **Where:** `flow.js:41`. After a slot resolves to its fallback, `K.BEFORE` is not checked again.
   - **Lost scenes:** `v_word`, `w_soma`, `ep_mentor_vidura` (before the Rajasuya) and `w_offering`, `w_dive`, `w_climb` (before Matsya).
   - **Fix:** check BEFORE after resolving the slot.
9. **The hidden-year episodes play on every road.**
   - **Where:** `episodes.js:286,293`. `ep_false_name` and `ep_kichaka` check only that `a5_matsya` was seen. Players raiding Matsya with Duryodhana, in prison or at home are told they are in Virata's household.
   - **Also:** "Leave the household" never sets `left_virata`.
   - **Fix:** gate them on the Matsya road, and set the flag.
10. **Ugra fights for you and against you in the same battle.**
    - **Where:** `act6a.js:12` adds him to your allies, while `episodes.js:248,402` sends you to fight him on day 17. He appeared on both sides in 287 of 4,000 lives.
    - **Also:** calling for help can bring in a second copy of someone already fighting. That gives two Charus, or Bhima beside his own disguise.
    - **Fix:** choose one side for Ugra, and skip people already present.
11. **Vasu dies, and then is alive.** `act6b.js:151` and `act7.js:4–6` use different conditions. Fix: share one.
12. **The wheel test comes after Abhimanyu's death.** The closing text at `act6a.js:86,223,240` narrates his fall, and then `a6_wheel` asks you to open the wheel with him. Fix: play it before the day-13 text.
13. **Swearing vengeance on Ashwatthama can silently fail.**
    - **Where:** `act7.js:27` vs `core.js` `vowTake`. A vengeance vow released earlier blocks the new one, so the flag is set but there is no vow and no Hunt ending.
    - **Fix:** allow re-swearing a released vow.
14. **A raw `{who}` is shown to players.** `episodes.js:261–262`: the sibling's "argue" results are plain strings, not text-and-values pairs. Seen in 431 of 4,000 lives.
15. **One flag means two things.** The night-raid refusal sets `refused_raid` (`act6b.js:146`), the same flag as refusing to ride on Matsya. The ending then says you sat in Duryodhana's prison. Fix: use a separate flag and its own line.
16. **A dead Charu is still treated as alive.**
    - **Where:** `S.friend` and `S.spouse` are not cleared on death. `v_captive`, `v_ford`, the raksha thread (`astras.js:100`) and the fates lines (`act7.js:169`) let Charu act, "grow old beside you", and get counted twice.
    - **Fix:** clear the friend and spouse on death, or check `S.dead`.

### Tools that can corrupt the Hindi

17. **The string collector renumbers every id if `tests/strings.json` will not parse** (`tests/strings.js:127`). The Hindi part files then attach to the wrong English text: 3,795 of 3,802 strings in a sandbox run. Fix: stop with an error.
18. **The Hindi build silently skips a translation file that will not parse, and still succeeds** (`tools/build-i18n.js:16`, also `missing-i18n.js:13`). One typo dropped 80 strings with exit code 0. Fix: fail loudly, and exit non-zero on missing strings or token problems.

---

## Good to improve

### High impact (players notice)

**Phones**
- **Hold buttons let go by themselves** when a thumb drifts about 24 px inside the button (`.trial-press { touch-action: manipulation }`, `screens.css:355`). In the draw test this counts as a shot. Fix: `touch-action: none`.
- **Army battle order buttons overlap and run off the screen on every phone.**
  - Cause: `screens.css:1038` overrides `.army-btns .trial-press { min-width: 0 }`.
  - The screen-fit test checks only the placement phase, so it never saw the orders phase.
- **Race swipes never work on phones.** `.track` has no `touch-action: none`.
- **Six quest-stage tall paintings exist but are not listed in `U.TALL`** (`dom.js:69`), so phones crop the wide version instead.
- **Chaupar pieces are 17×24 px tap targets** on an iPhone SE.

**Fairness**
- **Steady and breath depend on the screen's refresh rate.** Damping runs per frame (`trials.js:419`, `breath.js:47`).
  - Steady: the same player wins 0% at 30 Hz and up to 80% at 120 Hz.
  - Breath: a perfect dive takes 3.9 s at 30 Hz but 14.5 s at 144 Hz.
  - Fix: `Math.pow(0.92, dt*60)`.
- **Rhythm can be won by mashing.** Stray strikes don't count against you (`play.js:114–144`).
- **Fuse: the guard's light that counts is not the light drawn** (`lachouse.js:205`). After one long frame the lamp can jam at a wall and stop sweeping (also the vessel in `breath.js:45`).
- **Race collision band doesn't match where the car is drawn** (`play.js:254` vs `screens.css:1179`). On an iPad, hits count with the obstacle 44 px clear.
- **Retort and notice shuffle with `sort(() => rng() - 0.5)`.** The right answer is the first button 44% of the time. Fix: Fisher–Yates.

**Settings and sound**
- **Settings don't stick when storage is blocked** (`flow.js:389`). This can happen in the claude.ai play page when third-party storage is off. Fix: keep prefs in memory too.
- **Music stops for the rest of the act after a tab switch or screen lock** (`audio.js:704`). Fix: suspend and resume only.
- **Autosave failures are silent** (`flow.js:70`). Warn once.

**Keyboard**
- **Chaupar: key 1 never throws** (`boards.js:152`), and focus is lost every redraw.
- **"Vanish instead" leaves Begin bound** (`trials.js:89–119`). A key press starts an invisible test, and Space and Enter then stay dead.

### Game rules and story (smaller)

**Combat and charges**
- **Holding fights:** bleed and burn ignore the champion's 10% floor (`combat.js:331`). Karna can die in `hold_karna`, which breaks canon. Rare.
- **Battle death uses up the raksha thread instead of the sanjivani root** (`flow.js:346` → `core.js:319`).
- **A death that was undone still leaves its markers.** `deathText` and `peril_death` stay set, which can produce a wrong "A life cut short" ending (`flow.js:304`).
- **Vayavyastra's "+2 rounds held" does nothing.** `B.bought` is never read.
- **Arjuna's Aimed shot can't be blocked or dodged.** It is missing from `DAMAGING` (`combat.js:349`), and the two "heavy" lists disagree.
- **Kripa's astra states Drona's condition** (`act5.js:126`).

**Story order and flow**
- **A loop-back after winning Drona's audition on the second visit** sends you to choose a path again, and your age drops a year.
- **Ages run backwards between some scenes**, and some scenes play out of order:
  - `w_mountain` 41 → `ep_storm` 36;
  - `ep_sibling_side` "the night before you leave" plays after `w_eve`, when you are already in camp.
- **Scenes that ignore your road:**
  - captivity in `hold_broken` has no wait;
  - `v_ford` and `v_captive` have no road or prison check;
  - a healer marked by Dushasana is forced into a deadly fight.
- **The raksha thread can be tied by a grandparent who has already died** (`astras.js:100`).

**Contradictions and canon**
- **Friends who beg you to break a vow then turn on you as its watchers** (`v_hold` with Bhima or Karna, `v_captive` with Arjuna or Charu).
- **The Vengeance ending says the vow was both kept and never answered** (`act7.js:110–112`).
- **Canon errors:**
  - "Karna's sons all died" (`act7.js:175`); Vrishaketu survives.
  - Telling Yudhishthira Karna's secret contradicts later lines saying he learns it only after the war.

**Needs a decision**
- **Krishna has a bond meter** (`act5.js:259`, `episodes.js:231`), which shows in the Bonds panel and previews and counts toward an ending. The PRD keeps divine figures out. Suggest keeping the journal line and dropping the bond.

**Dead promises**
- `took_brahmastra` promises "a darker telling" but nothing reads it.
- `bhima_debt` is never read.
- Tapas for forgiving the debt is attached to `a7_debt`, a scene that doesn't exist.

### Text and Hindi

**Grammar and voice**
- "the first test he **were** ever set" (`episodes.js:588`).
- `{end!}` lower-cases ending titles ("beside karna").
- Fourteen death lines say "You fell…" inside a telling written about "They".
- "friend" is printed as a name when a vow scene ends the friendship. Fall back to "your friend".

**Hindi**
- Four journey lines have no Hindi.
- The sibling's Hindi lines are always masculine, because `{g:}` follows the player's gender.
- Sentences built by joining English pieces only translate because each variant was added by hand.

**Art and wording**
- The siblings reuse the spouse portraits.
- The ally name "The huge brahmin (Bhima)" gives away the disguise.

### Interface quality
- **Double-clicking a choice with motion off** lands the second click on the new Continue (`scene.js:314`). Ignore clicks for about 300 ms after a screen change.
- **The lamp keeps burning** under "See the painting whole", moments and the ledger.
- **Layout thrash:** the leaf's `animationend` catches every ink animation, giving 61 events and 71 `fitBackdrop` calls for one short scene (`dom.js:343`). Check the event target and batch.
- **Small leaks:**
  - the fight's ground watcher is never disconnected (`battle.js:326`);
  - replaced videos aren't released (`dom.js:181`);
  - the hidden ledger is rebuilt on every battle redraw.
- **AudioContext is created before any user gesture** (`audio.js:643`).
- **Accessibility:**
  - modals don't restore or trap focus;
  - focus drops to the page body on every screen change;
  - `aria-live` on the whole page plus per-character spans makes screen readers noisy;
  - the target enemy is shown only by an outline;
  - smooth scrolling ignores reduced motion.
- **CSS:**
  - `--gold` and `--sans` are undefined;
  - dead selectors: `.journey`, `.journey-card`, `.bmap .m-lamp`.
- **Mini-game timing:**
  - rings, "close" mode: your own turn is always judged "opened after 0 seconds" (`play.js:439`);
  - the drill and hands sequences run on `setTimeout` and don't pause;
  - herd steps vary with refresh rate.

### Tests, CI and tools
- **CI runs only the screen-fit test.**
  - Add rules (about 1 s), a short playthrough and `tests/command.js`.
  - Add `permissions: contents: read`.
- **Warnings don't fail the playthrough.** "Book of Lives did not record", "rebirth did not apply" and map mismatches are printed but never fail the exit code.
- **The playthrough is fully synchronous**, so errors inside timers never surface.
- **No test plays a mini-game for real.** A browser bot that checks `done` is called exactly once and that no listeners are left would have caught critical 5 and the Vanish bug.
- **Close results get no automated coverage.** Headless tests return "close" only for aim, steady and escape, and `K.validate` doesn't check `close` links. `a1_rematch` (reached only through rhythm's close) is never tested.
- **The screen-fit test:**
  - doesn't check tap-target size;
  - "teacher points out the move" passes when no piece is reached;
  - fixed waits caused the recent run of WebKit timing failures.
- **Rules check 27 has a misleading name.** It says "assist off changes nothing" but never toggles assist.
- **`balance.js`** asserts nothing and swallows errors.
- **`tools/webp-art.py`** silently overwrites an existing WebP and source JPG, and drops colour profiles.
- **`fetch-runway-videos.yml` is dead.** Its links expired, and the signed URLs are still committed in `art_review/video/fetch_list.tsv`.
- **The `encode-video.sh` header** still mentions WebM.

### Maintainability
- **Duplicated defence code:** the "meet the blow" code is duplicated between `battle.js:202–293` and `practice.js:152–197, 688–765`, so the timing windows can drift apart.
- **Long functions with magic numbers:** `fitBackdrop`, `renderScene`, `renderBattle` and the menu template.
- **Global mutable state:** `practice.js` swaps out `U.clock` and `K.puppetSpec` globally, and `U.redraw`, `U.keys`, `U.settled` and `U.finalTop` are global.
- **Fragile BEFORE lists and a hidden dependency:**
  - `vows.js:118` assigns BEFORE lists instead of appending;
  - content calls `K.locOf` from `ui/map.js`, so a headless loader without `map.js` crashes.
- **Single save version:** the only versioning is `v: 2`. Add a save version that migration can step through.

---

## Checked and fine
- **Escaping:** the player's name and every other text field are escaped. The two injections above are the only ones found.
- **Storage:** all localStorage access is wrapped. A life plus the Book of Lives is 10–17 KB.
- **Old saves:** every field added since 25 October is migrated or guarded.
- **Story graph:** no duplicate ids, no broken links, no soft-locks; every scene is reachable and all 212 art keys have files.
- **Combat:** no fight can soft-lock; story mode never kills.
- **Randomness:** the seeded RNG is used throughout the engine.
- **Stability:** timers, loops and async callbacks are guarded; most listeners are cleaned up.
- **Mini-games:** aim, push, steady, sneak, escape, notice, draw and retort judge what they draw; the board games are legal and always end; the practice ground restores the life exactly.
- **Layout:** safe areas, dynamic viewport height and reduced motion are handled in CSS.
- **Content rules:** the dice-hall humiliation is witness text only; Krishna appears in no cast, portrait or painting.

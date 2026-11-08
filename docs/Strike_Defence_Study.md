# Strike and defence: a study of the real-time fights (8 Nov 2026)

**Feedback row 56** (owner, 7 Nov, 22:57): *"Let's do a study of mechanics of all strikes and defend movements we currently have. See what all needs improvements."* Then (22:59): *"Compare the movements against actual human pictures or from animations."*

**Scope (owner's answers):** the real-time fights (story fights, fighter mode, the dream), judged on **feel and readability**. Measured play and frame captures on a phone and a laptop, compared with how people really move and with animation practice. Section 4 is a ranked list to choose from. **Items 1–3, 8 and 9 were built on 8 Nov** (the owner's "Yes"); see *Built* at the end of section 4.

**How it was done:**
- **The code:** `game/js/engine/realtime.js` for the rules and `game/js/ui/realtime.js` and `ui/puppet-anim.js` for the drawing, on the `build-d` branch (Build D stage 1 and the shields off the ground).
- **1,500 simulated lives** (seed 11; 3,929 real-time fights), played by the person-like bot. It reacts 0.32–0.55 s after a wind-up starts, misses 35–60% of blows by Grace, raises its shield 0–0.24 s before a blow, rolls 0.2 s before one, and leaves 0.12–0.22 s between presses.
- **Frame captures** of 20 moves on an iPhone 15 and a 1366×768 laptop: every painted frame, timed against the fight's own events. Seventeen strips are in `docs/strike_defence_study/` on the `build-d` branch; strip names are given in square brackets below.
- **A timing probe:** how long after the rules land a blow the screen shows it land (the struck figure's flash), five times per move per screen.
- **References:** how people really strike and defend (gada and Indian club training, the mace duel in the Shalya Parva, sword-and-shield fencing, Kalaripayattu and Gatka, archery form) and game-animation practice (anticipation, active swing, follow-through, recovery, hit-stop, parry windows). Sources are listed at the end.

---

## The five things that matter most

1. **A foe's blow lands before you see it land.** He holds his wind-up still, and his swing only starts once the rules have already landed the blow. The weapon reaches you on screen **96–106 ms later**, on every weapon and on both screens. Your own blows are mostly drawn on time (5–20 ms). Anyone who reacts to the weapon coming down is always too late: the block, roll or parry was decided before the weapon moved.
2. **The wind-up tell washes the foe out.** On his first wind-up he brightens and goes sepia with an orange glow. For the last 0.45 s before a blade lands on you, he also gets a white outline whenever your weapon can parry. Together they turn him into a bright silhouette for most of the wind-up, which hides which blow is coming and from where. The "lit blade" parry cue lights his whole outline, not the blade.
3. **"Perfect" is just the normal late press.** For the person-like bot, **89–97%** of blocks and dodges come out perfect. A late reaction lands inside the 0.2 s (block) and 0.24 s (roll) windows, so "perfect" rewards waiting, not skill. A blocked blow, even a perfect block with nothing let through, also flashes the red "you were hit" edge.
4. **Most hits land while you're locked in your own swing.** By path: mace 77%, archer 70%, charioteer 61%, strategist 56%, spy 48%, healer 46%, bard 43%. The shield paths take more hits per fight than the roll paths (strategist 22.1, charioteer 17.5, mace 16.9 against spy 10.9, bard 9.8, archer 12.0). Foes' blows are eased per path to make up for it, which hides the gap.
5. **Several moves are the wrong shape:**
   - the sword cut pokes at the head while the shield drops away;
   - the mace smash stops level instead of driving down, and the sweep has no arc;
   - the archer draws to the chest and pushes forward on release;
   - the roll is a translucent squat;
   - the fallen topple stiff as planks, toward whoever struck them, and lie under that fighter's feet.

---

## 1. What we have

### 1.1 Your blows

| Weapon (paths) | Blows in the combo | Press → contact | Locked for | Weight (×a blow) | Drawn as |
|---|---|---|---|---|---|
| **Sword** (charioteer, strategist; the dream) | cut, cut, then a thrust that knocks back 0.4 of a body | 0.22, 0.22, 0.30 s | 0.34, 0.34, 0.62 s | 0.62, 0.62, 1.05 | Cut: arm raised straight overhead, then thrown forward at head height. Thrust: drawn back at the hip, then a lunge. |
| **Mace** (mace path) | smash (staggers 0.5 s), sweep (knocks back 0.6) | 0.40, 0.34 s | 0.72, 0.64 s | 1.3, 1.0 | Smash: raised, cocked behind the head with a lean back, then forward. Sweep: wound back level at the hip, then through. |
| **Dagger** (spy, healer, bard) | four stabs, then a heavy fifth that knocks back 0.4 | 0.15 ×4, 0.24 s | 0.24 ×4, 0.48 s (no shield, so only the roll and parry wait) | 0.48 ×4, 0.95 | Drawn back at the hip, punched forward. |
| **Bow** (archer) | two arrows a press (the second at 0.8); the third press is heavy and knocks back | loosed after 0.16, 0.16, 0.26 s | 0.36, 0.36, 0.6 s | 0.62 (+0.5), then 1.05 | The draw to the chest, then the loose. |

- The combo starts again after 0.55 s without a press. A press during a swing is kept for the next blow.
- Every blow turns you to the nearest foe and carries a step (0.45 of a body). A blow with no foe in reach swings at the air, with no "miss" shown.
- **Path skills:** aimed shot, ground-shaker (a ring of hits that knocks foes down), ride them down (a dash), command, salve, vanish, song.

### 1.2 Your defences

| Move | Who has it | What it does | Perfect |
|---|---|---|---|
| **Block** (held) | Shield paths | Stops a blow from the front, in your row or the next. Lets through 8% (35% of a heavy blow; ×1 to ×1.8 by the striker's tier). Drains 4.5 breath a second while held and 10 a blow (18 for a heavy one). You walk at 0.4 speed behind it. | Raised ≤ 0.2 s before the blow (0.17 s in the war on Normal): nothing gets through, and he staggers 1 s. |
| **Roll** | Dagger and bow paths (shield paths too, while the shield is broken) | 0.42 s, unhurtable, carries you 1.7 body widths, costs 32 breath. | Begun ≤ 0.24 s before the blow: the field slows for 1.2 s. |
| **Parry** (Strike at the right moment) | Every hand weapon | Pressed ≤ 0.22 s before a blade lands on you: neither blow lands, the moment slows, and he reels 1.0 s (1.4 s when you parry with a mace). A dagger or fist only half-stops a heavy blow. Arrows, all-round sweeps and feints can't be parried. His figure is outlined white for the last 0.45 s. | — |
| **The swing lock** (Build D) | Everyone | No Block, Roll or parry until your own swing ends. | — |
| **Shield wear** (Build D) | Shield paths | Cracks at half, breaks at none. You roll until you take up a new shield off the ground. | — |

### 1.3 Foes' attacks

- **Plain blow:** wound up 0.6 s (never under 0.3 s; shorter for strong foes, and ×0.86 in the war on Normal), with a rest of 2.0–3.4 s between blows (×0.72 in the war).
- **Heavy blow:** 0.95 s.
- **Mace:** smash 0.8 s and sweep 0.7 s, in turn.
- **Arrows:** the lane follows you for 0.8 s, locks for 0.35 s, then the arrow flies at 1.7 field widths a second.
- **Feints** (later acts, up to 22% of melee wind-ups in the war on Normal): the wind-up stops at 80% and comes again 0.3 s later.
- **Pacing:** at most two foes wind up at once, and their blows land at least 0.45 s apart (0.27 s in the war).
- **Reach:** a foe's blow carries a step and lands at his weapon's reach. A long weapon that is too close gives ground as it winds up.

### 1.4 Foes' defences

- **Shield catch:** a shield-bearer facing you, and not winding up, catches 18% of your blows (about 31% in the war on Normal). 15% gets through (45% of a heavy blow). He then needs about a second to lower the shield, lit gold, with no blow from him.
- **Champions parry:** 6% of your blows early on, rising to 14% in the war (half that against a heavy blow), never twice within 2.5 s. You're thrown off for 0.45 s.
- **Open after his swing:** mace 0.7 s, sword or spear 0.35 s, dagger 0.2 s.
- **Flinching from light blows:** a soldier always (0.18 s), a captain 60% of the time, a champion never.

### 1.5 What the screen shows

- **Before a blow:**
  - the pose;
  - the first-wind-up glow, then the white outline when the blow can be parried;
  - an orange ground mark under the blow's reach, filling to its rim as the blow lands. The "On you" tags exist in the code but the layout hides them.
  - Arrows show a dashed lane from the bow, white once locked.
- **At contact:** the drawn swing, a 50 ms hit-stop (80 ms for heavy blows), and a flash on whoever is struck (a white edge on foes, red on you). Then flakes or sparks, a clang or a thud, a shake for heavy blows and blows on you, and the damage number.
- **On defence:** "Blocked" with sparks. "Perfect block" (a toast, and the foe staggers). "Missed" and "Perfect roll" with a blue slow-motion tint. "Parried!" with sparks and slow motion.

---

## 2. What happens in play (1,500 lives, the person-like bot)

| Path | Fights | Won | Length | Foe attacks a fight (blows · arrows · heavy · feints) | Hits on you a fight | …while you swing | Blocks (perfect) | Rolls (perfect dodges) | Your parries | Champions parry you | Your blows on his shield |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Archer | 504 | 93.5% | 44 s | 11.4 · 6.7 · 1.5 · 1.6 | 12.0 | **70%** | — | 6.3 (95% of dodges) | 0 | 0 | 4.3 |
| Bard | 527 | 94.7% | 46 s | 11.6 · 5.3 · 1.6 · 1.5 | 9.8 | 43% | — | 7.7 (96%) | 0.07 | 0.9 | 4.2 |
| Charioteer | 475 | 93.1% | 50 s | 12.5 · 6.7 · 1.8 · 1.6 | 17.5 | **61%** | 4.9 (93% of blows blocked) | — | 0.72 | 0.4 | 3.0 |
| Healer | 403 | 100% | 61 s | 14.7 · 7.8 · 1.7 · 1.8 | 13.0 | 46% | — | 10.2 (97%) | 0.08 | 1.1 | 5.0 |
| Mace | 613 | 95.8% | 48 s | 10.3 (+0.9 smash, 0.8 sweep) · 6.6 · 1.4 · 1.6 | 16.9 | **77%** | 3.0 (89%) | — | 0.13 | 0.2 | 1.5 |
| Spy | 449 | 92.7% | 63 s | 14.4 · 7.8 · 2.1 · 2.0 | 10.9 | 48% | — | 10.7 (89%) | 0.04 | 1.2 | 5.5 |
| Strategist | 446 | 89.9% | 50 s | 14.1 · 7.4 · 1.8 · 1.9 | **22.1** | 56% | 6.5 (91%) | — | 0.49 | 0.6 | 3.2 |

- **Wind-ups:** median 0.57 s; 10% are under 0.48 s; arrows take 1.15–1.6 s. 9–11% of attacks land within 0.6 s of another's.
- **What hits you:** plain blows (52–63%), arrows (29–34%), heavy blows (5–8%), and on the mace path the mace's smash and sweep (5% each).
- **Parries are rare,** even on the sword paths (0.5–0.7 a fight). The dagger paths are parried by champions about once a fight but almost never parry themselves.
- **Shields broke twice** in over 1,500 shield-path fights. Story fights rarely bring a mace, so shield wear matters mostly against champions and Bhima.
- **Your blows almost always land** (0.97–0.99 a blow; the archer about two arrows a press). Spacing and aim hardly matter once you're in reach.
- **A caution:** the bot is a model. Its perfect rates show what a late reaction earns, not what every player will get.

---

## 3. Frame by frame, against real movement and animation practice

### 3.1 Foes' blows — the most important finding

**What we draw:**
- The wind-up pose is held still for the whole 0.6–0.8 s: sword overhead, spear drawn back at the hip, mace cocked behind the head.
- When the rules land the blow, the swing begins, and the weapon reaches you on screen about 0.1 s later. Measured: 96–106 ms for sword, spear, mace smash and mace sweep, on both screens. Your own blows land on screen 5–20 ms after the rules, because their swing is started early, before the blow lands.
- Seen in the strips:
  - [phone-foe-spear-unblocked]: the rules land the thrust at 619 ms; the spear is drawn going forward at 720–780 ms.
  - [phone-block]: the shield takes the blow at 641 ms; the sword comes down onto it at 780–900 ms.
  - [laptop-foe-sword-unblocked]: the same pattern.

**Real movement and practice:**
- A defender reads the *start* of a cut and meets the blade in its travel.
- Game practice: anticipation is the tell, then an active swing whose peak speed comes about 60–70% of the way through its arc, with contact on the frame the hit counts. The hit only counts during the swing, and the animation must match the rules exactly.

**Change:**
- Start a foe's drawn swing about 95 ms before the blow lands, as your own blows already do, so the weapon arrives on the frame the rules land it.
- In the last 0.12–0.15 s of a wind-up, add a small extra pull back (the coil) before the swing, as the moment to react to.

### 3.2 The wind-up tell

**What we draw:**
- On a foe's first wind-up: brightness up to 1.55 with sepia and an orange glow, pulsing twice.
- For the last 0.45 s before his blade lands on you (when your weapon can parry): a white outline on the whole figure.
- From about 0.2 s in, the foe is a pale silhouette, and the pose that says *which* blow is coming (overhead, thrust, sweep) is hard to read. [phone-block], [phone-roll], [phone-parry], [phone-foe-spear-unblocked], 200–600 ms.
- The orange ground mark is the clearest timer on screen.

**Practice:** the tell should be the pose and its silhouette (a heavy wind-up obvious, a light one brief). Effects should frame the figure, not cover it.

**Change:**
- Use a thin rim of light, not a fill, and keep the pose's colours.
- Put a glint on the weapon's tip as it reaches the top of the wind-up.
- Make the parry cue light the blade itself, as the comment in the code already intends.

### 3.3 Your sword

**What we draw** [phone-sword-combo]:
- **Cut:** the sword arm goes straight up overhead with a lean back (120–180 ms), and the shield arm drops to the hip, leaving the body open. Contact (240 ms) comes with the arm level at head height, more a poke than a cut, and it barely follows through. The feet stay planted.
- **Thrust (the third blow):** good. Drawn back at the hip, then a deep lunge with the arm straight.

**Real movement:**
- With a Viking-style round shield, the shield stays forward, rim leading, covering the body while the sword works.
- A head cut works better as a quick wrist-driven throw than a full-arm cut, and a passing step carries the attack in.
- Game practice: a swing carries 30–60° past the target before it slows; a downward one carries on toward the ground.

**Change:**
- Keep the shield in front through the cut.
- Wind up to the shoulder rather than straight overhead.
- Cut diagonally down through the neck or shoulder and carry on past the body.
- Add a small step in with each cut. Keep the thrust as it is.

### 3.4 Your mace

**What we draw** [phone-mace-combo]:
- **Smash:** raised in one hand, cocked behind the head with a strong lean back (160–320 ms), a readable heavy tell. But the blow ends with the arm straight out, level or a little upward, at the foe's chest and head (480–880 ms), and is held there. It reads as a push, not a smash.
- **Sweep:** never goes behind the body. The mace is already in front at the waist and pushes forward (960–1440 ms), so there's no arc to read in profile.
- **Blocking:** the mace is held straight up over the head like a torch, behind the raised shield [phone-block], [phone-foe-arrow-block].

**Real movement:**
- The gada is swung with both hands near the end of the handle. Its head travels behind the back and over the opposite shoulder (the gada 360).
- In the epic's mace duel (Shalya Parva 57) the two circle each other (mandalas), whirl their maces before striking, and strike suddenly at the head and the flank.
- Game practice for a heavy blow: an obvious wind-up, a 0.4–0.8 s swing, a downward strike that carries on toward the ground, and a 0.8–1.5 s recovery. Our lock is 0.72 s.

**Change:**
- **Smash:** end low, with the head near the ground in front, the knees bent and the weight forward. The recovery hauls it back up, which fits the existing 0.72 s lock.
- **Sweep:** wind back behind the back hip and arc round to the far side.
- Add a short trail along the moving part of each mace swing.
- When blocking, hold the mace low behind the shield.
- Optional: a two-handed look for the swing. The path keeps its shield in play.

### 3.5 Your dagger

**What we draw** [phone-dagger-combo]:
- The stabs are quick, straight punches at chest height. Readable, but all five look the same, so the heavy fifth has no shape of its own and no visible knock-back.
- At dagger reach the two figures overlap, and the stab disappears into the foe's shield.

**Change:**
- Give the fifth its own move: a step in and an upward or overhand drive, with a visible knock-back.
- Let the dagger fighter stand a little off-line so the stabs show.

### 3.6 Your bow

**What we draw** [laptop-bow-combo-close]:
- The bow arm is straight out toward the target (good: the "T" of real archery).
- The string is drawn only to the chest.
- On release the drawing hand moves forward, toward the bow, instead of back.

**Real movement:**
- Archers draw to a fixed anchor at the jaw or cheek; the epic's archers draw "to the ear".
- On release, the drawing hand springs back past the ear, and the bow arm stays up toward the target until the arrow lands.

**Change:**
- Draw to the jaw or ear.
- Follow through with the drawing hand back past the ear.
- Hold the bow arm up for a moment after the loose.

### 3.7 Block

**What we draw** [phone-block], [phone-perfect-block], [phone-foe-arrow-block]:
- The shield comes to chest height for every blow, including an overhead cut or smash.
- At contact the struck flash is the **red** "you were hit" edge, even on a perfect block that lets nothing through (780 ms) and on an arrow taken on the shield, beside "Blocked".

**Real movement:** the shield is pushed out to meet the blow away from the body, rim first. It's raised for blows at the head (the eyes go behind it) and lowered with a crouch for low ones. The weapon is kept back, ready to answer.

**Change:**
- Set the shield's height by the blow's arc: high for a cut or smash, middle for a thrust or sweep.
- Add a short punch toward the blow at contact.
- Show a gold or white clang edge when little or nothing gets through.

### 3.8 Roll

**What we draw** [phone-roll]: a deep crouch at half opacity, sliding sideways (450–650 ms). It reads as a squat, and at 50% opacity the player is hard to see.

**Real movement:**
- Sword-and-shield sources favour stepping aside, or back while blocking, over meeting a blow head on.
- Gatka's footwork (paintra) moves forward and back and side to side, in rhythm.
- A forward roll is a game convention, not a fighting move.

**Change:**
- Make it a quick backstep or sidestep, leaning away from the blow, with a motion streak. Duck only under a high cut.
- Keep the figure at about 75% opacity.

### 3.9 Parry

**What we draw** [phone-parry]: it reads well. The blades meet over the heads at 540–720 ms, with sparks, slow motion, "Parried!", and the foe reeling back. Two issues:
- Every parry meets the blade overhead, whatever the blow (a sweep at the ribs too).
- The cue is lost in the wind-up glow (3.2).

**Practice:**
- The animation guide puts a parry's active window at about 4–8 frames (0.13–0.27 s at 30 fps).
- Sekiro's deflect window is 12 frames (0.2 s) and shrinks if the button is mashed.
- Ours is 0.22 s (0.19 s in the war): in line with both, and right for phones.

**Change:**
- Meet the blade where it comes: high for cuts and smashes, middle for thrusts and sweeps.
- Light the foe's blade for the cue (3.2).

### 3.10 Feint

**What we draw** [phone-feint]: readable. The wind-up stops and drops into a guard at 480 ms, holds, and comes again at 1040 ms. But the "Feint!" pop is small and faint.

**Change:** a visible hitch in the weapon (a small drop and re-raise) and a clearer "Feint!".

### 3.11 A foe's shield catch, and a champion's parry

**What we draw:**
- **Shield catch** [phone-foe-shield-block]: the shield is brought round at 360 ms, with "Blocked", and then his whole figure glows gold for about 0.8 s (the opening). But a "1" damage number appears with "Blocked", which reads as a contradiction.
- **Champion's parry** [phone-foe-parry]: clear. Your blow is met, "Parried!", you recoil, he answers.

**Change:**
- Use a gold rim instead of a fill for the opening.
- When only a sliver gets through, show "Blocked" without a number, or with a small gold one.

### 3.12 Being hit

**What we draw:**
- A 50 ms hit-stop (80 ms for heavy blows), a kick through the joints, a flash, flakes, and a shake on heavy blows.
- In Sakurai's sense both fighters freeze, and 3–5 frames is inside the range practice recommends (1–4 frames for light blows, more for heavy).
- Great champions don't flinch at light blows, by design. On screen, though, it can read as "my blow did nothing".

**Change:** add a small spark or a shrug on the champion so you can see the light blow landed and he shrugged it off.

### 3.13 Falls

**What we draw** [phone-kill-fall]:
- The body topples stiff about its feet, legs straight, toward the middle of the field (440–660 ms).
- When the striker stands on the middle side, the body falls *onto* the striker and lies under their feet for the rest of the fight.

**Real movement** (common observation; no source fetched for it): a man struck down from the front folds at the knees first, then the trunk follows, falling back or slumping forward, away from the blow.

**Change:**
- Fall away from the striker. Fall toward the middle only when the stage's edge is near.
- Buckle the knees first.

### 3.14 Small things

- Name pills sit on the fighters' chests through the whole fight (for example "Ashwatthama" across his body in every strip), cluttering the action. Move them above the head, or show them only on arrival and when targeted.
- The ground skill [phone-skill-quake], ride-down and aimed shot read clearly, and none of them needs work.

---

## 4. What needs improving, ranked

Ranked by how much each helps feel and readability for what it costs. Each item is the owner's to choose. Items 1–3 change nothing in the rules; items 4–5 change difficulty and need the balance run.

| # | Change | Why (evidence) | Effort | Balance |
|---|---|---|---|---|
| 1 | **Foes' blows drawn on time:** start their swing early, so the weapon lands on the frame the blow counts; add a short coil at the end of the wind-up | 3.1: contact drawn 96–106 ms late on every weapon; reacting to the weapon is always too late | Small (drawing only) | None in the rules. Players will block better, so re-measure. |
| 2 | **A tell that doesn't wash out the figure:** a rim of light, a glint on the weapon tip, the parry cue on the blade | 3.2: a pale silhouette through most of every wind-up | Small–medium | None |
| 3 | **Honest defence feedback:** no red hit edge on blocked or perfect blocks; "Blocked" without a contradicting number | 3.7, 3.11 | Small | None |
| 4 | **Perfect that's earned:** perfect block 0.2 → about 0.12 s, perfect roll 0.24 → about 0.15 s, with plain block and roll as generous as now | 2: 89–97% of blocks and dodges already perfect | Small | Yes (rerun the 1,500 lives) |
| 5 | **Being locked mid-swing:** either warn on your own figure and the Strike button when a blow will land inside your swing, or let the first ~0.1 s of a swing be cancelled into Block or Roll (the commit point most action games use) | 2: 43–77% of hits land mid-swing; the shield paths are hit far more often | Small–medium | Yes; a change to row 48's lock, the owner's call |
| 6 | **The mace:** smash driven down through the target, sweep with an arc and a trail, mace held low behind the shield | 3.4 and the gada references | Medium (poses and the swing's aim) | None |
| 7 | **The sword cut:** shield stays up, diagonal cut through, a small step | 3.3 and the sword-and-shield references | Medium | None |
| 8 | **Falls:** away from the striker, knees first | 3.13 | Small–medium | None |
| 9 | **The bow:** draw to the jaw or ear, the hand springs back on release, the bow arm held up | 3.6 | Small (poses) | None |
| 10 | **Evasion:** a backstep or sidestep instead of a squat; 75% opacity | 3.8 | Medium | None |
| 11 | **Block and parry where the blow comes:** high for cuts and smashes, middle for thrusts and sweeps; a shield punch at contact | 3.7, 3.9 | Medium | None |
| 12 | **Small things:** the dagger's own fifth blow, a champion's visible shrug, name pills off the bodies, a clearer feint | 3.5, 3.10, 3.12, 3.14 | Small each | None |
| 13 | **A weak healer can't finish the supply carts** (the 4-minute cap): a floor on a blow's damage against the scaled health | the full check of 7 Nov (`tests/known_failures.json`) | Small | Yes |

**Suggested first build:** items 1–3 and 8–9. They change nothing in the rules, fix what a player sees in every fight, and are quick. Items 4–5 need a decision and the balance run, and items 6–7 and 10–11 are a session of posing each.

### Built (8 Nov, branch `build-d`): items 1–3, 8 and 9

| # | What changed | Measured after |
|---|---|---|
| 1 | A foe's swing (and a comrade's) starts 95 ms before the blow lands, with a short coil back in the 140 ms before; your heavy and mace blows are begun from the frame loop on the fight's own clock, not a timer | The timing probe: a foe's blow now shows on screen **4–30 ms** after it counts (was 96–106 ms) on sword, spear, mace smash and sweep, phone and laptop; yours 3–15 ms on sword, mace and dagger |
| 2 | The first wind-up is an ember rim round the figure, his own colours kept; the parry's cue is white light along the blade, middle to point, with a star at the point | Frame strips: the raised arm and weapon read through the whole wind-up; the light sits on the blade only |
| 3 | A blow on a raised shield: a pale steel rim, the shield arm jolted, a small muted number; no red edge, no shake unless heavy | Frame strips: a perfect block shows the steel rim 12 ms after the blow counts, with no number |
| 8 | Falls away from the striker (back over him only if more than 30% of the body would lie off the field), knees first, then over with the knees bent; arms flung past the head face down, at the sides on the back | Frame strips: the soldier struck from the left sinks on his knees and goes over to the right, his shield dropping on your side |
| 9 | The string drawn to the corner of the jaw, the drawing hand on the nock for a straight, raised or lowered shot; on the loose the hand flies back past the ear and the bow arm stays up | Pose captures of all six bow poses |

---

## Frame strips (branch `build-d`, `docs/strike_defence_study/`)

`phone-sword-combo`, `phone-mace-combo`, `phone-dagger-combo`, `laptop-bow-combo-close`, `phone-block`, `phone-perfect-block`, `phone-roll`, `phone-parry`, `phone-feint`, `phone-foe-spear-unblocked`, `laptop-foe-sword-unblocked`, `phone-foe-mace-smash`, `phone-foe-arrow-block`, `phone-foe-shield-block`, `phone-foe-parry`, `phone-kill-fall`, `phone-skill-quake`.

Each strip shows a frame every 50–110 ms, labelled with the time since the press. An orange border marks the frame where a press or a fight event falls, with the event named under it.

## Sources

- Gada, the 360 swing and its history: [The Art of Manliness, the steel mace workout](https://www.artofmanliness.com/health-fitness/fitness/train-like-an-ancient-hindu-warrior-the-steel-mace-workout/); [Set For Set, steel mace 360 and 10-to-2](https://www.setforset.com/blogs/news/steel-mace-360-10-to-2-muscles-worked)
- The mace duel: [Mahabharata, Shalya Parva, chapter 57](https://en.krishnakosh.org/krishna/Mahabharata_Shalya_Parva_Chapter_57:2)
- Sword and shield: [Tactics in Viking single combat with sword and shield](https://www.science-and-fiction.org/swordfighting/sword_and_shield.html); [Kerala Tourism, Vaalpayattu](https://www.keralatourism.org/kalaripayattu/angathari/vaalpayattu); [Shastar Vidya and Gatka](https://en.wikipedia.org/wiki/Shastar_Vidya)
- Archery form: [Bowhunter, the fundamentals of good shooting form](https://www.bowhunter.com/editorial/fundamentals-good-shooting-form/480687)
- Animation practice: [MoCap Online, sword melee animation guide](https://mocaponline.com/blogs/mocap-news/sword-melee-animation-guide); [Source Gaming, Sakurai on hitstop](https://sourcegaming.info/2015/11/11/thoughts-on-hitstop-sakurais-famitsu-column-vol-490-1/)
- Parry windows: [Sekiro wiki, Deflection](https://sekiroshadowsdietwice.wiki.fextralife.com/Deflection)

# Art brief: Krishna takes up the wheel (day 9) — 5 November

*Kurukshetra: A Life.* On the ninth day of the war, Bhishma's arrows are breaking the Pandava army, and Arjuna will not fight his grandsire with his full strength. Krishna swore at the start of the war that he would not take up a weapon. He leaps from Arjuna's chariot, takes up a chariot wheel and runs at Bhishma. Bhishma lowers his bow and welcomes death at Krishna's hands. Arjuna runs after him, catches his feet and reminds him of his vow, and Krishna sets the wheel down. Arjuna promises to fight in earnest.

Today the scene is played by the game's leather puppets over the field painting (`fight_war_field`, about 8 seconds). The owner wants it stronger. This brief asks for **one living painting (a short clip) and one still painting**. The game shows the clip full screen as the scene's moment, then holds on the still painting behind the text.

## Sensitivity (read first)

- Until now the game has shown **no painted god** (its scenes are staged with puppets in code). This is the first painted image of Krishna, so it goes to the advisory review (PRD §17 item 6) before it is used.
- Krishna is shown with dignity and calm, never comic or monstrous: dark blue-black skin, yellow silk (pitambara), a peacock feather in his hair, simple gold ornaments. Not multi-armed, no cosmic form (that is the Gita, not this day).
- **He never strikes Bhishma.** The clip ends before any blow; the wheel is lifted, not swung into anyone.
- Bhishma: very old, a long white beard, white clothes and white banner, a great bow. In this moment he is joyful, not afraid: he lowers the bow and opens his arms.
- Arjuna: the Gandiva bow and twin quivers, gold-tipped; a monkey (Hanuman) on his chariot's banner, drawn as a banner emblem only.
- Style, palette and period follow the earlier briefs: early historic India, warm and painterly, the game's other war paintings (`war_bhishma`, `war_day17`, `fight_war_field`). No Japanese torii, no Tibetan prayer flags.

## Needed

| File | Format | What it shows |
|---|---|---|
| `video/war_wheel.mp4` | 1280×720, 24 fps, about 10 s, H.264, no sound, under about 1.5 MB (as the other 25 clips) | The moment itself, as one continuous shot (beats below). |
| `art/war_wheel_wide.webp` | 2560×1440 | The still the scene rests on after the clip: Krishna on the field, the wheel raised, light behind it; Bhishma ahead with his bow lowered; Arjuna running in from the side. |
| `art/war_wheel.webp` | 1800×600 strip, as `war_bhishma.webp` | The same still, cropped for the story page. |

**Phones:** the game crops the 16:9 clip to fill an upright phone, so keep the action (Krishna, the wheel, Bhishma's face) inside the **middle 45% of the width**. Nothing important at the far left or right edges.

### The clip, beat by beat (about 10 s)

1. **0–2 s.** Low over the dust of the field, late afternoon light. A rain of arrows from the right, where Bhishma's white banner stands. Arjuna's chariot on the left, the horses rearing.
2. **2–4 s.** Krishna lets go of the reins and leaps down from the chariot. The yellow cloth trails slowly behind him.
3. **4–6 s.** Beside a broken chariot, he lifts one of its wheels over his head. The sun catches it, and it glows gold with turning rays, like the Sudarshana chakra. A low wind lifts the dust.
4. **6–8 s.** He strides toward Bhishma, wheel raised. The arrows stop. Bhishma lowers his bow and opens his arms, smiling.
5. **8–10 s.** Arjuna runs in and kneels at Krishna's feet, holding them. Krishna stops; the wheel's glow fades. Hold on the three figures, still, for the last second (the game fades out from here).

### A prompt for a video tool (to adapt)

> Cinematic painted scene in the style of an Indian miniature brought to life, warm late-afternoon light, dust in the air, ancient Indian battlefield of Kurukshetra. Krishna, with dark blue skin, yellow silk garments, a peacock feather in his hair and gold ornaments, leaps down from a war chariot. He lifts a large wooden chariot wheel above his head. The wheel catches the sun and glows gold, with rays of light turning around it. He strides calmly toward Bhishma, a very old warrior with a long white beard and white clothes, who lowers his great bow and opens his arms, smiling. Arjuna, a young archer with a golden bow, runs in and kneels, holding Krishna's feet. Slow, weighty motion, the camera low and steady, no cuts, painterly texture, no text.

Negative: no extra arms, no cosmic form, no gore, no blow struck, no modern objects, no text or logos.

## Not for the artist

- Wiring: `bh_wheel` (`war_bhishma.js`) plays the clip as its moment when living paintings are on; the puppet staging stays as the fallback (Calm motion, data saver, no video). The Kaurava side (`bh_guard9`, in Bhishma's guard) uses the same clip.
- Part Two's file list gains three files (still under its 512 limit).
- The iPhone playback bug (feedback item 11) must be fixed first, or the clip will not show on iPhones either.

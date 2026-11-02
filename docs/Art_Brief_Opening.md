# Art brief: the opening sequence (2 November)

*Kurukshetra: A Life.* A new life now opens with a short sequence before the dream of the war:

1. The player's homeland, full screen.
2. The child walks home.
3. The family eats supper together.
4. The child goes to bed and the lamp goes out.
5. A dream bubble opens onto the battlefield.

It runs today on existing paintings and simple drawn shapes (a plain wall, a drawn doorway). These paintings would make it as strong as the rest of the game.

The figures are the game's puppets, built from the player's own choices (homeland, gender), so **the paintings show no people**. Leave the floor and the bed empty where the figures will be. Style, palette and period follow the earlier briefs: early historic India, warm and painterly, no Japanese torii, no Tibetan prayer flags.

## Needed

| File | Sizes | What it shows | Where the figures go |
|---|---|---|---|
| `scene_home_supper` | 2560×1440 and `_tall` 1080×1920 | Inside a modest house at dusk. Mud-plastered walls, wooden roof beams, a clay hearth with a pot on it, two or three oil lamps in wall niches, warm light. A woven mat on the floor in front, with four leaf plates on it. | Four seated figures in a row on the mat, in the lower third, from about 25% to 75% of the width. Keep that band clear of objects taller than the plates. |
| `scene_home_night` | 2560×1440 and `_tall` 1080×1920 | The same room, later, at night. Deep blue shadow, one clay lamp burning low beside a rope bed (charpai) with a pillow at the left end, and a little moonlight from a small window. | One figure lies on the bed. The bed is empty, centred, its top at about 70% of the height, about half the width in 16:9 and four fifths of the width in the tall version. |

## Wanted, if there is time

| File | Sizes | What it shows |
|---|---|---|
| `home_door_<homeland>` (8) | 2560×1440 and `_tall` 1080×1920 | Each homeland's own house at dusk, seen from outside, with its doorway lit from within at lower right and a path coming to it from the left. This replaces the drawn doorway the child walks into. Homelands: `hastinapura`, `panchala`, `matsya`, `mathura`, `anga`, `suta`, `nishada`, `gandhara`. Their houses should differ: a court official's house in Hastinapura, a stone house in Gandhara, a forest hut for the Nishada, the charioteers' lane in Champa. |
| `scene_home_supper_<homeland>` and `scene_home_night_<homeland>` | as above | Regional versions of the two rooms, in place of the single shared pair. |

## Not for the artist

- The puppets, the leaf plates, the lamp flame, the dream bubble and the captions are drawn by the game.
- The dream itself uses `war_day14`, which is already delivered.

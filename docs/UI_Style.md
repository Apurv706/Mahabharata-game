# UI style — Kurukshetra: A Life

The game's interface follows the design-taste-frontend (tasteskill v2) rules for app screens, adapted to a story game. Check new UI against this page, and run the skill's lint on `game/css`, `game/index.html` and `game/js/ui` before committing (it should report 0 FAIL, 0 WARN).

## Direction

The screen is an old manuscript on aged parchment, written in red ink that has dried to reddish brown. The paintings carry the colour; the page frames them the way a manuscript frames its pictures.

| Token | Value | Use |
|---|---|---|
| `--ground` | #e8d5ad parchment | The page: a painted manuscript folio (`css/bg_page_desktop.jpg`, `css/bg_page_mobile.jpg`) over a painted paper tile (`css/bg_parchment_tile.jpg`) |
| `--surface` | #f1e3c3 | The scene and the side panel, a little lighter |
| `--raised` / `--hover` | #e6d1a6 / #dcc394 | Choices, cards, controls; one tone step down on hover |
| `--ink` / `--muted` / `--faint` | #4a170d / #69301e / #733f29 | Dried red ink in three tiers, all above 4.5:1 on every panel |
| `--fresh-ink` | #e0251a | Wet ink: letters the quill has just written sparkle in this red, then dry to `--ink` |
| `--accent` | #9a2c16 sindoor red | Only what you can do: the main button, the selection, focus |
| `--data` | #74470a ochre | The duty meters and canon markers |
| `--positive` / `--negative` | #215737 / #932713 | Rises and falls in choices, health bars, curses |

Ornaments, painted in red and ochre ink:
- A vine border (`css/border_strip.png`) where a painting meets its text, and along the top of the side panel, the act strip and dialogs.
- Lotus corners (`css/border_corner.png`) at the foot of the page and side panel.
- A lotus divider (`css/divider.png`) above the canon panel and "What became of them".
- A double rule framing the canon panel ("What happens, whatever you do").
- The title is the logo (`brand/logo_en.svg` or `brand/logo_hi.svg`, by language) over the key art.
- Round gold-ringed portraits, free-standing emblems, small painted teacher cards on their choices.

## Rules

- Every string the player sees goes through `K.tr` (interface) or `K.text` / `U.t` (story). Write whole sentences, never glue fragments together, so each one translates as a unit.

- Separate surfaces with a tone step and the gold ornaments, never a plain grey outline or a shadow. Only the dialog casts a shadow.
- No decorative gradients. The one exception is the scrim under a caption on a painting, in the ground or surface colour.
- A scene with no painting yet shows a flat field in its own colour with its caption set large, never a gradient.
- Labels are sentence case at 14px or more. No tiny uppercase labels, no pill badges above headings.
- Whether a scene is canon, your life or the war is said in words in the picture's caption.
- Key numbers on choices are quiet and hidden on touch screens.
- Every motion uses transform, opacity or clip-path, and has a reduced-motion fallback.
- Story screens reveal in order (`U.stage`): painting, title, each line, then the choices. Never show choices before the scene is set. A tap, Space, Enter or a number key shows everything; the menu can turn it off.

## Not yet checked

The skill's real-browser inspector could not run in the build environment (no Chrome). Run `node <skill>/scripts/inspect.mjs game/index.html --app` on a machine with Chrome and fix anything it reports.

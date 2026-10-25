# Kurukshetra: A Life

A narrative RPG in which you create an original character and live one whole life inside the Mahabharata, from childhood to the 18-day war. The great events of the epic are fixed. Your place in them is not.

> You can't change the Mahabharata. You can decide who you were inside it.

## Play the prototype

Open `game/index.html` in a browser. No build step and no install.

The prototype covers character creation, the choice of teacher, the archery tournament, a vow, the years leading to war, and war day 13 (the Chakravyuha), followed by an ending built from what you did.

## What the prototype proves

| System | PRD section | In the prototype |
|---|---|---|
| Canon lock ("witness and wound") | §4 | Canon anchors always play; choices change only your own story |
| Duty system (no good/evil bar) | §9.1 | Teacher's debt, court loyalty, family duty and conscience pull against each other |
| Vows | §9.2 | Up to 3; choices tagged "retreat" or "lie" break the matching vow automatically |
| Boons and curses | §9.3 | The hermit's hidden curse fires at the worst hour on day 13 |
| Relationships and memories | §9.5 | Karna, Arjuna and your son Vasu remember specific moments |
| Death as an ending | §10 | Dying on day 13 gives a full ending, not a game over |
| Input abstraction | §9.7 | Clicks and number keys go through one command layer, ready for touch |
| Save as data | §15.3 | The whole life is plain JSON, so a PC save can continue on a phone |

## How the code is organised

`game/index.html` has three parts:

- **Engine:** conditions, effects, vows, curses and memories. Engine-agnostic, meant to map onto an Unreal subsystem later.
- **Content:** origins and scenes as plain data. Choice previews (▲/▼) are generated from the same data the engine applies, so they cannot drift.
- **Render and input:** the screens, plus the command layer.

## Repository layout

```
docs/      PRD, project plan and art brief
game/      the playable prototype
game/art/  concept art (origins, scenes, epilogues)
```

## Status

Pre-production prototype. All story text is a working draft after the public-domain K.M. Ganguli translation and must pass advisory board review (PRD §12) before public use. The concept art is placeholder and has open notes in `docs/Art_Brief.md`.

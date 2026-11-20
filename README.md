# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/wildhanry/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/wildhanry/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Platinum in Leonida** — an offline trophy guide and tracker for Grand Theft Auto VI on PlayStation 5. Every one of the 55 official trophies gets its own guide card written for this entry: what the official description actually asks for, a practical way to earn it broken into steps, a tip from the trenches, and the sources each card rests on. A six-stop roadmap orders the run at the platinum so story progress, contact strands, activities, collectible sweeps, partner crime and the long counts each happen at the cheapest moment, and a watch list flags the trophies that still need care before you walk past their moment: the one trigger both post-launch guides still list as unknown, and the one possibly missable meditation. Most triggers that were unconfirmed before launch have since been confirmed in public — the revised edition of 20 November 2026 names its post-launch sources (PowerPyx and GTABase) on every card it changed, and says plainly where a method rests on a single source.

What is inside:

- 55 guide cards with the official name, description and grade exactly as published, plus original guidance, steps, a tip and a named source line on every card.
- A platinum roadmap in six stops, each stop naming the trophies it clears.
- Filters that combine: full-text search, grade, category, type (story, skill, long haul), watch-list only, and hide-earned.
- A spoiler shield that is on when the page first opens: story-sensitive trophies show neither name nor description until you reveal them or tick them off.
- Progress kept in the browser with localStorage, exportable to a file and importable again; the export format is the same array-of-names format the starter checklist used.
- Straight about its limits: every number in the guide comes from the official trophy list data. Triggers confirmed after launch are credited to the post-launch guide that reported them, on the card itself; where a trigger is still not confirmed in public — one card, as of the 20 November 2026 revision — the card says that plainly and gives a save-first way to test it safely rather than a confident guess.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 in a desktop browser
```

To build the hand-in dossier (this copies `app/` and `screenshots/` into the output folder and writes `dossier.json` there):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

There is no build step and nothing to install: Node.js 22.18 or newer runs the TypeScript entry points as they are, and the guide itself is plain HTML, CSS and JavaScript that loads nothing from the network.

## Layout

- `app/` — the guide: `index.html`, `app.js`, `style.css`, and the trophy data with all guide text in `app/data/trophies.json`.
- `main.ts` — the entry point the grader runs; it hands in `app/` and `screenshots/` and writes the dossier through the vendored library.
- `vendor/makefun-frontend.ts` — the make.fun library, kept byte-for-byte as the kit shipped it, because the scorer rebuilds the dossier with its own copy and compares.
- `serve.ts` — a small local static server for trying the guide.
- `screenshots/` and `shots.json` — captures of the guide actually running, and a note of which view each capture shows.

## License

MIT — see `LICENSE`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=29b3jrvf&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>

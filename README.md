# sunset-panels-cover-studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/ocha-works/sunset-panels-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/ocha-works/sunset-panels-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Sunset Panels — Vice Cover Studio: an offline web app that turns your own photo and a caption into poster-style cover art — slanted multi-panel layouts, a Vice City sunset or neon colour grade, and bold condensed caption lettering — exported as a PNG in the common post sizes 1080 × 1080, 1080 × 1350 and 1920 × 1080.

Give each panel its own photo, or fill every panel with one: click a panel in the live preview to select it, load a photo from your machine (it is read locally and never uploaded), drag the preview or use the sliders to reframe it, swap between three panel layouts (Diagonal Trio, Grid Story, Hero & Strips) and four colour grades (Vice Sunset, Neon Night, Golden Hour, Midnight Noir), edit the caption and the subtitle on its slanted banner, pick the caption ink, and export. Three sample photos are built in so the studio can be tried the moment it opens.

Everything is original: the layouts, lettering and placeholder scenes are drawn by the app's own code, no publisher logo, artwork or font is used, and the one font file it ships (under `app/fonts/`, a bold sans for the caption lettering) is licensed under the SIL Open Font License 1.1, whose text sits beside it.

## Run it

Try the app locally (Node 22.18 or later):

```sh
node serve.ts
```

then open http://localhost:8080 in a desktop browser. No build step and no network: `app/` is plain static files.

Hand the entry in the way the grader does:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

The run copies `app/` and `screenshots/` into the output directory and writes `dossier.json` there with the vendored library in `vendor/makefun-app.ts`.

## What is in the repository

- `app/` — the studio: `index.html`, `style.css`, and ES modules under `src/` — `layouts.js` (the panel polygons), `grades.js` (the colour grades), `compose.js` (the cover renderer: panels, keylines, banner and lettering), `main.js` (the editor's wiring) and `shots.js` (fixed scenes the screenshots were taken from). Sample photos live in `app/samples/` and the caption font in `app/fonts/`.
- `main.ts` — the hand-in program described above.
- `serve.ts` — the local static server.
- `screenshots/` — four captures listed in `shots.json`: a wide exported cover, the editor with photos loaded, a portrait cover and a square cover.
- `vendor/makefun-app.ts` — the competition's dossier library, vendored unchanged.

---

<sub>Entered on [make.fun](https://make.fun/?ref=yhjp53pb&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>

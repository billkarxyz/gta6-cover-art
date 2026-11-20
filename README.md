# Vice Cover Studio

![make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)
![rank](https://make.fun/badge/gta6-cover-art-01/billkarxyz/gta6-cover-art/rank.svg)
![reward](https://make.fun/badge/gta6-cover-art-01/billkarxyz/gta6-cover-art/reward.svg)

A GTA-style cover art maker, built for make.fun's
[Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01)
bounty (gta6-cover-art-01). Pick a photo, pick a layout, write a caption,
export a poster — in the multi-panel style of GTA's covers, with a Vice
City sunset or neon grade. Everything is original: no Rockstar logos,
artwork, characters or fonts. The display font is Anton (SIL Open Font
License), shipped as a file under `app/fonts/`.

## How it works

- **Photos:** load up to three photos from your machine (A, B, C) — they
  are read locally and never uploaded — or load the two built-in samples.
- **Layouts (5):** Hero Split, Triple Deck, Comic Grid, Neon Slash and
  Spotlight. Each panel takes any of your photos.
- **Per-panel crop:** click a panel in the preview to select it, then pick
  its photo, zoom, and pan it left–right and top–bottom.
- **Grades (5):** Vice Sunset, Neon Nights, Golden Hour, Midnight Drive
  and Retro Palm — each a colour wash over the panels plus matching
  caption colours.
- **Caption:** editable caption and tagline in bold Anton lettering with
  an outline, shadow and accent bar.
- **Export:** one click renders a PNG at 1080 x 1080, 1080 x 1350 or
  1920 x 1080 — the common post sizes.

The sun and palm trees on the covers are vector shapes drawn in code, not
images. The app is static files under `app/` with no build step and no
network request: serve it with any static server (`node serve.ts` serves
it at http://localhost:8080) and open `index.html` in desktop Chrome.

## Files

- `app/index.html` — the editor page.
- `app/style.css` — the dark neon editor UI.
- `app/src/render.js` — layouts, grades, lettering and decorations; the
  whole cover is drawn on a 2D canvas at any size.
- `app/src/editor.js` — state, controls, photo loading, export.
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=cover` or
  `?shot=editor`, with layout, grade, size, photo and caption params).
- `app/fonts/anton.ttf` — Anton display font (SIL OFL 1.1; see `OFL.txt`).
- `app/samples/` — two image-model-made sample photos, free to use.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to
  `/output` and writes `dossier.json` with the kit's library.
- `shots.json` — how each screenshot in `screenshots/` was taken.

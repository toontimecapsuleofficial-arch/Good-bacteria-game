# Bio Defense: Good Bacteria

A complete, browser-playable tower-defense game built with plain HTML, CSS, and JavaScript. It includes the original campaign, Endless and Daily runs, tutorial, Practice mode, collection and research, upgrades, merging/evolution, bosses, achievements, audio, and saved progress.

## Run locally

Serve the repository root over HTTP (rather than opening `index.html` as a `file://` URL):

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. The game has no build step or package dependencies. If the optional CrazyGames SDK is unavailable, gameplay continues without portal or ad integration.

## Deploy to Vercel

This is a static site: it has no build step, package install, server-side runtime, or environment variables. Vercel can serve it directly from the repository root.

1. Import this Git repository in Vercel and keep the **Root Directory** as `.`.
2. Select **Other** as the framework (or leave framework detection unset).
3. Leave the **Install Command** and **Build Command** empty. If Vercel asks for an **Output Directory**, use `.` so it publishes the root `index.html`, `game.js`, `style.css`, and `assets/` directory together.
4. Deploy. The game is served at `/`; no SPA rewrite or API configuration is needed.

Alternatively, run `npx vercel` from the repository root and follow the prompts, then use `npx vercel --prod` for a production deployment. The generated `.vercel/` project metadata is ignored by Git.

## Controls

- **Mouse/touch:** drag bacteria from the Lab to the grid; drop matching bacteria together to merge.
- **Keyboard:** arrows move the selection; Enter places; 1–3 select shop offers; X rerolls; B battles or uses the bomb; Z zaps; H heals; R rallies; P/Esc pauses; F toggles fullscreen.
- Battles are designed for landscape orientation.

## Root files

The repository root deliberately contains exactly five regular files:

| File | Purpose |
|---|---|
| `index.html` | Game screens, controls, canvas, and page metadata |
| `style.css` | Responsive UI and visual styling |
| `game.js` | Complete game logic, roster, rendering, input, save system, and local-asset loaders |
| `README.md` | Project and run instructions |
| `.gitignore` | Repository ignore rules |

## Local assets

All gameplay artwork and UI fonts load from `assets/`; no sprite data is embedded in the JavaScript. The roster uses eight levels of local art for each of the seven probiotic types. Enemy and boss sprites use the four-level local art sets. These hostile sprites have been mirrored to face left, matching their right-to-left approach toward the body wall. A simple left-facing token is drawn if an enemy image cannot load. Battlefield themes use the bundled background images, with the procedural battlefield retained as a fallback.

Useful asset locations:

- `assets/good_bacteria/` — the seven playable bacteria and their character/weapon art
- `assets/enemy/` and `assets/boss/` — hostile units and bosses
- `assets/background/` — battlefields and other game backgrounds
- `assets/fonts/` — regular and bold UI fonts
- `assets/mascot/`, `assets/icon/`, `assets/audio/`, and `assets/ui/` — supporting artwork, sounds, and interface assets

## Verification

`game.js` is a classic browser script loaded with `defer`, so the active roster is initialized before the game logic. The game can be checked without a build tool:

```sh
node --check game.js
python3 -m http.server 8000
```

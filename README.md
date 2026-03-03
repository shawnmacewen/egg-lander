# egg-lander

Initial scaffold for **Phaser 3 + TypeScript + Vite**.

## Branch

`feat/gdev-0001-phaser-scaffold`

## Canonical Git Remote

`origin` is canonical and should point to:

`https://github.com/shawnmacewen/egg-lander.git`

Legacy org remote `OddEye-Agent/egg-lander` is no longer used.

## Run

```bash
npm install
npm run dev
```

## Quick refresh script (local)

Use this after new pushes so you don’t have to run multiple commands manually:

```bash
./refresh-local-game.sh
```

What it does:
1. `git pull --ff-only`
2. `npm install --include=dev`
3. stops existing process on port `5173` (if found)
4. starts dev server on `0.0.0.0:5173`

## Optional global command: `egg-refresh`

Install once from repo root:

```bash
./install-egg-refresh.sh
```

Then run from anywhere:

```bash
egg-refresh
```

If command is not found, add this to `~/.bashrc` and open a new shell:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

## Build

```bash
npm run build
npm run preview
```

## Current status

- Phaser wired into Vite/TS entrypoint
- Minimal playable lander loop scaffolded
- Keyboard controls (direct):
  - `← / →` rotate
  - `↑` thrust
  - `R` restart

## Art direction target

Patapon-inspired visual style direction for future iterations:

- simple, colorful palette
- clean edges / bold silhouettes
- parallax backgrounds
- low complexity assets

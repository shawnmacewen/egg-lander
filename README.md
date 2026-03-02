# Egg Lander (MVP)

A tiny browser game where you pilot a fragile egg lander onto a nest platform.

## MVP Features

- Basic 2D physics loop (gravity, thrust, rotation, velocity)
- Direct keyboard controls (arcade-style, non-rhythm)
- Win condition: land on the nest softly and upright
- Lose conditions: crash into ground/walls/ceiling or land too hard/tilted
- HUD showing fuel, speed, attempts, and best landing speed
- Restart flow with `R`
- Visual style pass inspired by a Patapon-like vibe:
  - flat, colorful palette with clean edges
  - bold silhouette shapes and thick outlines
  - lightweight multi-layer parallax background
  - higher-contrast HUD and status banner for readability

## Art Direction Note

This version targets a playful "Patapon-like" feel in presentation only. Gameplay remains direct and responsive: you are steering continuously with the keyboard (no rhythm input layer, no tap timing system).

## Run Locally

No dependencies required.

### Option 1: Open directly

Open `index.html` in your browser.

### Option 2: Serve as static files (recommended)

From this folder:

```bash
python3 -m http.server 8080
```

Then visit: <http://localhost:8080>

## Controls

- `←` / `→`: tilt left/right
- `↑`: thrust (uses fuel)
- `R`: restart round

## Notes

- Landing safely requires both low speed and near-upright angle.
- Best landing speed is tracked across attempts in the current session.

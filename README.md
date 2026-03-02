# Egg Lander (MVP)

A tiny browser game where you pilot a fragile egg lander onto a nest platform.

## MVP Features

- Basic 2D physics loop (gravity, thrust, rotation, velocity)
- Keyboard controls
- Win condition: land on the nest softly and upright
- Lose conditions: crash into ground/walls/ceiling or land too hard/tilted
- HUD showing fuel, speed, attempts, and best landing speed
- Restart flow with `R`

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

- `←` / `→`: rotate egg
- `↑`: thrust (uses fuel)
- `R`: restart round

## Notes

- Landing safely requires both low speed and near-upright angle.
- Best landing speed is tracked across attempts in the current session.

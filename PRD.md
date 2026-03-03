# Egg Lander — Product Requirements Document (PRD)

_Last updated: 2026-03-03 (UTC) — mission loop update_

## 1) Product Vision
Egg Lander is a level-based arcade lander game with a simple, colorful, silhouette-forward art style. The core fantasy is mastering landings across increasingly difficult levels, then unlocking powerups that allow more expressive and aggressive flight/landing play.

## 2) Core Experience
- **Control model:** direct keyboard control only (no rhythm/tapping input mechanics).
- **Tone:** casual arcade, fun-first, not realistic simulation.
- **Difficulty curve:** easy/slow early game (low-power lander), gradually enabling higher-skill play via progression and powerups.

## 3) Gameplay Pillars
1. **Land successfully to beat levels** (primary objective).
2. **Progress through level-based objectives** with increasing difficulty.
3. **Unlock and use powerups** for advanced traversal/landing.
4. **Persist progress** so sessions feel cumulative.

## 4) Core Mission Loop (Updated)
1. **Planetary Landing:** land on planet surface.
2. **On-foot Extraction:** exit lander, move right, steal egg.
3. **Return to Lander:** run back with egg and board.
4. **Takeoff Phase:** launch from planet.
5. **Orbital Delivery Phase:** switch to separate screen/zone and dock at orbital base (space station, near-zero gravity, precision docking objective).
6. **Level Transition:** complete mission, then move to level select / next level.

## 5) Scoring & Progression (Current Decision)
- Scoring is **primarily based on beating the level**.
- Secondary metrics (optional/tunable later): smoothness, remaining fuel, retries.
- Winning levels is the main progression signal, not precision simulation stats.

## 6) Landing Design (Current Decision)
- Landing strictness target is **casual arcade**.
- Rules should reward fun and momentum while still requiring basic control.
- Avoid over-punishing realistic physics constraints at this stage.

## 7) Session/Reset Behavior (Current Decision)
- **Reset currently starts a new session**.
- New session resets run-specific state while preserving durable progression data.
- This is intentionally temporary and can be revised later.

## 8) Level Structure (Current Decision)
- Game is **level-based** with progressively harder objectives.
- Some levels will be **gated by required powerups** later.
- MVP should establish this structure even if gate variety is minimal initially.

## 9) Persistence / Save System (Current Decision)
- Persistent save system is required.
- Minimum persisted data target:
  - highest/unlocked level
  - best score (or best completion record)
  - powerup unlock state (as introduced)

## 10) Visual Direction
- Inspired by Patapon-like clarity:
  - simple colors
  - clean edges
  - bold silhouettes
  - parallax background layers
- No strict visual constraints at this stage.
- Accessibility is not a current priority for this cheap/rapid build phase.

## 11) MVP Definition (Current)
MVP is considered complete when all of the following exist:
- Playable keyboard-controlled mission loop: land → on-foot egg grab → return → takeoff → orbital dock.
- Distinct orbital docking phase (separate scene/zone) with near-zero gravity precision objective.
- Level-based progression with increasing challenge.
- Level completion as the primary scoring/progression driver.
- Reset starts a new session.
- Basic persistence for progression.
- Cohesive simple/silhouette/parallax visual style.

## 12) Open Items (for post-MVP tuning)
- Final scoring formula weights.
- Exact gate conditions for powerup-locked levels.
- Save schema versioning + migration strategy.
- Optional accessibility pass (if scope/budget changes).

## 13) Decision Log
### 2026-03-03
- Confirmed scoring emphasis on beating levels.
- Confirmed landing targets as casual arcade.
- Confirmed reset starts a new session for now.
- Confirmed level-based progression with later powerup gates.
- Confirmed persistence/save requirement.
- Confirmed no hard visual constraints at this stage.
- Confirmed canonical mission loop: planet land -> exit -> steal egg -> return -> takeoff -> orbital docking delivery.
- Confirmed delivery base is orbital (space-station style), with near-zero gravity and precision docking objective.

# CHANGELOG

## 2026-03-02 — gdev-0001 scaffold

### Assistant summary (exact)
Done — executed successfully (with safe path adjustment to the repo folder).

### Completed
- Set repo identity:
  - `user.name`: **OddEye Agent**
  - `user.email`: **oddeye-agent@protonmail.com**
- Created branch:
  - `feat/gdev-0001-phaser-scaffold`
- Scaffolded:
  - **Phaser 3 + TypeScript + Vite**
- Added initial playable scaffold and updated README.
- Committed:
  - `a25a76a` — `gdev-0001: scaffold Phaser 3 + TypeScript + Vite`
- Pushed branch to origin:
  - `origin/feat/gdev-0001-phaser-scaffold`

No auth drift this time, so no sync script needed.

---

## 2026-03-03 — Node 18 compatibility hotfix

### Assistant summary (exact)
Root cause found: your host is on **Node 18.19.1**, while current Vite 7 needs newer Node.

I’m fixing this in-repo now so you can run immediately on your machine:
- Downgrade Vite to a Node-18-compatible line
- Push the patch
- Give you exact pull + run commands

### Technical details
- Updated `vite` from `^7.3.1` to `^5.4.19` in `package.json` (Node 18 compatible).
- Refreshed lockfile.

## 2026-03-03 — PRD update from confirmed decisions

### Assistant summary (exact)
Done — I updated the PRD with all the recent decisions we just confirmed.

### Technical details
- Added new `PRD.md` with sections for scoring, landing strictness, reset/session behavior, level progression, persistence, and MVP completion criteria.
- Included a dated decision log capturing today’s confirmed product calls.

## Process rule (agreed)
For every build/change task going forward:
1. Append an entry to this `CHANGELOG.md`.
2. Include the exact summary sent to the user.
3. Optionally add extra technical details (files changed, commands, commit hashes, blockers).

---

## 2026-03-03 — MVP gameplay + visual pass

### Assistant summary (exact)
Implemented a full MVP gameplay pass for Egg Lander: tighter keyboard flight feel, explicit landed/crashed state flow with feedback, reset-and-retry attempt loop with scoring, upgraded Patapon-inspired silhouette/parallax visuals, and verified production build on the Node-18-compatible Vite 5 toolchain.

### Technical details
- Reworked `src/main.ts` gameplay loop and state model (`flying`, `landed`, `crashed`).
- Added score + attempts + fuel + velocity HUD and clearer control/status messaging.
- Added landing quality evaluation and crash reasons (missed pad, bad angle, too fast down, drift).
- Added explicit reset flow (`R`) for repeated runs while retaining cumulative score/attempts.
- Improved visuals with layered silhouettes, cloud drift, parallax response, cleaner UI treatment, and simple thruster feedback.
- Verified with `npm run build` (pass) on current environment.
- Commit: `dccb8a5` — `gdev-0001: MVP gameplay pass + visual polish`

---

## 2026-03-03 — Level loop + progression persistence pass

### Assistant summary (exact)
Implemented the new level-loop direction: added a 3-level progression system with increasing difficulty, made level clear the primary score event, relaxed landing checks for casual arcade feel, made `R` start a fresh session, added localStorage persistence for unlocked/highest/best score, and added HUD/UI for current level objective and progression status. Verified with `npm run build`.

### Technical details
- Added `LEVELS` configuration (3 levels) with escalating gravity, pad width, fuel burn, and landing thresholds.
- Scoring now centers on level completion (`completionScore` + small fuel bonus), not per-attempt micro-judging.
- Landing acceptance tuned to forgiving arcade thresholds per level.
- Reset behavior changed: `R` now starts a brand-new session (score, attempts, level index reset).
- Added persistence (`localStorage`): unlocked level, highest level reached, best session score.
- Added UI lines for level name, objective, unlocked/highest progression, and best score.
- Build verification passed: `npm run build`.
- Commit: `88b99a5` — `gdev-0001: add level progression, casual landing, and save data`

## 2026-03-03 — Progression UX + powerup scaffold + save schema v2

### Assistant summary (exact)
Shipped a progression UX and persistence upgrade: added launch/objective transitions between levels, introduced powerup unlock placeholders with functional Stability Thrusters effect, and migrated save data to schema v2 with versioned progress+unlocks; build passes.

### Technical details
- Added pre-launch transition flow per level (`Press ↑ to launch`) with clearer state messaging for flying/crash/clear transitions.
- Added powerup system scaffold with unlock placeholders:
  - `Stability Thrusters` (functional now)
  - `Shielded Hull` (placeholder)
  - `Fuel Gel` (placeholder)
- Implemented one functional effect: `Stability Thrusters` now dampens drift/rotation and slightly widens safe landing windows.
- Upgraded persistence schema to versioned save format (`version`, progression fields, unlocked powerups, selected powerup) with fallback read from prior v1 key.
- Verified production build: `npm run build` (pass).
- Commit: `9f6b6b3` — `gdev-0001: add powerup unlocks, save schema v2, and transition UX`

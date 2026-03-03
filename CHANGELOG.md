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

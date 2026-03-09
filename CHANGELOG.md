# CHANGELOG

## 2026-03-09 — gdev-0085 post-clear instant replay hotkey

### Assistant summary (exact)
Implemented the next high-impact run-loop QoL pass: added a mission-complete instant replay hotkey (`T`) that immediately restarts the current level from the post-clear screen, so players can run back reps without detouring through level select. Verified with `npm run build`.

### Technical details
- Added `replayCurrentLevelFromComplete()` to restart the current level from `level-complete` state via the existing brief/start flow.
- Wired `T` handling in `update()` during `level-complete` phase, alongside existing `N` (next level) and `L` (level select) controls.
- Updated completion copy to surface the new action:
  - status line now shows `T replay level • N next level • L level select`
  - hint line now includes `T instant replay`
- Updated task registry with `gdev-0085` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0083 in-run quick retry hotkey

### Assistant summary (exact)
Implemented the next high-impact gameplay QoL pass: added an in-run quick retry hotkey (`T`) that immediately aborts the current attempt and safely restarts the selected mission loop, with updated control hints across flight/docking/pause and level-select copy. Verified with `npm run build`.

### Technical details
- Added dedicated `T` key binding (`keyT`) in `EggLanderMissionScene`.
- Added `canQuickRetry()` gate aligned to active mission phases (`planet-brief`, `planet-flying`, `on-foot`, `takeoff`, `orbital-docking`).
- Wired `T` handling in `update()` to call existing safe fail/reset path (`failMission('Manual retry')`) and return immediately.
- Updated hints to surface `T retry` where relevant:
  - planet launch/flying
  - orbital docking
  - pause overlay
  - pre-launch brief and level-select control summary
- Updated task registry with `gdev-0083` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0082 HUD detail toggle + compact telemetry mode

### Assistant summary (exact)
Implemented the next high-impact readability pass: added an in-game HUD detail toggle (`H`) that switches between the existing full telemetry wall and a compact run-focused HUD, with control-hint updates so players can quickly declutter the screen without leaving gameplay. Verified with `npm run build`.

### Technical details
- Added a dedicated `H` key binding and `isHudCompact` scene state in `EggLanderMissionScene`.
- Updated the main input loop so `H` toggles HUD detail mode in both level-select and active mission flow.
- Added dual HUD string generation in `updateUi()`:
  - **Full**: existing complete telemetry readout.
  - **Compact**: condensed run-critical telemetry (score/time/fuel/HP/boss/spear/dock/powerup).
- Added explicit HUD mode visibility by prefixing level telemetry with `HUD Full/Compact`.
- Updated gameplay hint copy to advertise `H HUD mode/detail` alongside existing controls.
- Updated task registry with `gdev-0082` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0081 in-run pause/resume control

### Assistant summary (exact)
Implemented a high-impact gameplay quality-of-life pass: added a global in-run pause toggle (`P`) that cleanly freezes active mission phases and shows an explicit resume cue, so players can safely interrupt runs without losing control context. Verified with `npm run build`.

### Technical details
- Added a dedicated `P` key binding and pause state fields in `EggLanderMissionScene`.
- Added `canTogglePause()` phase gate so pause is available only during active mission flow (`planet-brief`, `planet-flying`, `on-foot`, `takeoff`, `orbital-docking`).
- Added `togglePause()` to:
  - persist current status/hint strings,
  - swap HUD copy to `Paused` + resume instruction,
  - pause/resume scene animations via `this.anims.pauseAll()` / `this.anims.resumeAll()`.
- Updated `update()` loop to short-circuit simulation while paused (`updateUi()` still runs for telemetry continuity).
- Updated key gameplay hint strings to advertise `P pause` during flight/takeoff/docking.
- Updated task registry with `gdev-0081` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0080 mission discipline telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select guidance pass: added `Discipline ...` telemetry that enforces anti-overgrind boundaries (rep caps, PB attempt limits, and mandatory reassess/stop transitions) by commitment/window state, so players preserve execution quality instead of spiraling into tilt reps. Verified with `npm run build`.

### Technical details
- Added derived `missionDisciplineReadout` in `updateUi()` with no save-schema changes.
- Discipline guidance branches from existing progression + commitment/window signals:
  - pre-attempt → `Discipline Run one baseline rep only; no extra loops before review`
  - attempts/no clears → `Discipline Cap first-clear grind at 2 reps, then reset route plan`
  - `Commit Recover` → `Discipline Stay in recovery until pressure drops one full band`
  - `Commit Push` + open window → `Discipline Exactly one PB attempt, then mandatory bank/stop`
  - `Commit Push` without open window → `Discipline No PB attempts until window reopens`
  - `Commit Bank` → `Discipline Bank exactly two clean reps, then reassess`
  - `Commit Hold` → `Discipline Hold to one composed rep before any extension`
- Extended level-select telemetry line to include `Discipline ...` immediately after `Stability ...` guidance.
- Updated task registry with `gdev-0080` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0078 mission priority telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select guidance pass: added `Priority ...` telemetry that compresses the current run posture into one highest-impact next action (seed/first-clear/recover/push/bank/hold), so players can act immediately without scanning the full guidance stack. Verified with `npm run build`.

### Technical details
- Added derived `missionPriorityReadout` in `updateUi()` with no save-schema changes.
- Priority guidance branches from existing progression + commitment/window signals:
  - pre-attempt → `Priority Seed one clean baseline clear to unlock real guidance`
  - attempts/no clears → `Priority Secure first clear on safest route (score is secondary)`
  - recover posture → `Priority Lower pressure one band before any push attempts`
  - push posture + open window → `Priority Take exactly one disciplined PB shot this block`
  - bank posture → `Priority Stack two clean banks and protect quality`
  - hold/other posture → `Priority Hold composure and finish one stable rep`
- Extended level-select telemetry line to include `Priority ...` immediately after `No-Go ...` guidance.
- Updated task registry with `gdev-0078` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0077 mission no-go telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select decision pass: added `No-Go ...` telemetry that states the explicit abort condition for the current run posture (first-clear/push/bank/recover/hold), so players know exactly when to cancel a bad rep instead of forcing tilt runs. Verified with `npm run build`.

### Technical details
- Added derived `missionNoGoReadout` in `updateUi()` with no save-schema changes.
- No-go guidance branches from existing progression + commitment signals:
  - pre-attempt → `No-Go None (seed baseline run first)`
  - attempts/no clears → `No-Go Abort launch if route drifts from safest first-clear line`
  - `Commit Push` → `No-Go Abort PB if first segment misses target pace/score line`
  - `Commit Bank` → `No-Go Abort block after first quality drop (protect clean bank)`
  - `Commit Recover` → `No-Go Abort aggression until pressure band visibly drops`
  - `Commit Hold` → `No-Go Abort relaunch if composure cue is still unstable`
- Extended level-select telemetry line to include `No-Go ...` immediately after `Go Signal ...` guidance.
- Updated task registry with `gdev-0077` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0073 mission debrief telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select pacing pass: added `Debrief ...` telemetry that tells players exactly what to log after each run block by commitment state (seed/first-clear/push/bank/recover/hold), so improvement notes stay focused and the next session starts with a clear adjustment cue. Verified with `npm run build`.

### Technical details
- Added derived `missionDebriefReadout` in `updateUi()` with no save-schema changes.
- Debrief guidance branches from existing progression + commitment signals:
  - pre-attempt → `Debrief Record one baseline note: safest landing/dock line`
  - attempts/no clears → `Debrief Note first-clear blocker and safest recovery route`
  - `Commit Push` → `Debrief Log PB delta: where pace/score gain was won or lost`
  - `Commit Bank` → `Debrief Log which rep stayed cleanest for next warmup copy`
  - `Commit Recover` → `Debrief Log pressure trigger and the rep that stabilized it`
  - `Commit Hold` → `Debrief Log one hold cue to repeat before next session`
- Extended level-select telemetry line to include `Debrief ...` immediately after `Exit Rule ...` guidance.
- Updated task registry with `gdev-0073` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0072 mission exit-rule telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select pacing pass: added `Exit Rule ...` telemetry that tells players exactly when to end the current block by commitment state (seed/first-clear/push/bank/recover/hold), reducing overgrind and tilt spirals. Verified with `npm run build`.

### Technical details
- Added derived `missionExitReadout` in `updateUi()` with no save-schema changes.
- Exit-rule guidance branches from existing progression + commitment signals:
  - pre-attempt → `Exit Rule Stop after baseline clear and log notes`
  - attempts/no clears → `Exit Rule Stop after first clear to lock safe route memory`
  - `Commit Push` → `Exit Rule End block once one PB shot is taken`
  - `Commit Bank` → `Exit Rule End after two clean banks or one quality drop`
  - `Commit Recover` → `Exit Rule End if pressure fails to drop after this set`
  - `Commit Hold` → `Exit Rule End after one stable hold rep and reset fresh`
- Extended level-select telemetry line to include `Exit Rule ...` immediately after `Session Goal ...` guidance.
- Updated task registry with `gdev-0072` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0069 mission session-goal telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select pacing pass: added `Session Goal ...` telemetry that defines the block-end objective for the current commitment state (seed/first-clear/push/bank/recover/hold), so each play block has a clear finish condition and players stop overextending. Verified with `npm run build`.

### Technical details
- Added derived `missionSessionGoalReadout` in `updateUi()` with no save-schema changes.
- Session-goal guidance branches from existing progression + commitment signals:
  - pre-attempt → `Session Goal Log one clean baseline finish on this level`
  - attempts/no clears → `Session Goal Secure first clear, then stop push attempts`
  - `Commit Push` → `Session Goal Land one PB-quality rep, then bank exit`
  - `Commit Bank` → `Session Goal Stack two clean reps and preserve streak`
  - `Commit Recover` → `Session Goal Lower pressure band before ending set`
  - `Commit Hold` → `Session Goal Hold consistency and finish composed`
- Extended level-select telemetry line to include `Session Goal ...` immediately after `Reassess ...` guidance.
- Updated task registry with `gdev-0069` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0068 mission reassess telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select pacing pass: added `Reassess ...` telemetry that tells players what adjustment to make after each run block (seed/first-clear/push/bank/recover/hold), so the new set-size guidance always resolves into a concrete next action instead of indecision. Verified with `npm run build`.

### Technical details
- Added derived `missionReassessReadout` in `updateUi()` with no save-schema changes.
- Reassess guidance branches from existing progression + commitment signals:
  - pre-attempt → `Reassess After first finish: set baseline route notes`
  - attempts/no clears → `Reassess After each set: keep only safer first-clear lines`
  - `Commit Push` → `Reassess If PB misses, drop to one clean bank rep`
  - `Commit Bank` → `Reassess If clean quality slips twice, switch to hold`
  - `Commit Recover` → `Reassess Once pressure drops a band, reopen bank reps`
  - `Commit Hold` → `Reassess After hold rep: either bank cleanly or end block`
- Extended level-select telemetry line to include `Reassess ...` immediately after `Set Size ...` guidance.
- Updated task registry with `gdev-0068` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0067 mission set-size telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select pacing pass: added `Set Size ...` telemetry that recommends how many runs to execute in the current block (seed/breakthrough/push/bank/recover/hold) before reassessing, so sessions stay disciplined and lower tilt risk. Verified with `npm run build`.

### Technical details
- Added derived `missionSetSizeReadout` in `updateUi()` with no save-schema changes.
- Set-size guidance branches from existing progression + commitment signals:
  - pre-attempt → `Set Size 1 run (seed baseline only)`
  - attempts/no clears → `Set Size 2 runs (safe clear reps, then reassess)`
  - `Commit Push` → `Set Size 2 runs (bank + one PB shot)`
  - `Commit Bank` → `Set Size 2 runs (clean reps only)`
  - `Commit Recover` → `Set Size 3 runs (fundamentals reset block)`
  - `Commit Hold` → `Set Size 1 run (hold line then evaluate)`
- Extended level-select telemetry line to include `Set Size ...` immediately after `Drill ...` guidance.
- Updated task registry with `gdev-0067` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0066 targeted drill telemetry

### Assistant summary (exact)
Implemented the next highest-impact level-select coaching pass: added `Drill ...` telemetry that converts the current weakest mastery metric into a concrete short rep prescription (consistency, first-attempt discipline, clean clears, relic pickups, or S-dock entries). Verified with `npm run build`.

### Technical details
- Added derived `missionDrillReadout` in `updateUi()` with no save-schema changes.
- Drill guidance branches from existing progression + mastery-focus signals:
  - pre-attempt → `Drill Seed 1 full-route baseline run`
  - attempts/no clears → `Drill First clear reps: safe land -> egg -> safe dock`
  - weakest metric `Clear` → `Drill Consistency set: 2 no-miss mission clears`
  - weakest metric `First Try` → `Drill First-attempt set: 2 launches with no early reset`
  - weakest metric `Clean` → `Drill Clean set: 2 clears with zero damage`
  - weakest metric `Relic` → `Drill Relic set: 2 relic pickups before egg steal`
  - otherwise (`S Dock`) → `Drill Dock set: 3 controlled S-grade dock entries`
- Extended level-select telemetry line to include `Drill ...` immediately after warmup guidance.
- Updated task registry with `gdev-0066` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0064 mission launch-check telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select decision pass: added `Launch Check ...` telemetry that collapses commitment/window/pressure into a final go/no-go launch gate (`Green/Amber/Yellow/Red`) so players know whether to take a PB shot now or run a safer rep first. Verified with `npm run build`.

### Technical details
- Added derived `missionLaunchCheckReadout` in `updateUi()` with no save-schema changes.
- Launch-check guidance branches from existing telemetry signals:
  - pre-attempt → `Launch Check Green (seed baseline run now)`
  - attempts/no clears → `Launch Check Amber (prioritize first clear route only)`
  - recovery/extreme pressure → `Launch Check Red (no PB attempts; recover consistency)`
  - push posture with open window + locked/ready confidence → `Launch Check Green (take one PB shot this launch)`
  - push/bank without full greenlight → `Launch Check Amber (bank one clean rep before PB)`
  - hold posture → `Launch Check Yellow (single hold rep, then reassess)`
- Extended level-select telemetry line to include `Launch Check ...` immediately after reset-cue guidance.
- Updated task registry with `gdev-0064` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0063 mission reset-cue telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select decision pass: added `Reset Cue ...` telemetry that tells players exactly how to relaunch after a stop condition (pause/bank/fundamentals/composure) based on commitment state, reducing tilt loops after failed reps. Verified with `npm run build`.

### Technical details
- Added derived `missionResetReadout` in `updateUi()` with no save-schema changes.
- Reset-cue guidance branches from existing progression + commitment signals:
  - pre-attempt → `Reset Cue None (complete seed run first)`
  - attempts/no clears → `Reset Cue 30s pause, then replay safe first-clear route`
  - `Commit Push` → `Reset Cue After stop, bank one clean rep before next push`
  - `Commit Bank` → `Reset Cue 20s breath reset, then keep same clean line`
  - `Commit Recover` → `Reset Cue Drop aggression one notch; rebuild fundamentals`
  - `Commit Hold` → `Reset Cue Full composure reset before relaunching`
- Extended level-select telemetry line to include `Reset Cue ...` immediately after stop-rule guidance.
- Updated task registry with `gdev-0063` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0062 mission stop-rule telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select decision pass: added `Stop Rule ...` telemetry that sets an explicit anti-tilt cutoff per commitment posture (when to end a push block, switch to hold, or reset) so players avoid over-grinding bad reps. Verified with `npm run build`.

### Technical details
- Added derived `missionStopReadout` in `updateUi()` with no save-schema changes.
- Stop-rule guidance branches from existing progression + commitment signals:
  - pre-attempt → `Stop Rule None (seed run for baseline first)`
  - attempts/no clears → `Stop Rule Pause after 3 misses and review route`
  - `Commit Push` → `Stop Rule End push block after 1 failed PB rep`
  - `Commit Bank` → `Stop Rule If two reps lose quality, switch to hold`
  - `Commit Recover` → `Stop Rule End set once pressure band drops`
  - `Commit Hold` → `Stop Rule One clean rep only, then hard reset`
- Extended level-select telemetry line to include `Stop Rule ...` immediately after cadence guidance.
- Updated task registry with `gdev-0062` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0061 mission cadence telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select decision pass: added `Cadence ...` telemetry that prescribes run tempo (`Slow/Steady/Burst/Controlled/Reset/Hold`) from the current commitment state so players can pace attempts and avoid tilt between pushes. Verified with `npm run build`.

### Technical details
- Added derived `missionCadenceReadout` in `updateUi()` with no save-schema changes.
- Cadence guidance branches from existing progression + commitment signals:
  - pre-attempt → `Cadence Slow (1 scouting rep, then review telemetry)`
  - attempts/no clears → `Cadence Steady (repeat safe route until first clear)`
  - `Commit Push` → `Cadence Burst (bank once, push once, then pause)`
  - `Commit Bank` → `Cadence Controlled (two clean reps, short reset)`
  - `Commit Recover` → `Cadence Reset (three fundamentals reps, no forcing)`
  - `Commit Hold` → `Cadence Hold (single reps with full composure reset)`
- Extended level-select telemetry line to include `Cadence ...` immediately after execution guidance.
- Updated task registry with `gdev-0061` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0060 mission execution telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select decision pass: added `Execute ...` telemetry that converts commitment state into an immediate rep count/sequence (`seed`, `safe clear`, `bank then push`, `two banks`, `three recovery reps`, or `hold`) so players can act without overthinking between runs. Verified with `npm run build`.

### Technical details
- Added derived `missionExecutionReadout` in `updateUi()` with no save-schema changes.
- Execution guidance branches from existing mission state + commitment signal:
  - pre-attempt → `Execute Seed route (finish first for telemetry)`
  - pre-first-clear → `Execute Safe clear route (score optional)`
  - `Commit Push` → `Execute 1 bank rep, then 1 PB attempt`
  - `Commit Bank` → `Execute 2 clean reps before any push`
  - `Commit Recover` → `Execute 3 no-miss reps to de-escalate`
  - `Commit Hold` → `Execute Hold line until pressure softens`
- Extended level-select telemetry line to include `Execute ...` directly after fallback guidance.
- Updated task registry with `gdev-0060` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0059 mission fallback telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select decision pass: added `Fallback ...` telemetry to show the immediate contingency plan if the committed run posture fails (seed/first-clear safety, push→bank, bank→hold, recover→fundamentals), reducing post-fail indecision and helping players reset quickly. Verified with `npm run build`.

### Technical details
- Added derived `missionFallbackReadout` in `updateUi()` with no save-schema changes.
- Fallback logic branches from existing mission state + commitment signal:
  - pre-attempt → baseline seed guidance
  - pre-first-clear → route-first-clear safety guidance
  - `Commit Push` → immediate clean bank contingency
  - `Commit Bank` → hold line/protect streak contingency
  - `Commit Recover` → fundamentals/de-escalation contingency
  - `Commit Hold` → maintain hold until pressure softens
- Extended level-select telemetry line to include `Fallback ...` directly after commitment guidance.
- Updated task registry with `gdev-0059` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0058 mission commitment telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select decision pass: added `Commit ...` telemetry (`Push/Bank/Recover/Hold`) so players get one explicit action commitment after edge/window analysis, reducing indecision before launch. Verified with `npm run build`.

### Technical details
- Added derived `missionCommitReadout` in `updateUi()` with no save-schema changes.
- Commitment guidance branches from existing decision signals:
  - pre-attempt → `Commit Seed`
  - attempts/no clears → `Commit Breakthrough`
  - favorable edge + open window → `Commit Push`
  - even edge → `Commit Bank`
  - recover call / costly states → `Commit Recover` or `Commit Hold`.
- Extended level-select telemetry line to include `Commit ...` directly after edge guidance.
- Updated task registry with `gdev-0058` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0057 risk/reward edge telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select decision pass: added `Edge ...` telemetry that summarizes immediate risk/reward balance (`Favorable/Even/Costly`) using mission call intent, retry pressure, and current streak exposure so players can quickly decide whether to push now or stabilize first. Verified with `npm run build`.

### Technical details
- Added derived `missionEdgeReadout` in `updateUi()` with no save-schema changes.
- Edge guidance branches safely from existing mission state:
  - no attempts → `Edge -- (log one run to calibrate risk/reward)`
  - attempts but no clears → `Edge Breakthrough (first clear reward outweighs risk)`
  - post-clear states compute a simple reward-minus-risk score from call posture (`Push/Prime/Probe/Stabilize`), pressure band, and active streak exposure.
- Added `Edge ...` directly after fail-cost telemetry in the level-select readout chain.
- Updated task registry with `gdev-0057` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0056 mission fail-cost telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select decision pass: added `Fail Cost ...` telemetry that makes the immediate downside of a failed run explicit (streak loss + pressure impact + push-window risk) so players can decide when to push versus stabilize with clearer risk awareness. Verified with `npm run build`.

### Technical details
- Added derived `missionFailCostReadout` in `updateUi()` with no save-schema changes.
- Fail-cost guidance branches from existing progression state:
  - no attempts → `Fail Cost None yet (seed run for telemetry)`
  - attempts but no clears → `Fail Cost Adds retry pressure (first clear delayed)`
  - post-clear states include streak impact (`streak -N` when active), pressure-risk severity, and confidence-window consequence.
- Extended level-select telemetry line to include `Fail Cost ...` directly after mission win-condition guidance.
- Updated task registry with `gdev-0056` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0055 mission win-condition telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select guidance pass: added `Win ...` telemetry that translates the current mission call state into one immediate success criterion (first clear, safe clear, clean rep, focused metric rep, or explicit PB delta target) so players know exactly what counts as a successful next run. Verified with `npm run build`.

### Technical details
- Added derived `missionWinConditionReadout` in `updateUi()` with no save-schema changes.
- Win-condition logic branches from existing call + progression signals:
  - no attempts → `Win Seed one clean finish to unlock targets`
  - attempts but no clears → `Win Land first clear (score is secondary)`
  - `Call Push` → explicit score-delta target versus `Best Run`
  - `Call Prime` → clean-clear + small time-trim target
  - `Call Recover` → clean safe-clear recovery directive
  - `Call Probe/Stabilize` → weakest-metric rep or pressure-safe clear directive
- Extended level-select telemetry line to include `Win ...` directly after mission call guidance.
- Updated task registry with `gdev-0055` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0054 mission call telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select guidance pass: added `Call ...` telemetry that turns the current readiness/window state into a single immediate action cue (`Seed/Breakthrough/Push/Prime/Recover/Probe/Stabilize`) so players know exactly what kind of run to take next. Verified with `npm run build`.

### Technical details
- Added derived `missionCallReadout` in `updateUi()` with no save-schema changes.
- Call guidance logic branches safely from existing telemetry:
  - no attempts → `Call Seed`
  - attempts but no clears → `Call Breakthrough`
  - `Window Open` → `Call Push`
  - `Window Near` → `Call Prime`
  - high/extreme pressure → `Call Recover`
  - otherwise uses readiness to choose `Call Probe` vs `Call Stabilize`.
- Extended level-select telemetry line to include `Call ...` directly after window guidance.
- Updated task registry with `gdev-0054` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0053 mission push-window telemetry

### Assistant summary (exact)
Implemented the next high-impact level-select guidance pass: added `Window ...` telemetry that gives a clear go/no-go push signal (`Open/Near/Cautious/Closed`) by combining confidence, readiness, pressure, and recovery state into one decision cue. Verified with `npm run build`.

### Technical details
- Added derived `missionWindowReadout` in `updateUi()` with no save-schema changes.
- Window guidance logic branches safely from existing telemetry:
  - no attempts → `Window Seed (log one completion rep)`
  - attempts but no clears → `Window Prep (route first clear safely)`
  - stable/high-confidence states map to `Window Open` or `Window Near`
  - high retry pressure maps to `Window Closed`
  - all other post-clear states map to `Window Cautious`
- Extended level-select telemetry line to include `Window ...` directly after recovery guidance.
- Updated task registry with `gdev-0053` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0052 mission recovery threshold correctness fix

### Assistant summary (exact)
Implemented a safety/correctness fix for level-select recovery guidance: `Recovery ...` now targets the immediate next lower pressure band (Extreme→High, High→Medium, Medium→Low) instead of over-demanding multi-band drops. This keeps recovery advice achievable and aligned with displayed pressure thresholds. Verified with `npm run build`.

### Technical details
- Updated recovery band-down logic in `updateUi()` to map pressure transitions explicitly:
  - `Medium -> Low` (`<=0.5 retries/clear`)
  - `High -> Medium` (`<=1.5 retries/clear`)
  - `Extreme -> High` (`<=3.0 retries/clear`)
- Kept `Low` behavior unchanged (`Recovery Stable`).
- No save-schema changes; telemetry-only fix.
- Updated task registry with `gdev-0052` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0051 mission recovery telemetry

### Assistant summary (exact)
Implemented the next safe high-impact readability pass: level-select telemetry now includes a `Recovery ...` cue that tells players how many clean clears are needed to de-escalate mission pressure (`to Medium/Low`) before attempting aggressive PB lines. Verified with `npm run build`.

### Technical details
- Added derived `missionRecoveryReadout` in `updateUi()` with no save-schema changes.
- Recovery logic safely branches from existing telemetry:
  - no attempts → `Recovery Seed first clear`
  - attempts but no clears → `Recovery Land first clear route`
  - low pressure → `Recovery Stable (protect streak)`
  - medium/high/extreme pressure → computes minimum clean clears needed (without new failures) to step pressure down one band.
- Extended level-select telemetry line to include `Recovery ...` directly after risk budget guidance.
- Updated task registry with `gdev-0051` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0050 mission risk-budget telemetry

### Assistant summary (exact)
Implemented the next safe high-impact readability pass: level-select telemetry now includes a dynamic `Risk Budget ...` cue that combines mission readiness, confidence, and retry pressure into a clear aggression budget (`Seed/Balanced/Safe/Aggro/Locked`) so players can decide whether to push PB lines or bank consistency before launch. Verified with `npm run build`.

### Technical details
- Added derived `missionRiskBudgetReadout` in `updateUi()` with no save-schema changes.
- Risk-budget logic safely branches from existing telemetry:
  - no attempts → `Risk Budget Seed (log one baseline clear)`
  - otherwise scores current run posture from readiness hits + confidence band + pressure label.
- Added budget outcome bands:
  - `Risk Budget Aggro (take one PB line now)`
  - `Risk Budget Balanced (one push after clean rep)`
  - `Risk Budget Safe (stabilize pace first)`
  - `Risk Budget Locked (bank consistency only)`
- Extended level-select telemetry line to include `Risk Budget ...` directly after readiness.
- Updated task registry with `gdev-0050` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0049 mission-readiness checklist telemetry

### Assistant summary (exact)
Implemented the next safe high-impact readability pass: level-select telemetry now includes a compact `Readiness x/3` checklist that rolls consistency pressure, pace intent, and score intent into one at-a-glance push/stabilize signal. Verified with `npm run build`.

### Technical details
- Added derived `missionReadinessReadout` in `updateUi()` with no save-schema changes.
- Readiness checklist aggregates three existing guidance gates:
  - consistency gate: at least one clear and non-extreme pressure (`Low`/`Medium`)
  - pace gate: pace target is not currently in safer/stabilize mode
  - score gate: score target is not currently in safe/stabilize mode
- Emits actionable cue bands from the checklist total:
  - `0/3 rebuild fundamentals`
  - `1/3 stabilize then push`
  - `2/3 strong push window`
  - `3/3 full-send PB window`
  - pre-attempt state falls back to `seed first clear`.
- Extended level-select telemetry line to include `Readiness ...` after pace/score targets and before coach guidance.
- Updated task registry with `gdev-0049` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0048 score-target telemetry

### Assistant summary (exact)
Implemented the next safe high-impact readability pass: level-select telemetry now includes a dynamic `Score Target ...` cue that recommends either a PB push or a safer stabilization score based on mission confidence and retry pressure, anchored to each level's saved best run score. Verified with `npm run build`.

### Technical details
- Added derived `missionScoreTargetReadout` in `updateUi()` with no save-schema changes.
- Score-target logic branches safely on existing telemetry state:
  - no clears → `Score Target set after first clear`
  - clears but no run PB score yet → `Score Target set from next clear`
  - otherwise computes a target score from saved per-level best run score using blended pressure/confidence factors.
- Target score includes an intent cue (`+N push` / `N safe` / `hold PB line`) to clarify whether the run should be aggressive or stabilizing.
- Extended level-select telemetry line to include `Score Target ...` directly after pace targeting.
- Updated task registry with `gdev-0048` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0047 pace-target telemetry

### Assistant summary (exact)
Implemented the next safe high-impact readability pass: level-select telemetry now includes a dynamic `Pace Target ...` cue that recommends either a safer consistency pace or a faster PB push based on mission confidence and retry pressure, anchored to each level's saved best mission time. Verified with `npm run build`.

### Technical details
- Added derived `missionPaceReadout` in `updateUi()` with no save-schema changes.
- Pace-target logic branches safely on existing telemetry state:
  - no clears → `Pace Target log first finish time`
  - clears but no PB time yet → `Pace Target set from next clear`
  - otherwise computes a target time from saved PB using blended pressure/confidence factors.
- Target pace includes a delta cue versus PB (`Xs faster` / `Xs safer` / `on PB pace`) to clarify intent.
- Extended level-select telemetry line to include `Pace Target ...` directly after mission plan guidance.
- Updated task registry with `gdev-0047` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0046 mission-plan telemetry

### Assistant summary (exact)
Implemented the next safe high-impact readability pass: level-select telemetry now includes a concise mission-plan directive (`Plan ...`) that tells players whether to seed baseline progress, drill for first clear, stabilize consistency, or push a focused PB rep using the weakest mastery metric as the target. Verified with `npm run build`.

### Technical details
- Added derived `missionPlanReadout` in `updateUi()` with no save-schema changes.
- Mission-plan logic branches safely on existing telemetry state:
  - no attempts → `Plan Seed baseline clear`
  - no clears → `Plan Drill first clear route`
  - high/extreme pressure → `Plan Stabilize with 2 safe reps`
  - ready/locked confidence + strong weakest metric → `Plan Push PB pace now`
  - ready/locked confidence + weak spot present → `Plan Push <metric> quality rep`
  - otherwise → `Plan Practice <metric> fundamentals`
- Extended level-select telemetry line to include `Plan ...` directly after confidence and before coach guidance.
- Updated task registry with `gdev-0046` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0045 mission-confidence telemetry

### Assistant summary (exact)
Implemented the next safe high-impact readability pass: level-select telemetry now includes a mission-confidence signal (`Confidence Locked/Ready/Swing/Risk`) with numeric score and concise action cue, blending mastery score, retry-pressure, and mission-match fit into one decision-ready line. Verified with `npm run build`.

### Technical details
- Added derived `missionConfidenceReadout` in `updateUi()` with no save-schema changes.
- Confidence score computation combines:
  - mastery score contribution (30% weight),
  - retry-pressure points (`Low/Medium/High/Extreme`),
  - mission-match points (`Overmatch/Fair/Stretch/Spike`, with calibration for no-clear states).
- Added confidence bands and tactical cues:
  - `Locked` → `greenlight PB route`
  - `Ready` → `commit to one score push`
  - `Swing` → `stabilize one rep first`
  - `Risk` → `reset to safe fundamentals`
- Extended level-select telemetry line to include `Confidence ...` alongside pressure/outlook/match/coaching readouts.
- Updated task registry with `gdev-0045` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0044 mission-match telemetry

### Assistant summary (exact)
Implemented the next safe high-impact readability pass: level-select telemetry now includes a mission-match assessment (`Match Overmatch/Fair/Stretch/Spike`) that compares the selected mission’s target difficulty tier against the player’s current mastery tier, so players can quickly decide whether to stabilize, grind, or push. Verified with `npm run build`.

### Technical details
- Added derived mission target tier mapping by level (`Bronze/Silver/Gold/Ace`).
- Added mastery-vs-target comparison readout in `updateUi()`:
  - `Match Calibrating` when the mission has no clears yet.
  - `Match Overmatch/Fair/Stretch/Spike` based on tier gap.
- Extended level-select telemetry line to include mission-match readout beside pressure/outlook/coaching cues.
- Updated task registry with `gdev-0044` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0043 level-select coaching cue

### Assistant summary (exact)
Implemented the next safe high-impact readability pass: level-select telemetry now includes a contextual `Coach:` cue that turns the weakest mastery metric into an actionable run plan and, when relevant, recommends an unlocked loadout perk (Shielded Hull / Fuel Gel / Stability Thrusters). This keeps progression guidance specific without changing save schema. Verified with `npm run build`.

### Technical details
- Refactored weakest-metric derivation into a reusable `weakestFocusArea` value in `updateUi()`.
- Added derived `coachReadout` telemetry with safe, no-schema branches:
  - First-clear guidance before any clears.
  - Speed-PB guidance when all mastery metrics are capped.
  - Weakest-metric action plans (`consistency reps` vs `quality scoring run`) based on mission pressure.
  - Contextual perk hints when the relevant powerup is unlocked.
- Extended level-select HUD telemetry line to include `Coach: ...` directly beside pressure/outlook/mastery guidance.
- Updated task registry with `gdev-0043` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0042 mission-outlook guidance telemetry

### Assistant summary (exact)
Implemented the next safe high-impact readability pass: level-select telemetry now includes a mission-outlook guidance line (`Outlook Stable/Shaky/Fragile/Critical`) that combines retry-pressure and mastery momentum into a quick "what to do next" cue, helping players decide whether to push PBs or stabilize consistency. Verified with `npm run build`.

### Technical details
- Added derived pressure label normalization (`Low/Medium/High/Extreme`) to reuse in telemetry composition.
- Added a new derived outlook readout in `updateUi()`:
  - `Outlook Fresh (seed baseline run)` when no attempts exist.
  - `Outlook Breakthrough (land first clear)` when attempts exist but no clears.
  - `Outlook Stable/Shaky/Fragile/Critical` after first clear, with momentum + action cue based on mastery score and retry pressure.
- Extended level-select telemetry line to display `Outlook ...` beside `Pressure ...` and existing mastery/readability metrics.
- Updated task registry with `gdev-0042` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0041 mission-pressure telemetry

### Assistant summary (exact)
Implemented the next safe high-impact readability pass: level-select telemetry now includes mission-pressure classification (`Pressure Low/Medium/High/Extreme`) derived from retries-per-clear, giving players an at-a-glance difficulty/consistency signal without save-schema changes. Verified with `npm run build`.

### Technical details
- Added derived mission-pressure readout in `updateUi()`:
  - `Pressure --` when no attempts exist.
  - `Pressure Extreme (no clears yet)` when attempts exist but no clears.
  - `Pressure Low/Medium/High/Extreme` bands from retries-per-clear for cleared missions.
- Extended level-select telemetry line to show `Pressure ...` directly beside `Retries` and existing mastery/readability metrics.
- Updated task registry with `gdev-0041` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0040 retry-load telemetry

### Assistant summary (exact)
Implemented the next safe high-impact readability pass: level-select telemetry now includes retry-load insight (`Retries n` plus retries-per-clear) so players can quickly gauge mission consistency and grind pressure without save-schema changes. Verified with `npm run build`.

### Technical details
- Added derived retry telemetry in `updateUi()`:
  - `levelRetries = max(0, attempts - clears)`
  - retries-per-clear readout when clears exist (`n.n/clear`)
  - fallback states for no attempts (`Retries --`) and no clears yet (`seeking first clear`)
- Extended level-select telemetry line to include `Retries` directly after record/clear-rate metrics.
- Updated task registry with `gdev-0040` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0039 mastery caps telemetry

### Assistant summary (exact)
Implemented the next safe high-impact readability pass: level-select mastery telemetry now includes a `Caps x/5` readout showing how many mastery metrics are fully maxed (clear, first-try, clean, relic, S-dock), so players can immediately see completion depth at a glance without save-schema changes. Verified with `npm run build`.

### Technical details
- Added derived mastery cap counter in `updateUi()` by counting mastery metric rates at `100%`.
- Added `Caps 0/5` fallback for unrated missions.
- Extended level-select telemetry line to show `Caps x/5` beside existing mastery mix/focus readouts.
- Updated task registry with `gdev-0039` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0038 mastery weighted-component breakdown telemetry

### Assistant summary (exact)
Implemented the next safe high-impact readability pass: level-select mastery telemetry now includes a weighted component breakdown (`Mix C/F/N/R/S`) so players can see exactly where their mastery score is coming from (clear, first-try, clean, relic, and S-dock performance) without changing save data. Verified with `npm run build`.

### Technical details
- Added derived mastery contribution points in `updateUi()`:
  - `C` clear-rate contribution (0-35)
  - `F` first-try contribution (0-20)
  - `N` clean-clear contribution (0-20)
  - `R` relic contribution (0-10)
  - `S` S-dock contribution (0-15)
- Switched mastery score computation to explicit weighted point summation for readability/traceability.
- Extended level-select telemetry with `Mix C#/F#/N#/R#/S#` directly beside existing mastery tier/tier-gap/focus readouts.
- Updated task registry with `gdev-0038` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0037 mastery tier-gap telemetry

### Assistant summary (exact)
Implemented the next safe high-impact readability pass: level-select mastery telemetry now includes progress-to-next-tier (`+N to Silver/Gold/Ace`) so players can see exactly how far they are from tier promotion without changing save data. Verified with `npm run build`.

### Technical details
- Added derived mastery progression readout in `updateUi()` by mapping current mastery tier to the next tier threshold and computing a score gap.
- Added fallback messaging:
  - `Need first clear` when a mission is still unrated.
  - `Ace cap` when the mission is already at top tier.
- Extended level-select telemetry to show `Mastery <Tier> (<Score>, <tier-gap>)`.
- Updated task registry with `gdev-0037` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0036 level mastery focus recommendation

### Assistant summary (exact)
Implemented the next safe high-impact readability pass: level-select telemetry now highlights the weakest mastery metric for the selected mission (clear rate, first-try, clean, relic, or S-dock) so players get an immediate “what to improve next” cue without changing save schema. Verified with `npm run build`.

### Technical details
- Added derived mastery-focus analysis in `updateUi()` by evaluating the five existing mastery metric rates and selecting the lowest-value area.
- Added fallback messaging:
  - `Complete first clear to seed mastery telemetry` when a mission has no clears yet.
  - `All metrics capped — push speed PBs` when all tracked mastery rates are maxed.
- Extended level-select telemetry with `Next <focus>` readout directly after mastery tier/score.
- Updated task registry with `gdev-0036` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0035 level mastery tier + score telemetry

### Assistant summary (exact)
Implemented the next safe high-impact readability pass: level select now computes a single mission mastery rollup (`Bronze`→`Ace`) from existing performance metrics (clear rate, first-try, clean clears, relic clears, and S-dock clears) and shows both tier + score without changing save schema. Verified with `npm run build`.

### Technical details
- Added derived per-level metric values in `updateUi()` (`levelClearRateValue`, `levelFirstTryRateValue`, `levelCleanRateValue`, `levelRelicRateValue`, `levelSDockRateValue`).
- Added weighted mastery score computation (0–100):
  - clear rate 35%
  - first-try rate 20%
  - clean-clear rate 20%
  - relic completion rate 10%
  - S-dock rate 15%
- Added mastery tier mapping:
  - `Ace` (>=90)
  - `Gold` (>=75)
  - `Silver` (>=55)
  - `Bronze` (<55 with clears)
  - `Unrated` (no clears)
- Updated level-select telemetry line with `Mastery <Tier> (<Score>)`.
- Updated task registry for `gdev-0035` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0034 S-grade dock persistence + telemetry pass

### Assistant summary (exact)
Implemented the next safe mastery-feedback pass: per-level S-grade docking clears now persist (save schema v12), and level-select telemetry now shows each mission’s S-dock completion rate for clearer precision-mastery tracking. Verified with `npm run build`.

### Technical details
- Bumped save schema version to `v12`.
- Extended `SaveData` with `sDockLevelClears` and added backward-safe migration/default handling.
- On mission completion, now increments per-level `sDockLevelClears` when docking grade is `S`.
- Added level-select telemetry readout: `S Dock x/y (z%)` per level.
- Updated task registry for `gdev-0034` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0033 relic-objective persistence + telemetry pass

### Assistant summary (exact)
Implemented the next safe mastery-feedback pass: per-level relic side-objective completions now persist (save schema v11), level-select telemetry now shows relic completion rate per mission, and relic completion progress now survives restarts. Verified with `npm run build`.

### Technical details
- Bumped save schema version to `v11`.
- Extended `SaveData` with `relicLevelCompletions` and added backward-safe migration/default handling.
- On mission completion, now increments per-level relic completion count when the optional cyan relic objective was collected.
- Added level-select telemetry readout: `Relic x/y (z%)` per level.
- Updated task registry for `gdev-0033` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0032 first-try clear persistence + telemetry pass

### Assistant summary (exact)
Implemented the next safe mastery-feedback task: per-level first-try clears now persist (save schema v10), level-select telemetry now surfaces first-try clear rate, and mission-complete breakdowns now call out first-try clear progress. Verified with `npm run build`.

### Technical details
- Bumped save schema version to `v10`.
- Extended `SaveData` with `firstTryLevelClears` and added backward-safe migration/default handling.
- On mission completion, now increments per-level first-try clear count when the level is cleared without any prior failed attempts on that mission (`missionFailuresOnLevel === 0`).
- Added level-select telemetry readout: `First Try x/y (z%)` per level.
- Added mission-complete breakdown callout: `first-try clears x/y` when applicable.
- Updated task registry for `gdev-0032` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0030 lifetime pilot telemetry pass

### Assistant summary (exact)
Implemented the next safe progression-readability task: level-select telemetry now includes lifetime clears/attempts with overall clear rate plus a fastest-level spotlight (best recorded mission time across all levels), and build verification passed.

### Technical details
- Extended level-select telemetry in `src/main.ts` to compute and render:
  - lifetime attempts/clears aggregate
  - lifetime clear-rate percentage
  - fastest recorded level/time spotlight (`L# m:ss.cc`)
- Kept changes backward-safe by deriving metrics from existing persisted arrays (`levelAttempts`, `levelClears`, `bestLevelTimesMs`) with no save-schema bump.
- Updated task registry for `gdev-0030` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0029 lifetime best-streak persistence

### Assistant summary (exact)
Implemented the next safe progression-feedback pass: mission clear streaks now persist a lifetime **best streak** record (save schema v8), level select now surfaces that best-streak telemetry, and mission-complete breakdown now calls out when a new best streak is set. Verified with `npm run build`.

### Technical details
- Bumped save schema version to `v8`.
- Extended `SaveData` with `bestStreak` and added backward-safe migration/default handling.
- On level completion, now updates and persists lifetime `bestStreak` when current streak exceeds prior record.
- Added mission-complete breakdown callout when a new best streak is achieved.
- Added `Best Streak` telemetry to level-select readout.
- Updated task registry for `gdev-0029` completion.
- Build verification: `npm run build` (pass).

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

## 2026-03-03 — mission loop direction update

### Assistant summary (exact)
This is actually a pretty good start. The game loop will be land, exit lander, run right to steal the egg, run back to lander, take off and then on a seperate screen land at the delivery base, then then we would likely have some sort of level select, then the loop starts over. The delivery base might be an orbital base like a space station with almost no gravity and the goal is instead presice docking. So the loop is land on planet, get egg, get back to lander to take off, then dock with orbital space station.

### Technical details
- Updated `PRD.md` with a formal mission loop section and revised MVP criteria.
- Added orbital near-zero-gravity docking objective as a core loop requirement.

## 2026-03-03 — gdev-0002 canonical mission loop implementation pass

### Assistant summary (exact)
Implemented the confirmed canonical mission loop end-to-end in gameplay: level-select into mission, planetary landing, on-foot egg theft and return, relaunch, separate near-zero-gravity orbital docking screen with stricter alignment/speed checks, then level-complete transition back to next-level or level-select; kept progression persistence hooks intact and verified `npm run build` passes.

### Technical details
- Rebuilt `src/main.ts` around a lightweight mission state machine (`level-select`, `planet-brief`, `planet-flying`, `on-foot`, `takeoff`, `orbital-docking`, `level-complete`, `crashed`).
- Added on-foot character phase with direct left/right movement, egg pickup trigger, and return-to-lander boarding objective gating takeoff.
- Added distinct orbital delivery screen/layer with near-zero-G tuning and tighter docking requirement (radius + speed + upright alignment).
- Added level-complete controls for `N` next level and `L` level select, preserving reset semantics via `R` new session.
- Preserved and reused persistence/progression schema (`version`, unlocked/highest/best, powerup unlock scaffold).
- Task ID: `gdev-0002` (single-agent implementation; no delegation).
- Build verification: `npm run build` (pass).
- Commit: `06df680` — `gdev-0001: implement canonical mission loop with orbital docking`.

## 2026-03-03 — gdev-0003 loadout selection + level gate pass

### Assistant summary (exact)
Done — I implemented the next loop block directly: level-select now supports powerup loadout cycling, Level 3 is now powerup-gated, and the powerup effects pass is expanded (`fuel-gel` efficiency + `shielded-hull` forgiveness), with build verification passing.

### Technical details
- Added level-select loadout controls: `A / D` cycles selected powerup from unlocked set (including None).
- Added explicit level requirement metadata (`requiredPowerup`) and enforced launch gating in mission start.
- Set Level 3 to require `Stability Thrusters` unlock.
- Expanded powerup effects:
  - `fuel-gel`: reduced fuel burn multiplier.
  - `shielded-hull`: modestly widened safe landing envelope.
- Updated HUD/level text to display level requirements and selected loadout context.
- Build verification: `npm run build` (pass).

## 2026-03-03 — gdev-0004 spear boss + Patapon visual pass

### Assistant summary (exact)
Done — I added spear-throw boss combat to the on-foot phase and shipped another Patapon-style visual pass (bold silhouette motifs + cleaner layered colors), while keeping controls simple and arcade-focused.

### Technical details
- Added on-foot spear throw (`Space`) with lightweight projectile logic.
- Added boss encounter stub (levels 2+) that must be defeated before egg pickup.
- Added boss HP loop and collision handling for spear hits.
- Updated on-foot objectives/HUD hints to guide boss flow.
- Added stronger Patapon-like visual motifs (high-contrast eye totem + simplified silhouette layering).
- Build verification: `npm run build` (pass).

## 2026-03-03 — gdev-0005 boss telegraph + dodge pass

### Assistant summary (exact)
Continuing — I implemented the next combat block: bosses now fire telegraphed projectiles in the on-foot phase, the player has HP and can fail from hits, and spear combat now has real dodge pressure while keeping the same arcade simplicity.

### Technical details
- Added boss ranged attack loop with visible shot telegraph cadence.
- Added boss projectile entities and collision checks against runner.
- Added player HP (3) for on-foot phase and fail condition on depletion.
- Added cleanup/reset handling for boss projectiles across mission transitions.
- Updated HUD to show HP during loop.
- Build verification: `npm run build` (pass).

## 2026-03-03 — gdev-0006 local refresh runner script

### Assistant summary (exact)
Done — I added a single script so you can refresh and run the game with one command: `./refresh-local-game.sh`.

### Technical details
- Added `refresh-local-game.sh` at repo root.
- Script now runs: `git pull --ff-only`, `npm install --include=dev`, kills existing process on port 5173 when detectable, then starts `npm run dev -- --host 0.0.0.0 --port 5173`.
- Marked script executable.
- Updated `README.md` with usage instructions.

## 2026-03-03 — gdev-0007 boss pattern variation + docking polish

### Assistant summary (exact)
Continuing — I shipped the next block: boss encounters now scale with level via faster cadence and multi-shot patterns, and orbital docking has clearer visual/UX guidance with live distance/speed/alignment feedback for precision docking.

### Technical details
- Boss combat now varies by level:
  - higher levels fire more frequently
  - level 3 adds a secondary angled projectile pattern
- Boss projectiles now support vertical drift for less predictable dodging.
- Orbital docking received visual polish:
  - pulsing target ring and guide ring
  - live HUD hint showing docking distance, speed threshold, and alignment state
- Build verification: `npm run build` (pass).

## 2026-03-03 — gdev-0008 global egg-refresh command

### Assistant summary (exact)
Love it — I added `egg-refresh` support so you can run one command from anywhere after a one-time install.

### Technical details
- Added `install-egg-refresh.sh` to install a symlinked global command at `~/.local/bin/egg-refresh`.
- Updated `README.md` with one-time install and PATH fallback instructions.
- Existing `refresh-local-game.sh` remains the source runner.

## 2026-03-03 — gdev-0009 egg-refresh symlink fix

### Assistant summary (exact)
Good catch — I fixed `egg-refresh` so it works when run from the global symlink (`~/.local/bin/egg-refresh`) by resolving the real script path before cd/git commands.

### Technical details
- Updated `refresh-local-game.sh` to resolve symlink chains and derive the real repo path.
- This fixes `fatal: not a git repository` when launching `egg-refresh` via global PATH alias.

## 2026-03-03 — gdev-0010 first asset integration (runner sheet)

### Assistant summary (exact)
Confirmed — I integrated your first runner character sheet into gameplay and replaced the placeholder on-foot block with sprite-driven idle/run/throw animations.

### Technical details
- Added asset: `public/assets/runner_sheet_v1.png`.
- Added Phaser preload + animation clips (`runner-idle`, `runner-run`, `runner-throw`).
- Replaced on-foot placeholder rectangle with animated sprite.
- Hooked movement direction to sprite flip and throw action to spear timing.
- Build verification: `npm run build` (pass).

## 2026-03-03 — gdev-0011 remote validation + docs update

### Assistant summary (exact)
Validated with git: canonical remote `https://github.com/shawnmacewen/egg-lander.git` is reachable and legacy `OddEye-Agent/egg-lander` is not found; updated project docs to mark `shawnmacewen` as canonical.

### Technical details
- Verified with `git ls-remote`:
  - `shawnmacewen/egg-lander` reachable
  - `OddEye-Agent/egg-lander` not found
- Updated `README.md` with canonical remote section.

## 2026-03-09 — gdev-0012 optional relic side objective

### Assistant summary (exact)
Implemented the next highest-impact gameplay slice: added a Stability Thrusters-gated optional on-foot relic objective that awards a +250 docking bonus, integrated objective/hint/UI messaging for the side route, and verified the game still builds cleanly.

### Technical details
- Added a cyan relic pickup during on-foot phase when `Stability Thrusters` loadout is selected.
- Added side-objective state tracking (`bonusObjectiveActive`, `bonusObjectiveCollected`) and a +250 score bonus applied on mission completion.
- Updated objective text/hints/status copy to surface optional objective flow without interrupting the core mission loop.
- Updated task registry with `gdev-0012` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0013 mission phase tracker + HUD readability

### Assistant summary (exact)
Implemented a mission readability polish pass: added a live phase-progress tracker across the full loop, clarified HUD health display so HP only shows during active boss combat, and kept objective callouts in sync with mission state. Verified with a clean production build.

### Technical details
- Added a dedicated phase line in HUD with explicit mission-step mapping (`0/5` setup through `5/5` orbital docking, plus complete/fail states).
- Added `getPhaseGuide()` and wired it into `updateUi()` so phase messaging updates in real time.
- Improved HUD readability by replacing always-on HP with contextual display (`-` when boss combat is not active).
- Adjusted HUD text layout to fit objective + phase + hint lines cleanly.
- Updated task registry with `gdev-0013` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0014 on-foot damage fairness + hit feedback

### Assistant summary (exact)
Implemented the next gameplay quality pass: added short post-hit invulnerability frames during on-foot boss combat, visual damage blink feedback on the runner, and HUD invulnerability indicator so damage feels fair and readable under projectile pressure. Verified with a clean production build.

### Technical details
- Added `playerInvulnerableUntil` timing state for on-foot combat.
- Applied a ~900ms invulnerability window after taking boss-shot damage to prevent instant multi-hit HP deletion.
- Added runner tint blink during invulnerability for immediate visual feedback.
- Updated HUD HP readout to show temporary invulnerability state (`HP X (i)`) during active boss fights.
- Cleared combat tint/invulnerability state when resetting/re-entering mission phases.
- Updated task registry with `gdev-0014` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0015 on-foot combat HUD telemetry

### Assistant summary (exact)
Implemented the next readability-focused combat pass: added live boss HP telemetry and spear cooldown readiness to the HUD during on-foot encounters so players can better pace attacks under projectile pressure, while keeping existing controls and balance unchanged. Verified with a clean production build.

### Technical details
- Added contextual HUD readouts for:
  - `Boss X/3` during active on-foot boss encounters.
  - `Spear ready` / remaining cooldown in milliseconds during on-foot phases.
- Kept readouts hidden (`-`) outside relevant phases to reduce HUD noise.
- Updated task registry with `gdev-0015` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0016 boss shot telegraph + incoming-fire HUD timer

### Assistant summary (exact)
Implemented the next combat readability/juice pass: added a pre-fire boss telegraph ring that briefly tracks the player before shots launch, plus a live HUD timer for incoming boss fire cadence so dodge timing is easier to parse under pressure. Verified with a clean production build.

### Technical details
- Added an on-foot pre-fire telegraph ring that appears shortly before boss volleys and pulses near the runner position.
- Hid telegraph cleanly on boss defeat and phase resets.
- Added contextual HUD readout for boss-shot cadence (`BossShot`) showing milliseconds until fire / firing state.
- Updated task registry with `gdev-0016` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0017 orbital docking vector guidance + HUD telemetry

### Assistant summary (exact)
Implemented the next highest-impact docking readability pass: added live orbital approach/velocity vector guides and contextual docking telemetry in HUD so players can better judge closing angle and speed before contact. Verified with a clean production build.

### Technical details
- Added two live orbital guidance lines during docking:
  - approach line from ship to docking ring center
  - velocity vector line showing immediate motion direction/magnitude
- Added state-aware color feedback (green when aligned/safe speed, amber otherwise).
- Added HUD `Dock` readout (`distance/radius @ speed/safeSpeed`) during orbital phase.
- Ensured docking guide lines hide cleanly on phase resets, failures, and level completion.
- Updated task registry with `gdev-0017` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0018 powerup gameplay identity pass

### Assistant summary (exact)
Implemented the next highest-impact progression pass by making all currently unlockable powerups meaningfully functional and readable in play: Shielded Hull now grants +1 on-foot HP and longer post-hit invulnerability, Fuel Gel now starts runs with extra fuel, and HUD/level-select text now surfaces active perk behavior clearly. Verified with a clean production build.

### Technical details
- Added powerup metadata descriptions and surfaced active perk description in level readout.
- Implemented Shielded Hull gameplay effect:
  - +1 on-foot HP (4 total)
  - longer damage invulnerability window after boss hits.
- Implemented Fuel Gel gameplay effect:
  - increased mission fuel tank from 100 to 120
  - existing reduced thrust burn remains active.
- Updated HUD fuel display from percent to explicit `current/max` for readability.
- Updated task registry with `gdev-0018` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0019 orbital docking grade + precision bonus scoring

### Assistant summary (exact)
Implemented the next highest-impact scoring/readability pass: successful orbital docks now award a visible letter grade (S/A/B/C) plus a precision bonus based on docking distance and approach speed, and the post-dock summary/HUD now surfaces that grade for clearer performance feedback. Verified with a clean production build.

### Technical details
- Updated docking completion path to pass live docking metrics into score resolution.
- Added weighted precision scoring (distance + speed) with up to +120 docking bonus.
- Added dock letter-grade thresholds and persistent per-clear `lastDockGrade` HUD readout during level-complete state.
- Updated completion status text with score breakdown (`grade`, `dock bonus`, optional relic bonus).
- Updated task registry with `gdev-0019` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0020 mission completion performance bonuses

### Assistant summary (exact)
Implemented the next highest-impact replay-feedback pass: mission clears now award a first-try bonus and a clean-fight bonus (no on-foot damage in boss levels), and the docking completion breakdown now clearly surfaces these bonuses for stronger performance-driven runs. Verified with a clean production build.

### Technical details
- Added per-level mission failure tracking to detect first-try clears (`+100`).
- Added per-attempt on-foot damage tracking to award clean-fight clears on boss levels (`+150`).
- Wired new bonuses into mission completion score resolution and post-dock breakdown text.
- Ensured tracking resets correctly across retries, level-select returns, and new sessions.
- Updated task registry with `gdev-0020` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0021 mission-clear streak bonus + HUD streak telemetry

### Assistant summary (exact)
Implemented the next highest-impact replay loop polish: added a consecutive mission-clear streak system that awards escalating score bonuses for back-to-back clears without failures, resets streak on mission fail/new session, and surfaces live streak count in HUD plus completion breakdown text. Verified with a clean production build.

### Technical details
- Added session-scoped clear streak tracking (`clearStreak`) to the mission scene.
- Added escalating streak bonus on level completion (`+75` per consecutive clear after the first, capped at `+225`).
- Reset streak on mission failure and on explicit new-session reset.
- Added live `Streak` telemetry to the HUD and bonus-line messaging in dock completion breakdown.
- Updated task registry with `gdev-0021` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0022 level 4 challenge expansion

### Assistant summary (exact)
Added a new late-game mission, **Level 4: Storm Cradle**, with tighter landing/docking tolerances and higher score value, gated by **Shielded Hull** to extend progression depth and give the loadout system another meaningful checkpoint. Verified with `npm run build`.

### Technical details
- Extended `LEVELS` in `src/main.ts` with a fourth mission (`id: 4`, `Storm Cradle`).
- Tuned level 4 parameters for a meaningful difficulty step-up:
  - higher gravity/fuel pressure
  - narrower landing pad and stricter safe landing thresholds
  - tighter orbital docking radius/safe speed
  - increased completion score reward
- Added gate requirement for level 4: `requiredPowerup: 'shielded-hull'`.
- Updated task registry in `TASKS.md` with `gdev-0022` marked completed.

## 2026-03-09 — gdev-0023 level-driven boss scaling pass

### Assistant summary (exact)
Implemented the next gameplay-depth pass by moving boss encounter tuning into per-level config: boss HP, fire cadence, telegraph window, and spread-shot behavior now scale by mission, improving difficulty ramp readability and making Level 4 on-foot combat meaningfully tougher than earlier fights. Verified with a clean production build.

### Technical details
- Extended `LevelConfig` with boss profile fields:
  - `bossHp`
  - `bossFireCadenceMs`
  - `bossTelegraphMs`
  - `bossSpreadShot`
- Added level-specific boss profiles for all four levels (level 1: no boss, levels 2-4 escalating pressure).
- Updated on-foot phase initialization to enable boss encounters based on config (`bossHp > 0`) instead of hardcoded level id checks.
- Updated boss combat loop to consume level-configured cadence/telegraph windows and optional spread-shot pattern.
- Updated HUD boss telemetry to display dynamic HP denominator and cadence from level config.
- Updated task registry in `TASKS.md` with `gdev-0023` marked completed.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0024 save migration hardening + lifetime clears

### Assistant summary (exact)
Implemented a safe persistence pass: upgraded save schema handling with explicit migration/sanitization for older data and added lifetime mission-clear telemetry to the HUD/save data so long-term progression survives sessions more reliably. Verified with `npm run build`.

### Technical details
- Bumped save schema version from `2` to `3`.
- Added `totalClears` to persisted `SaveData` and increment it on every successful level completion.
- Added `migrateParsedSave()` to sanitize legacy/partial saves into a stable v3 shape.
- Guarded invalid `selectedPowerup` states by clearing selection if the selected perk is not in unlocked perks.
- Surfaced lifetime clear count directly in the HUD alongside score/attempts/streak.
- Updated task registry with `gdev-0024` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0025 per-level dock PB persistence + level-select telemetry

### Assistant summary (exact)
Implemented the next safe progression-readability pass: docking grades are now persisted per level as personal bests, level select now surfaces each mission’s best dock grade, and level-complete feedback now calls out when a new dock-grade PB is set. Verified with a clean production build.

### Technical details
- Extended save schema to v4 with `bestDockGrades` (one slot per level).
- Added migration/sanitization for legacy saves so missing/invalid grade entries safely default to `-`.
- Added dock-grade ordering and update logic so only improved grades overwrite saved bests.
- Updated level-select telemetry to show selected mission `Best Dock` grade.
- Added completion breakdown line when a new per-level dock PB is achieved.
- Updated task registry with `gdev-0025` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0026 per-level best run score persistence

### Assistant summary (exact)
Added per-level best run score persistence (save schema v5), surfaced Best Run telemetry in level select, and included new-PB level score callouts on mission completion. Verified `npm run build` passes.

### Technical details
- Updated save schema to v5 in `src/main.ts` with `bestLevelScores: number[]` and backward-safe migration/default handling.
- On level completion, now tracks and persists new personal best level-run score (`gained`) per level.
- Level select HUD now shows `Best Run` for the currently selected level alongside `Best Dock`.
- Mission completion breakdown now includes `new PB level score` callout when beaten.
- Updated `TASKS.md`, `CHANGELOG.md`, `PROJECT_LOG.md`.

## 2026-03-09 — gdev-0027 best-time telemetry pass

### Assistant summary (exact)
Implemented per-level mission time persistence with save-schema migration, added live run timer telemetry to the HUD, surfaced per-level Best Time in level select, and added mission-complete PB time callouts. Verified with `npm run build`.

### Technical details
- Bumped save schema to `v6` and added `bestLevelTimesMs` per-level persistence with safe migration defaults.
- Added mission timer tracking from launch (`planet-flying` start) through dock completion.
- Added HUD `Time` readout for active runs and `Best Time` readout in level telemetry.
- Added completion breakdown time messaging (including new PB time deltas).
- Updated task registry for `gdev-0027` completion.

## 2026-03-09 — gdev-0028 per-level clear-rate telemetry pass

### Assistant summary (exact)
Implemented the next safe progression telemetry pass: per-level attempts and clears now persist in save data, level select now shows each mission record and clear rate, and schema migration remains backward-safe for existing players. Verified with `npm run build`.

### Technical details
- Bumped save schema to `v7` and added per-level arrays: `levelAttempts` and `levelClears`.
- Added migration defaults/sanitization for legacy saves missing the new fields.
- On mission fail, per-level attempts now persist immediately.
- On mission complete, both per-level attempts and clears increment and persist.
- Added level-select telemetry: `Record clears/attempts (rate%)` for the selected mission.
- Updated task registry for `gdev-0028` completion.

## 2026-03-09 — gdev-0031 clean-clear telemetry persistence pass

### Assistant summary (exact)
Added per-level clean-clear persistence with backward-safe save migration, surfaced clean-rate telemetry in level select, and added mission-complete clean-clear progress callouts when a no-hit clear is achieved. Verified with `npm run build`.

### Technical details
- Bumped save schema to `v9` and added `cleanLevelClears: number[]` to persisted save data.
- Added migration/sanitization defaults for legacy saves missing `cleanLevelClears`.
- On level completion, now tracks a clean clear (levels 2+) when the run finishes without on-foot damage.
- Updated level-select telemetry with `Clean x/y (rate%)` using per-level clean clears vs clears.
- Added completion breakdown line showing updated clean-clear progress after clean clears.
- Updated task registry for `gdev-0031` completion.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0065 mission warmup telemetry

### Assistant summary (exact)
Added a level-select `Warmup` telemetry cue that prescribes a small pre-launch rep plan based on current mission state (seed/breakthrough/push/bank/recover/hold) so players can stabilize execution before committing to a run. Verified with `npm run build`.

### Technical details
- Added `missionWarmupReadout` derivation in `src/main.ts` using existing commitment and progression signals.
- Integrated `Warmup ...` cue into the level-select HUD telemetry line next to launch-check guidance.
- Updated task registry in `TASKS.md` with `gdev-0065` marked completed.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0070 mission focus telemetry

### Assistant summary (exact)
Added a level-select `Focus` telemetry cue that surfaces one highest-priority action for the next run block (baseline, first clear, pressure recovery, or weakest-metric improvement) so players can act on a single clear objective instead of scanning the full guidance stack. Verified with `npm run build`.

### Technical details
- Added `missionFocusReadout` derivation in `src/main.ts`, keyed off early-run state (`attempts/clears`), commitment state (`Recover`), and weakest mastery metric.
- Integrated `Focus ...` into the level-select telemetry line immediately after `Session Goal`.
- Updated task registry in `TASKS.md` with `gdev-0070` marked completed.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0071 mission loadout telemetry

### Assistant summary (exact)
Added a level-select `Loadout Hint` telemetry cue that recommends a perk setup for the next run block based on first-clear/recovery state and weakest mastery metric, so players can choose safer or more targeted loadouts before launch. Verified with `npm run build`.

### Technical details
- Added `missionLoadoutReadout` derivation in `src/main.ts` using unlocked powerup state, commitment/recovery status, and weakest mastery focus area.
- Integrated `Loadout Hint ...` into the level-select HUD telemetry line immediately after `Focus` and before coaching copy.
- Updated task registry in `TASKS.md` with `gdev-0071` marked completed.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0074 mission command telemetry

### Assistant summary (exact)
Added a level-select `Command` telemetry cue that compresses the current run plan into one actionable line (what to do now + when to stop), reducing guidance overload right before launch. Verified with `npm run build`.

### Technical details
- Added `missionCommandReadout` derivation in `src/main.ts` from current progression state (`attempts/clears`) and mission commitment state (`Push/Bank/Recover/Hold`).
- Integrated `Command ...` into the level-select telemetry line immediately after `Loadout Hint` and before coaching copy.
- Updated task registry in `TASKS.md` with `gdev-0074` marked completed.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0075 mission checkpoint telemetry

### Assistant summary (exact)
Added a level-select `Checkpoint` telemetry cue that asks one block-closing validation question keyed to current commitment state, helping players verify whether to stop or continue before launching another run. Verified with `npm run build`.

### Technical details
- Added `missionCheckpointReadout` derivation in `src/main.ts`, branching across baseline/first-clear/push/bank/recover/hold states.
- Integrated `Checkpoint ...` into the level-select telemetry line immediately after `Command`.
- Updated task registry in `TASKS.md` with `gdev-0075` marked completed.
- Build verification: `npm run build` (pass).
## 2026-03-09 — gdev-0076 mission go-signal telemetry

### Assistant summary (exact)
Added a level-select `Go Signal` telemetry cue that clearly marks whether the next launch block is green-lighted for baseline/first-clear, clean banking, or a single PB shot (and when to stay yellow). Verified with `npm run build`.

### Technical details
- Added `missionGoSignalReadout` derivation in `src/main.ts`, keyed to baseline/first-clear state plus commitment and push-window signals.
- Integrated `Go Signal ...` into the level-select telemetry line immediately after `Checkpoint`.
- Updated task registry in `TASKS.md` with `gdev-0076` marked completed.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0079 mission stability telemetry

### Assistant summary (exact)
Added a level-select `Stability` telemetry cue that tells players when to spend or protect execution consistency based on mission commitment/window state, so PB attempts stay disciplined and recovery blocks stay controlled. Verified with `npm run build`.

### Technical details
- Added `missionStabilityReadout` derivation in `src/main.ts`, branching across baseline/first-clear/push/bank/recover/hold states and push-window availability.
- Integrated `Stability ...` into the level-select telemetry line immediately after `Priority`.
- Updated task registry in `TASKS.md` with `gdev-0079` marked completed.
- Build verification: `npm run build` (pass).

## 2026-03-09 — gdev-0084 compact level-select telemetry mode

### Assistant summary (exact)
Added a compact level-select telemetry mode tied to the existing `H` HUD toggle so players can quickly read high-signal mission context without the full guidance wall, while keeping full telemetry available on demand. Verified with `npm run build`.

### Technical details
- Split level-select telemetry output into two variants in `src/main.ts`:
  - `conciseLevelTelemetry` for compact HUD mode with essential mission-readiness signals.
  - `fullLevelTelemetry` preserving the complete guidance stack.
- Switched `levelText` assignment to respect `this.isHudCompact`, so `H` now controls both top HUD density and level-select telemetry density.
- Updated task registry in `TASKS.md` with `gdev-0084` marked completed.
- Build verification: `npm run build` (pass).

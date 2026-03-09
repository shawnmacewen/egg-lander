import './style.css'
import Phaser from 'phaser'

type PowerupId = 'stability-thrusters' | 'shielded-hull' | 'fuel-gel'

type MissionPhase =
  | 'level-select'
  | 'planet-brief'
  | 'planet-flying'
  | 'on-foot'
  | 'takeoff'
  | 'orbital-docking'
  | 'level-complete'
  | 'crashed'

type LevelConfig = {
  id: number
  name: string
  gravity: number
  thrust: number
  padWidth: number
  fuelBurnPerSecond: number
  safeVertical: number
  safeHorizontal: number
  safeAngle: number
  runDistance: number
  orbitalGravity: number
  orbitalThrust: number
  orbitalDockRadius: number
  orbitalSafeSpeed: number
  completionScore: number
  bossHp: number
  bossFireCadenceMs: number
  bossTelegraphMs: number
  bossSpreadShot: boolean
  requiredPowerup?: PowerupId
}

type SaveData = {
  version: number
  unlockedLevel: number
  highestLevelReached: number
  bestScore: number
  totalClears: number
  bestStreak: number
  bestDockGrades: string[]
  bestLevelScores: number[]
  bestLevelTimesMs: number[]
  levelAttempts: number[]
  levelClears: number[]
  cleanLevelClears: number[]
  firstTryLevelClears: number[]
  relicLevelCompletions: number[]
  sDockLevelClears: number[]
  unlockedPowerups: PowerupId[]
  selectedPowerup: PowerupId | null
}

type PowerupMeta = {
  name: string
  unlockLevel: number
  functional: boolean
  description: string
}

const SAVE_VERSION = 12
const SAVE_KEY = 'egg-lander-save'

const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Warmup Delivery',
    gravity: 240,
    thrust: 430,
    padWidth: 180,
    fuelBurnPerSecond: 18,
    safeVertical: 118,
    safeHorizontal: 84,
    safeAngle: 0.67,
    runDistance: 260,
    orbitalGravity: 22,
    orbitalThrust: 225,
    orbitalDockRadius: 48,
    orbitalSafeSpeed: 80,
    completionScore: 900,
    bossHp: 0,
    bossFireCadenceMs: 1100,
    bossTelegraphMs: 280,
    bossSpreadShot: false
  },
  {
    id: 2,
    name: 'Crosswind Heist',
    gravity: 285,
    thrust: 448,
    padWidth: 148,
    fuelBurnPerSecond: 23,
    safeVertical: 106,
    safeHorizontal: 74,
    safeAngle: 0.6,
    runDistance: 310,
    orbitalGravity: 28,
    orbitalThrust: 235,
    orbitalDockRadius: 42,
    orbitalSafeSpeed: 70,
    completionScore: 1300,
    bossHp: 3,
    bossFireCadenceMs: 940,
    bossTelegraphMs: 260,
    bossSpreadShot: false
  },
  {
    id: 3,
    name: 'Tight Delivery',
    gravity: 330,
    thrust: 465,
    padWidth: 120,
    fuelBurnPerSecond: 28,
    safeVertical: 94,
    safeHorizontal: 64,
    safeAngle: 0.55,
    runDistance: 350,
    orbitalGravity: 35,
    orbitalThrust: 245,
    orbitalDockRadius: 36,
    orbitalSafeSpeed: 62,
    completionScore: 1800,
    bossHp: 4,
    bossFireCadenceMs: 710,
    bossTelegraphMs: 245,
    bossSpreadShot: true,
    requiredPowerup: 'stability-thrusters'
  },
  {
    id: 4,
    name: 'Storm Cradle',
    gravity: 368,
    thrust: 478,
    padWidth: 108,
    fuelBurnPerSecond: 31,
    safeVertical: 86,
    safeHorizontal: 58,
    safeAngle: 0.5,
    runDistance: 390,
    orbitalGravity: 42,
    orbitalThrust: 252,
    orbitalDockRadius: 32,
    orbitalSafeSpeed: 56,
    completionScore: 2300,
    bossHp: 5,
    bossFireCadenceMs: 640,
    bossTelegraphMs: 220,
    bossSpreadShot: true,
    requiredPowerup: 'shielded-hull'
  }
]

const DOCK_GRADE_ORDER = ['-', 'C', 'B', 'A', 'S'] as const

const POWERUPS: Record<PowerupId, PowerupMeta> = {
  'stability-thrusters': {
    name: 'Stability Thrusters',
    unlockLevel: 2,
    functional: true,
    description: 'Dampens lateral drift/rotation and enables relic side objective.'
  },
  'shielded-hull': {
    name: 'Shielded Hull',
    unlockLevel: 3,
    functional: true,
    description: 'Adds +1 HP and extends invulnerability after on-foot hits.'
  },
  'fuel-gel': {
    name: 'Fuel Gel',
    unlockLevel: 3,
    functional: true,
    description: 'Starts with 120 fuel and burns less during thrust.'
  }
}

class EggLanderMissionScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keyR!: Phaser.Input.Keyboard.Key
  private keyN!: Phaser.Input.Keyboard.Key
  private keyL!: Phaser.Input.Keyboard.Key
  private keyA!: Phaser.Input.Keyboard.Key
  private keyD!: Phaser.Input.Keyboard.Key
  private keySpace!: Phaser.Input.Keyboard.Key

  private hudText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text
  private objectiveText!: Phaser.GameObjects.Text
  private phaseText!: Phaser.GameObjects.Text
  private statusText!: Phaser.GameObjects.Text
  private hintText!: Phaser.GameObjects.Text

  private planetLayer!: Phaser.GameObjects.Container
  private orbitalLayer!: Phaser.GameObjects.Container
  private planetPad!: Phaser.GameObjects.Rectangle
  private terrain!: Phaser.GameObjects.Rectangle
  private egg!: Phaser.GameObjects.Ellipse
  private bonusRelic!: Phaser.GameObjects.Star
  private runner!: Phaser.GameObjects.Sprite
  private stationRing!: Phaser.GameObjects.Ellipse
  private stationCore!: Phaser.GameObjects.Rectangle
  private dockingTarget!: Phaser.GameObjects.Ellipse
  private dockingGuideOuter!: Phaser.GameObjects.Ellipse
  private dockingApproachLine!: Phaser.GameObjects.Line
  private dockingVelocityLine!: Phaser.GameObjects.Line
  private bossBody!: Phaser.GameObjects.Ellipse
  private bossEye!: Phaser.GameObjects.Ellipse

  private ship!: Phaser.GameObjects.Triangle
  private thruster!: Phaser.GameObjects.Triangle

  private phase: MissionPhase = 'level-select'
  private levelIndex = 0
  private saveData: SaveData = {
    version: SAVE_VERSION,
    unlockedLevel: 1,
    highestLevelReached: 1,
    bestScore: 0,
    totalClears: 0,
    bestStreak: 0,
    bestDockGrades: Array(LEVELS.length).fill('-'),
    bestLevelScores: Array(LEVELS.length).fill(0),
    bestLevelTimesMs: Array(LEVELS.length).fill(0),
    levelAttempts: Array(LEVELS.length).fill(0),
    levelClears: Array(LEVELS.length).fill(0),
    cleanLevelClears: Array(LEVELS.length).fill(0),
    firstTryLevelClears: Array(LEVELS.length).fill(0),
    relicLevelCompletions: Array(LEVELS.length).fill(0),
    sDockLevelClears: Array(LEVELS.length).fill(0),
    unlockedPowerups: [],
    selectedPowerup: null
  }

  private sessionScore = 0
  private attempts = 0
  private maxFuel = 100
  private fuel = 100
  private velocity = new Phaser.Math.Vector2(0, 0)

  private runnerSpeed = 210
  private hasEgg = false
  private eggStolen = false
  private bonusObjectiveActive = false
  private bonusObjectiveCollected = false
  private bossActive = false
  private bossHp = 0
  private playerHp = 3
  private playerInvulnerableUntil = 0
  private missionFailuresOnLevel = 0
  private clearStreak = 0
  private tookDamageThisAttempt = false
  private readonly spears: Array<{ obj: Phaser.GameObjects.Rectangle; vx: number; life: number }> = []
  private readonly bossShots: Array<{ obj: Phaser.GameObjects.Ellipse; vx: number; vy: number; life: number }> = []
  private bossTelegraph!: Phaser.GameObjects.Ellipse
  private lastSpearAt = 0
  private lastBossShotAt = 0
  private lastDockGrade = '-'
  private missionStartAt = 0

  private readonly rotationSpeed = 2.75

  constructor() {
    super('EggLanderMissionScene')
  }

  preload() {
    this.load.spritesheet('runner-v1', '/assets/runner_sheet_v1.png', {
      frameWidth: 256,
      frameHeight: 256
    })
  }

  create() {
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1e3d)
    this.planetLayer = this.add.container()
    this.orbitalLayer = this.add.container()

    // Patapon-inspired: bold silhouettes + simple colorful strata
    const skyBand = this.add.rectangle(width / 2, height / 2, width, height, 0x20244f)
    const sunDisc = this.add.circle(width - 120, 90, 46, 0xffd46b).setAlpha(0.9)
    const farMount = this.add.rectangle(width / 2, height - 106, width + 220, 160, 0x4e3b7e).setAlpha(0.95)
    const nearMount = this.add.rectangle(width / 2, height - 66, width + 220, 120, 0x2f235a)
    const eyeTotem = this.add.ellipse(120, height - 90, 70, 86, 0x111111).setStrokeStyle(4, 0x000000)
    const eyePupil = this.add.circle(120, height - 90, 11, 0xffffff)
    this.terrain = this.add.rectangle(width / 2, height - 8, width, 16, 0x130f2f)
    this.planetPad = this.add.rectangle(width / 2, height - 25, 170, 16, 0xc9f25a).setStrokeStyle(3, 0x151515)
    this.egg = this.add.ellipse(width - 140, height - 44, 24, 30, 0xfff2ba).setStrokeStyle(2, 0x242424)
    this.bonusRelic = this.add.star(width / 2 + 120, height - 48, 5, 6, 12, 0x8dfdff).setStrokeStyle(2, 0x1f2d35).setVisible(false)
    this.runner = this.add.sprite(width / 2, height - 48, 'runner-v1', 0).setVisible(false).setScale(0.42)
    this.bossBody = this.add.ellipse(width - 240, height - 52, 66, 66, 0x0c0c0c).setStrokeStyle(4, 0x1f1f1f).setVisible(false)
    this.bossEye = this.add.ellipse(width - 240, height - 52, 18, 18, 0xffffff).setVisible(false)
    this.bossTelegraph = this.add.ellipse(width - 240, height - 52, 44, 44, 0xffd17a).setStrokeStyle(2, 0x5a2c0c).setAlpha(0.18).setVisible(false)
    this.planetLayer.add([skyBand, sunDisc, farMount, nearMount, eyeTotem, eyePupil, this.terrain, this.planetPad, this.egg, this.bonusRelic, this.bossBody, this.bossEye, this.bossTelegraph, this.runner])

    this.orbitalLayer.add([
      this.add.rectangle(width / 2, height / 2, width, height, 0x070b17),
      this.add.ellipse(width / 2 - 180, height / 2 + 120, 560, 220, 0x16213c).setAlpha(0.55),
      this.add.ellipse(width / 2 + 260, height / 2 - 150, 380, 180, 0x111933).setAlpha(0.45)
    ])
    this.stationRing = this.add.ellipse(width - 180, 120, 122, 122, 0x6ea8ff).setStrokeStyle(4, 0xcfe7ff)
    this.stationCore = this.add.rectangle(width - 180, 120, 18, 98, 0xb9c7de)
    this.dockingGuideOuter = this.add.ellipse(width - 180, 120, 78, 78, 0x75ffd2).setAlpha(0.22).setStrokeStyle(2, 0x75ffd2)
    this.dockingTarget = this.add.ellipse(width - 180, 120, 44, 44, 0x9ff6d2).setAlpha(0.7)
    this.dockingApproachLine = this.add.line(0, 0, 0, 0, 0, 0, 0x75ffd2).setOrigin(0, 0).setAlpha(0.5).setLineWidth(2, 2)
    this.dockingVelocityLine = this.add.line(0, 0, 0, 0, 0, 0, 0xffd17a).setOrigin(0, 0).setAlpha(0.6).setLineWidth(2, 2)
    this.orbitalLayer.add([this.stationRing, this.stationCore, this.dockingGuideOuter, this.dockingTarget, this.dockingApproachLine, this.dockingVelocityLine])

    this.ship = this.add.triangle(width / 2, 96, 0, 28, 20, -20, -20, -20, 0xffe48f).setStrokeStyle(4, 0x0f0f0f)
    this.thruster = this.add.triangle(this.ship.x, this.ship.y + 24, 0, 0, 8, 18, -8, 18, 0xff7a3d).setVisible(false)

    this.statusText = this.add.text(width / 2, height / 2 - 30, '', {
      fontFamily: 'monospace',
      fontSize: '30px',
      color: '#f5f5f5',
      align: 'center'
    }).setOrigin(0.5).setStroke('#0f0f0f', 6)

    this.hudText = this.add.text(14, 10, '', { fontFamily: 'monospace', fontSize: '15px', color: '#f8f8f8' })
    this.levelText = this.add.text(14, 30, '', { fontFamily: 'monospace', fontSize: '14px', color: '#dce2ff' })
    this.objectiveText = this.add.text(14, 50, '', { fontFamily: 'monospace', fontSize: '14px', color: '#cfd6ff' })
    this.phaseText = this.add.text(14, 72, '', { fontFamily: 'monospace', fontSize: '14px', color: '#9ee7ff' })
    this.hintText = this.add.text(14, 94, '', { fontFamily: 'monospace', fontSize: '14px', color: '#d4d7ff' })

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keyR = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R)
    this.keyN = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.N)
    this.keyL = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.L)
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    if (!this.anims.exists('runner-idle')) {
      this.anims.create({ key: 'runner-idle', frames: this.anims.generateFrameNumbers('runner-v1', { start: 0, end: 3 }), frameRate: 7, repeat: -1 })
      this.anims.create({ key: 'runner-run', frames: this.anims.generateFrameNumbers('runner-v1', { start: 6, end: 10 }), frameRate: 12, repeat: -1 })
      this.anims.create({ key: 'runner-throw', frames: this.anims.generateFrameNumbers('runner-v1', { start: 12, end: 15 }), frameRate: 14, repeat: 0 })
    }

    this.saveData = this.loadSave()
    this.enterLevelSelect()
  }

  update(_: number, deltaMs: number) {
    const dt = deltaMs / 1000

    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.startNewSession()
      return
    }

    if (this.phase === 'level-select') {
      if (Phaser.Input.Keyboard.JustDown(this.keyN)) {
        this.levelIndex = Math.min(this.levelIndex + 1, this.saveData.unlockedLevel - 1)
        this.updateUi()
      }
      if (Phaser.Input.Keyboard.JustDown(this.keyL)) {
        this.levelIndex = Math.max(this.levelIndex - 1, 0)
        this.updateUi()
      }
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
        this.missionFailuresOnLevel = 0
        this.beginPlanetBrief()
      }
      if (Phaser.Input.Keyboard.JustDown(this.keyA)) this.cycleSelectedPowerup(-1)
      if (Phaser.Input.Keyboard.JustDown(this.keyD)) this.cycleSelectedPowerup(1)
      return
    }

    if (this.phase === 'planet-brief' && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.phase = 'planet-flying'
      this.missionStartAt = this.time.now
      this.statusText.setText('Planet landing in progress')
      this.hintText.setText('← → rotate • ↑ thrust • R new session')
    }

    if (this.phase === 'planet-flying') this.updatePlanetFlight(dt)
    if (this.phase === 'on-foot') this.updateOnFoot(dt)
    if (this.phase === 'takeoff') this.updateTakeoff(dt)
    if (this.phase === 'orbital-docking') this.updateOrbitalDocking(dt)

    if (this.phase === 'level-complete') {
      if (Phaser.Input.Keyboard.JustDown(this.keyN)) this.advanceFromComplete()
      if (Phaser.Input.Keyboard.JustDown(this.keyL)) this.enterLevelSelect()
    }

    this.updateUi()
  }

  private updatePlanetFlight(dt: number) {
    const level = LEVELS[this.levelIndex]
    this.velocity.y += level.gravity * dt

    if (this.cursors.left.isDown) this.ship.rotation -= this.rotationSpeed * dt
    if (this.cursors.right.isDown) this.ship.rotation += this.rotationSpeed * dt

    const fuelBurnMultiplier = this.saveData.selectedPowerup === 'fuel-gel' ? 0.75 : 1
    let thrusting = false
    if (this.cursors.up.isDown && this.fuel > 0) {
      const direction = this.ship.rotation - Math.PI / 2
      this.velocity.x += Math.cos(direction) * level.thrust * dt
      this.velocity.y += Math.sin(direction) * level.thrust * dt
      this.fuel = Math.max(0, this.fuel - level.fuelBurnPerSecond * fuelBurnMultiplier * dt)
      thrusting = true
    }

    if (this.saveData.selectedPowerup === 'stability-thrusters') {
      this.velocity.x *= 1 - 0.55 * dt
      this.ship.rotation *= 1 - 0.42 * dt
    }

    this.moveShip(dt, thrusting)

    if (this.ship.y >= this.scale.height - 34) {
      this.ship.y = this.scale.height - 34
      const onPad = Math.abs(this.ship.x - this.scale.width / 2) <= level.padWidth / 2
      const shieldBonus = this.saveData.selectedPowerup === 'shielded-hull' ? 1.15 : 1
      const stableY = Math.abs(this.velocity.y) <= level.safeVertical * shieldBonus
      const stableX = Math.abs(this.velocity.x) <= level.safeHorizontal * shieldBonus
      const upright = Math.abs(Phaser.Math.Angle.Wrap(this.ship.rotation)) <= level.safeAngle * shieldBonus

      if (onPad && stableY && stableX && upright) {
        this.startOnFootPhase()
      } else {
        this.failMission(onPad ? 'Hard landing' : 'Missed landing pad')
      }
    }
  }

  private updateOnFoot(dt: number) {
    this.thruster.setVisible(false)
    const level = LEVELS[this.levelIndex]
    const minX = this.scale.width / 2 - 26
    const maxX = this.scale.width / 2 + level.runDistance

    let moving = false
    if (this.cursors.right.isDown) {
      this.runner.x = Math.min(maxX, this.runner.x + this.runnerSpeed * dt)
      this.runner.setFlipX(false)
      moving = true
    }
    if (this.cursors.left.isDown) {
      this.runner.x = Math.max(minX, this.runner.x - this.runnerSpeed * dt)
      this.runner.setFlipX(true)
      moving = true
    }

    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) this.throwSpear()

    if (moving) {
      if (this.runner.anims.currentAnim?.key !== 'runner-run') this.runner.play('runner-run', true)
    } else if (!this.runner.anims.isPlaying || this.runner.anims.currentAnim?.key === 'runner-run') {
      this.runner.play('runner-idle', true)
    }

    if (this.time.now < this.playerInvulnerableUntil) {
      const blinkOn = Math.floor(this.time.now / 80) % 2 === 0
      this.runner.setTint(blinkOn ? 0xff8a8a : 0xffffff)
    } else {
      this.runner.clearTint()
    }

    this.updateSpears(dt)
    this.updateBossCombat(dt)

    if (this.bonusObjectiveActive && !this.bonusObjectiveCollected && Math.abs(this.runner.x - this.bonusRelic.x) < 18) {
      this.bonusObjectiveCollected = true
      this.bonusRelic.setVisible(false)
      this.statusText.setText('Side objective complete: relic secured (+250 on dock)!')
    }

    if (!this.eggStolen && Math.abs(this.runner.x - this.egg.x) < 16) {
      if (this.bossActive) {
        this.statusText.setText('Boss blocks the egg — throw spears (Space)!')
      } else {
        this.eggStolen = true
        this.hasEgg = true
        this.egg.setVisible(false)
        this.statusText.setText('Egg stolen! Return to lander')
      }
    }

    if (this.hasEgg && Math.abs(this.runner.x - this.ship.x) < 20) {
      this.runner.setVisible(false)
      this.phase = 'takeoff'
      this.statusText.setText('Boarded with egg: launch to orbit')
      this.hintText.setText('↑ thrust • ←/→ rotate • R new session')
      this.ship.setFillStyle(0xffd889)
      this.velocity.set(0, -8)
      this.ship.rotation = 0
      this.ship.y = this.scale.height - 46
    }
  }

  private updateTakeoff(dt: number) {
    const level = LEVELS[this.levelIndex]
    this.velocity.y += level.gravity * dt * 0.6

    if (this.cursors.left.isDown) this.ship.rotation -= this.rotationSpeed * dt
    if (this.cursors.right.isDown) this.ship.rotation += this.rotationSpeed * dt

    const fuelBurnMultiplier = this.saveData.selectedPowerup === 'fuel-gel' ? 0.75 : 1
    let thrusting = false
    if (this.cursors.up.isDown && this.fuel > 0) {
      const direction = this.ship.rotation - Math.PI / 2
      this.velocity.x += Math.cos(direction) * level.thrust * dt
      this.velocity.y += Math.sin(direction) * level.thrust * dt
      this.fuel = Math.max(0, this.fuel - level.fuelBurnPerSecond * fuelBurnMultiplier * dt)
      thrusting = true
    }

    this.moveShip(dt, thrusting)

    if (this.ship.y < 26) {
      this.startOrbitalDockingPhase()
    }
  }

  private updateOrbitalDocking(dt: number) {
    const level = LEVELS[this.levelIndex]
    this.velocity.y += level.orbitalGravity * dt

    if (this.cursors.left.isDown) this.ship.rotation -= this.rotationSpeed * dt * 0.85
    if (this.cursors.right.isDown) this.ship.rotation += this.rotationSpeed * dt * 0.85

    const fuelBurnMultiplier = this.saveData.selectedPowerup === 'fuel-gel' ? 0.75 : 1
    let thrusting = false
    if (this.cursors.up.isDown && this.fuel > 0) {
      const direction = this.ship.rotation - Math.PI / 2
      this.velocity.x += Math.cos(direction) * level.orbitalThrust * dt
      this.velocity.y += Math.sin(direction) * level.orbitalThrust * dt
      this.fuel = Math.max(0, this.fuel - level.fuelBurnPerSecond * 0.6 * fuelBurnMultiplier * dt)
      thrusting = true
    }

    this.velocity.x *= 1 - 0.08 * dt
    this.moveShip(dt, thrusting)

    const dist = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, this.dockingTarget.x, this.dockingTarget.y)
    const speed = this.velocity.length()
    const aligned = Math.abs(Phaser.Math.Angle.Wrap(this.ship.rotation)) < 0.22

    const pulse = 0.8 + Math.sin(this.time.now / 180) * 0.2
    this.dockingTarget.setScale(pulse)
    this.dockingGuideOuter.setScale(1 + Math.sin(this.time.now / 260) * 0.06)

    this.dockingApproachLine.setTo(this.ship.x, this.ship.y, this.dockingTarget.x, this.dockingTarget.y)
    this.dockingApproachLine.setStrokeStyle(2, aligned ? 0x8dffc0 : 0x75ffd2, 0.58)
    const velocityScale = 0.42
    this.dockingVelocityLine.setTo(this.ship.x, this.ship.y, this.ship.x + this.velocity.x * velocityScale, this.ship.y + this.velocity.y * velocityScale)
    this.dockingVelocityLine.setStrokeStyle(2, speed <= level.orbitalSafeSpeed ? 0x8dffc0 : 0xffd17a, 0.62)

    this.hintText.setText(
      `Docking: dist ${Math.round(dist)} / ${level.orbitalDockRadius}, speed ${Math.round(speed)} / ${level.orbitalSafeSpeed}, ${aligned ? 'aligned' : 'tilted'}`
    )

    if (dist <= level.orbitalDockRadius && speed <= level.orbitalSafeSpeed && aligned) {
      this.completeLevel(dist, speed)
    } else if (dist <= level.orbitalDockRadius && speed > level.orbitalSafeSpeed * 1.6) {
      this.failMission('Docking impact too fast')
    }
  }

  private moveShip(dt: number, thrusting: boolean) {
    this.ship.x += this.velocity.x * dt
    this.ship.y += this.velocity.y * dt

    if (this.ship.x < -12) this.ship.x = this.scale.width + 12
    if (this.ship.x > this.scale.width + 12) this.ship.x = -12

    this.thruster
      .setVisible(thrusting)
      .setPosition(this.ship.x + Math.cos(this.ship.rotation + Math.PI / 2) * 18, this.ship.y + Math.sin(this.ship.rotation + Math.PI / 2) * 18)
      .setRotation(this.ship.rotation)
      .setScale(1, 0.9 + Math.random() * 0.5)
  }

  private startOnFootPhase() {
    this.phase = 'on-foot'
    this.velocity.set(0, 0)
    this.ship.rotation = 0
    this.runner.x = this.ship.x + 8
    this.runner.setVisible(true)
    this.runner.setFlipX(false)
    this.runner.play('runner-idle', true)

    this.bonusObjectiveActive = this.saveData.selectedPowerup === 'stability-thrusters'
    this.bonusObjectiveCollected = false
    this.bonusRelic.setVisible(this.bonusObjectiveActive)

    // Boss appears on levels configured with boss HP.
    const level = LEVELS[this.levelIndex]
    this.bossActive = level.bossHp > 0
    this.bossHp = this.bossActive ? level.bossHp : 0
    this.playerHp = this.saveData.selectedPowerup === 'shielded-hull' ? 4 : 3
    this.playerInvulnerableUntil = 0
    this.runner.clearTint()
    this.bossBody.setVisible(this.bossActive)
    this.bossEye.setVisible(this.bossActive)
    this.bossTelegraph.setVisible(false)
    this.dockingApproachLine.setVisible(false)
    this.dockingVelocityLine.setVisible(false)
    if (this.bossActive) {
      this.statusText.setText('Landed. Defeat boss with spears, then steal egg')
      this.hintText.setText(this.bonusObjectiveActive ? 'On foot: ←/→ run • Space spear • grab cyan relic for bonus' : 'On foot: ←/→ run • Space throw spear')
    } else {
      this.statusText.setText('Landed. Exit, steal egg, return')
      this.hintText.setText(this.bonusObjectiveActive ? 'On foot: ←/→ run • grab cyan relic for bonus • steal egg then return' : 'On foot: ←/→ run • steal egg then return to lander')
    }
  }

  private throwSpear() {
    if (this.phase !== 'on-foot') return
    const now = this.time.now
    if (now - this.lastSpearAt < 180) return

    this.lastSpearAt = now
    this.runner.play('runner-throw', true)
    this.runner.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.phase === 'on-foot') this.runner.play('runner-idle', true)
    })

    const dir = this.runner.flipX ? -1 : 1
    const spear = this.add.rectangle(this.runner.x + 12 * dir, this.runner.y - 8, 20, 3, 0xe8f1ff)
      .setStrokeStyle(1, 0x111111)
      .setRotation(dir < 0 ? Math.PI : 0)
    this.planetLayer.add(spear)
    this.spears.push({ obj: spear, vx: 430 * dir, life: 1.25 })
  }

  private updateSpears(dt: number) {
    for (let i = this.spears.length - 1; i >= 0; i -= 1) {
      const s = this.spears[i]
      s.obj.x += s.vx * dt
      s.life -= dt

      if (this.bossActive && Phaser.Math.Distance.Between(s.obj.x, s.obj.y, this.bossBody.x, this.bossBody.y) < 36) {
        this.bossHp -= 1
        s.obj.destroy()
        this.spears.splice(i, 1)

        if (this.bossHp <= 0) {
          this.bossActive = false
          this.bossBody.setVisible(false)
          this.bossEye.setVisible(false)
          this.bossTelegraph.setVisible(false)
          this.statusText.setText('Boss down! Grab the egg and return')
        }
        continue
      }

      if (s.life <= 0 || s.obj.x > this.scale.width + 40) {
        s.obj.destroy()
        this.spears.splice(i, 1)
      }
    }
  }

  private startOrbitalDockingPhase() {
    this.phase = 'orbital-docking'
    this.planetLayer.setVisible(false)
    this.orbitalLayer.setVisible(true)

    this.ship.setPosition(120, this.scale.height - 80)
    this.ship.rotation = 0
    this.velocity.set(30, -18)
    this.dockingApproachLine.setVisible(true)
    this.dockingVelocityLine.setVisible(true)

    this.statusText.setText('Orbital docking: near-zero-G precision')
    this.hintText.setText('Dock softly and upright inside ring • ↑ thrust • ←/→ rotate')
  }

  private updateBossCombat(dt: number) {
    if (!this.bossActive) return

    const level = LEVELS[this.levelIndex]
    const now = this.time.now
    const fireCadence = level.bossFireCadenceMs
    const telegraphWindow = level.bossTelegraphMs
    const shotCooldownRemaining = Math.max(0, fireCadence - (now - this.lastBossShotAt))

    if (shotCooldownRemaining < telegraphWindow) {
      this.bossTelegraph.setVisible(true)
      this.bossTelegraph.setPosition(this.runner.x, this.runner.y - 2)
      const pulse = 1 + Math.sin(now / 28) * 0.15
      this.bossTelegraph.setScale(pulse)
      this.bossTelegraph.setAlpha(0.14 + (1 - shotCooldownRemaining / telegraphWindow) * 0.35)
    } else {
      this.bossTelegraph.setVisible(false)
    }

    if (now - this.lastBossShotAt > fireCadence) {
      this.bossTelegraph.setVisible(false)
      this.lastBossShotAt = now
      const dx = this.runner.x - this.bossBody.x
      const dy = this.runner.y - this.bossBody.y
      const dirX = Math.sign(dx) || -1
      const dirY = Phaser.Math.Clamp(dy / 120, -0.75, 0.75)

      const shot = this.add.ellipse(this.bossBody.x, this.bossBody.y, 10, 10, 0xff6a6a).setStrokeStyle(2, 0x3a1111)
      this.planetLayer.add(shot)
      this.bossShots.push({ obj: shot, vx: dirX * 190, vy: dirY * 110, life: 2.2 })

      // Higher levels can opt into a second angled shot for pattern pressure.
      if (level.bossSpreadShot) {
        const shot2 = this.add.ellipse(this.bossBody.x, this.bossBody.y, 9, 9, 0xff9a6a).setStrokeStyle(2, 0x3a1111)
        this.planetLayer.add(shot2)
        this.bossShots.push({ obj: shot2, vx: dirX * 165, vy: -dirY * 85, life: 2.0 })
      }

      this.bossEye.setScale(1.15)
      this.time.delayedCall(90, () => this.bossEye.setScale(1))
    }

    for (let i = this.bossShots.length - 1; i >= 0; i -= 1) {
      const b = this.bossShots[i]
      b.obj.x += b.vx * dt
      b.obj.y += b.vy * dt
      b.life -= dt

      if (Phaser.Math.Distance.Between(b.obj.x, b.obj.y, this.runner.x, this.runner.y) < 14) {
        b.obj.destroy()
        this.bossShots.splice(i, 1)

        if (this.time.now < this.playerInvulnerableUntil) {
          continue
        }

        this.playerHp -= 1
        this.tookDamageThisAttempt = true
        const invulnerabilityMs = this.saveData.selectedPowerup === 'shielded-hull' ? 1300 : 900
        this.playerInvulnerableUntil = this.time.now + invulnerabilityMs
        const maxHp = this.saveData.selectedPowerup === 'shielded-hull' ? 4 : 3
        this.statusText.setText(`Hit! HP ${this.playerHp}/${maxHp}`)
        this.hintText.setText('Dodge boss shots and throw spears (Space)')
        if (this.playerHp <= 0) {
          this.failMission('On-foot defeat')
          return
        }
        continue
      }

      if (b.life <= 0 || b.obj.x < -20 || b.obj.x > this.scale.width + 20 || b.obj.y < 0 || b.obj.y > this.scale.height) {
        b.obj.destroy()
        this.bossShots.splice(i, 1)
      }
    }
  }

  private beginPlanetBrief() {
    const level = LEVELS[this.levelIndex]
    if (level.requiredPowerup && !this.saveData.unlockedPowerups.includes(level.requiredPowerup)) {
      const requiredName = POWERUPS[level.requiredPowerup].name
      this.statusText.setText(`Level locked: requires ${requiredName}`)
      this.hintText.setText('Complete earlier levels to unlock required powerup')
      return
    }

    this.phase = 'planet-brief'
    this.lastDockGrade = '-'
    this.missionStartAt = 0
    this.planetLayer.setVisible(true)
    this.orbitalLayer.setVisible(false)
    this.resetMissionEntities()
    this.statusText.setText(`${level.name}\n1) Land 2) Steal egg 3) Return 4) Take off`)
    this.hintText.setText('Press ↑ to start landing run • R new session')
  }

  private resetMissionEntities() {
    const level = LEVELS[this.levelIndex]
    this.maxFuel = this.saveData.selectedPowerup === 'fuel-gel' ? 120 : 100
    this.fuel = this.maxFuel
    this.hasEgg = false
    this.eggStolen = false
    this.bonusObjectiveActive = false
    this.bonusObjectiveCollected = false
    this.egg.setVisible(true)
    this.bonusRelic.setVisible(false)
    this.bossActive = false
    this.bossHp = 0
    this.playerHp = this.saveData.selectedPowerup === 'shielded-hull' ? 4 : 3
    this.playerInvulnerableUntil = 0
    this.tookDamageThisAttempt = false
    this.runner.clearTint()
    this.bossBody.setVisible(false)
    this.bossEye.setVisible(false)
    this.bossTelegraph.setVisible(false)
    this.dockingApproachLine.setVisible(false)
    this.dockingVelocityLine.setVisible(false)

    for (let i = this.spears.length - 1; i >= 0; i -= 1) {
      this.spears[i].obj.destroy()
      this.spears.splice(i, 1)
    }
    for (let i = this.bossShots.length - 1; i >= 0; i -= 1) {
      this.bossShots[i].obj.destroy()
      this.bossShots.splice(i, 1)
    }

    this.planetPad.setSize(level.padWidth, 16)
    this.egg.x = this.scale.width / 2 + level.runDistance
    this.bonusRelic.x = this.scale.width / 2 + Math.round(level.runDistance * 0.58)

    this.ship.setPosition(this.scale.width / 2 + Phaser.Math.Between(-120, 120), 90)
    this.ship.setRotation(Phaser.Math.FloatBetween(-0.08, 0.08))
    this.velocity.set(Phaser.Math.FloatBetween(-8, 8), Phaser.Math.FloatBetween(-4, 4))

    this.runner.setVisible(false)
  }

  private failMission(reason: string) {
    this.phase = 'crashed'
    this.attempts += 1
    this.saveData.levelAttempts[this.levelIndex] = (this.saveData.levelAttempts[this.levelIndex] ?? 0) + 1
    this.missionFailuresOnLevel += 1
    this.clearStreak = 0
    this.velocity.set(0, 0)
    this.dockingApproachLine.setVisible(false)
    this.dockingVelocityLine.setVisible(false)
    this.ship.setFillStyle(0xff6b6b)
    this.statusText.setText(`Mission failed: ${reason}`)
    this.hintText.setText('Retrying this level… (R new session)')
    this.saveSave(this.saveData)

    this.time.delayedCall(900, () => {
      this.ship.setFillStyle(0xffe48f)
      this.beginPlanetBrief()
    })
  }

  private completeLevel(dockDist: number, dockSpeed: number) {
    const level = LEVELS[this.levelIndex]
    this.phase = 'level-complete'
    this.attempts += 1
    this.velocity.set(0, 0)
    this.dockingApproachLine.setVisible(false)
    this.dockingVelocityLine.setVisible(false)

    const relicBonus = this.bonusObjectiveCollected ? 250 : 0
    const firstTryBonus = this.missionFailuresOnLevel === 0 ? 100 : 0
    const noHitBonus = level.id >= 2 && !this.tookDamageThisAttempt ? 150 : 0
    const nextStreak = this.clearStreak + 1
    const streakBonus = Math.min(Math.max(0, nextStreak - 1) * 75, 225)
    const distanceScore = Phaser.Math.Clamp(1 - dockDist / level.orbitalDockRadius, 0, 1)
    const speedScore = Phaser.Math.Clamp(1 - dockSpeed / level.orbitalSafeSpeed, 0, 1)
    const dockingPrecision = distanceScore * 0.6 + speedScore * 0.4
    const dockingBonus = Math.round(dockingPrecision * 120)
    const dockingGrade = dockingPrecision >= 0.86 ? 'S' : dockingPrecision >= 0.68 ? 'A' : dockingPrecision >= 0.5 ? 'B' : 'C'
    this.lastDockGrade = dockingGrade

    const previousBestGrade = this.saveData.bestDockGrades[this.levelIndex] ?? '-'
    const isNewDockBest = DOCK_GRADE_ORDER.indexOf(dockingGrade) > DOCK_GRADE_ORDER.indexOf(previousBestGrade as (typeof DOCK_GRADE_ORDER)[number])
    if (isNewDockBest) this.saveData.bestDockGrades[this.levelIndex] = dockingGrade

    const gained = level.completionScore + Math.round(this.fuel * 0.5) + relicBonus + dockingBonus + firstTryBonus + noHitBonus + streakBonus
    const previousBestLevelScore = this.saveData.bestLevelScores[this.levelIndex] ?? 0
    const isNewBestLevelScore = gained > previousBestLevelScore
    if (isNewBestLevelScore) this.saveData.bestLevelScores[this.levelIndex] = gained

    const elapsedMs = Math.max(0, Math.floor(this.time.now - this.missionStartAt))
    const previousBestLevelTimeMs = this.saveData.bestLevelTimesMs[this.levelIndex] ?? 0
    const isNewBestLevelTime = elapsedMs > 0 && (previousBestLevelTimeMs <= 0 || elapsedMs < previousBestLevelTimeMs)
    if (isNewBestLevelTime) this.saveData.bestLevelTimesMs[this.levelIndex] = elapsedMs

    this.sessionScore += gained
    this.clearStreak = nextStreak
    const previousBestStreak = this.saveData.bestStreak ?? 0
    const isNewBestStreak = this.clearStreak > previousBestStreak
    if (isNewBestStreak) this.saveData.bestStreak = this.clearStreak

    const levelNumber = this.levelIndex + 1
    const nextLevel = levelNumber + 1
    if (nextLevel <= LEVELS.length) this.saveData.unlockedLevel = Math.max(this.saveData.unlockedLevel, nextLevel)
    this.saveData.highestLevelReached = Math.max(this.saveData.highestLevelReached, levelNumber)

    this.tryUnlockPowerupsForLevel(levelNumber)
    this.saveData.bestScore = Math.max(this.saveData.bestScore, this.sessionScore)
    this.saveData.totalClears += 1
    this.saveData.levelAttempts[this.levelIndex] = (this.saveData.levelAttempts[this.levelIndex] ?? 0) + 1
    this.saveData.levelClears[this.levelIndex] = (this.saveData.levelClears[this.levelIndex] ?? 0) + 1
    const isFirstTryClear = this.missionFailuresOnLevel === 0
    if (isFirstTryClear) {
      this.saveData.firstTryLevelClears[this.levelIndex] = (this.saveData.firstTryLevelClears[this.levelIndex] ?? 0) + 1
    }
    const isCleanClear = level.id >= 2 && !this.tookDamageThisAttempt
    if (isCleanClear) {
      this.saveData.cleanLevelClears[this.levelIndex] = (this.saveData.cleanLevelClears[this.levelIndex] ?? 0) + 1
    }
    if (this.bonusObjectiveCollected) {
      this.saveData.relicLevelCompletions[this.levelIndex] = (this.saveData.relicLevelCompletions[this.levelIndex] ?? 0) + 1
    }
    if (dockingGrade === 'S') {
      this.saveData.sDockLevelClears[this.levelIndex] = (this.saveData.sDockLevelClears[this.levelIndex] ?? 0) + 1
    }
    this.saveSave(this.saveData)

    const breakdownBits = [
      `grade ${dockingGrade}`,
      isNewDockBest ? `new PB dock grade (${previousBestGrade}→${dockingGrade})` : undefined,
      isNewBestLevelScore ? `new PB level score (${previousBestLevelScore}→${gained})` : undefined,
      isNewBestLevelTime ? `new PB time (${this.formatMs(previousBestLevelTimeMs)}→${this.formatMs(elapsedMs)})` : elapsedMs > 0 ? `time ${this.formatMs(elapsedMs)}` : undefined,
      dockingBonus > 0 ? `+${dockingBonus} dock bonus` : undefined,
      firstTryBonus ? '+100 first-try bonus' : undefined,
      isFirstTryClear ? `first-try clears ${this.saveData.firstTryLevelClears[this.levelIndex]}/${this.saveData.levelClears[this.levelIndex]}` : undefined,
      noHitBonus ? '+150 clean-fight bonus' : undefined,
      isCleanClear ? `clean clears ${this.saveData.cleanLevelClears[this.levelIndex]}/${this.saveData.levelClears[this.levelIndex]}` : undefined,
      streakBonus ? `+${streakBonus} streak bonus (x${this.clearStreak})` : undefined,
      isNewBestStreak ? `new best streak (${previousBestStreak}→${this.clearStreak})` : undefined,
      relicBonus ? '+250 relic bonus' : undefined
    ].filter(Boolean)

    this.statusText.setText(`Dock complete! +${gained} (${breakdownBits.join(' • ')})\nN next level • L level select`)
    this.hintText.setText('Mission loop clear: land → run → steal → return → takeoff → dock')
  }

  private advanceFromComplete() {
    if (this.levelIndex < this.saveData.unlockedLevel - 1 && this.levelIndex < LEVELS.length - 1) {
      this.levelIndex += 1
    }
    this.enterLevelSelect()
  }

  private enterLevelSelect() {
    this.phase = 'level-select'
    this.missionFailuresOnLevel = 0
    this.missionStartAt = 0
    this.planetLayer.setVisible(true)
    this.orbitalLayer.setVisible(false)
    this.ship.setPosition(this.scale.width / 2, 90)
    this.ship.rotation = 0
    this.velocity.set(0, 0)
    this.thruster.setVisible(false)
    this.statusText.setText(`Level Select\nL / N choose • A / D powerup • ↑ launch mission`)
    this.hintText.setText('R starts a fresh session (keeps saved progression)')
    this.resetMissionEntities()
    this.updateUi()
  }

  private startNewSession() {
    this.saveData.bestScore = Math.max(this.saveData.bestScore, this.sessionScore)
    this.saveSave(this.saveData)

    this.sessionScore = 0
    this.attempts = 0
    this.levelIndex = 0
    this.clearStreak = 0
    this.saveData = this.loadSave()
    this.enterLevelSelect()
  }

  private updateUi() {
    const level = LEVELS[this.levelIndex]
    const powerup = this.saveData.selectedPowerup ? POWERUPS[this.saveData.selectedPowerup].name : 'None'
    const powerupDescription = this.saveData.selectedPowerup ? POWERUPS[this.saveData.selectedPowerup].description : 'No active perk'

    const hpReadout = this.phase === 'on-foot' && this.bossActive
      ? `${this.playerHp}${this.time.now < this.playerInvulnerableUntil ? ' (i)' : ''}`
      : '-'
    const bossMaxHp = level.bossHp
    const bossReadout = this.phase === 'on-foot' && this.bossActive ? `${Math.max(0, this.bossHp)}/${bossMaxHp}` : '-'
    const bossCadence = level.bossFireCadenceMs
    const bossShotCooldownMs = Math.max(0, bossCadence - (this.time.now - this.lastBossShotAt))
    const bossShotReadout = this.phase === 'on-foot' && this.bossActive
      ? (bossShotCooldownMs <= 0 ? 'firing' : `${Math.ceil(bossShotCooldownMs / 10) * 10}ms`)
      : '-'
    const spearCooldownMs = Math.max(0, 180 - (this.time.now - this.lastSpearAt))
    const spearReadout = this.phase === 'on-foot'
      ? (spearCooldownMs <= 0 ? 'ready' : `${Math.ceil(spearCooldownMs / 10) * 10}ms`)
      : '-'
    const dockingDist = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, this.dockingTarget.x, this.dockingTarget.y)
    const dockingSpeed = this.velocity.length()
    const dockReadout = this.phase === 'orbital-docking'
      ? `${Math.round(dockingDist)}/${level.orbitalDockRadius} @ ${Math.round(dockingSpeed)}/${level.orbitalSafeSpeed}`
      : this.phase === 'level-complete'
        ? `grade ${this.lastDockGrade}`
        : '-'
    const runElapsedMs = this.missionStartAt > 0 && this.phase !== 'level-select'
      ? Math.max(0, Math.floor(this.time.now - this.missionStartAt))
      : 0
    this.hudText.setText(
      `Score ${this.sessionScore}   Attempts ${this.attempts}   Clears ${this.saveData.totalClears}   Streak ${this.clearStreak}   Time ${this.formatMs(runElapsedMs)}   Fuel ${Math.round(this.fuel)}/${this.maxFuel}   HP ${hpReadout}   Boss ${bossReadout}   BossShot ${bossShotReadout}   Spear ${spearReadout}   Dock ${dockReadout}   V ${Math.abs(this.velocity.y).toFixed(1)}   H ${Math.abs(this.velocity.x).toFixed(1)}   PWR ${powerup}`
    )
    const required = level.requiredPowerup ? POWERUPS[level.requiredPowerup].name : 'None'
    const levelBestDockGrade = this.saveData.bestDockGrades[this.levelIndex] ?? '-'
    const levelBestScore = this.saveData.bestLevelScores[this.levelIndex] ?? 0
    const levelBestTimeMs = this.saveData.bestLevelTimesMs[this.levelIndex] ?? 0
    const levelAttempts = this.saveData.levelAttempts[this.levelIndex] ?? 0
    const levelClears = this.saveData.levelClears[this.levelIndex] ?? 0
    const levelCleanClears = this.saveData.cleanLevelClears[this.levelIndex] ?? 0
    const levelFirstTryClears = this.saveData.firstTryLevelClears[this.levelIndex] ?? 0
    const levelRelicCompletions = this.saveData.relicLevelCompletions[this.levelIndex] ?? 0
    const levelSDockClears = this.saveData.sDockLevelClears[this.levelIndex] ?? 0
    const levelClearRateValue = levelAttempts > 0 ? (levelClears / levelAttempts) : 0
    const levelCleanRateValue = levelClears > 0 ? (levelCleanClears / levelClears) : 0
    const levelFirstTryRateValue = levelClears > 0 ? (levelFirstTryClears / levelClears) : 0
    const levelRelicRateValue = levelClears > 0 ? (levelRelicCompletions / levelClears) : 0
    const levelSDockRateValue = levelClears > 0 ? (levelSDockClears / levelClears) : 0
    const levelClearRate = levelAttempts > 0 ? `${Math.round(levelClearRateValue * 100)}%` : '--'
    const levelCleanRate = levelClears > 0 ? `${Math.round(levelCleanRateValue * 100)}%` : '--'
    const levelFirstTryRate = levelClears > 0 ? `${Math.round(levelFirstTryRateValue * 100)}%` : '--'
    const levelRelicRate = levelClears > 0 ? `${Math.round(levelRelicRateValue * 100)}%` : '--'
    const levelSDockRate = levelClears > 0 ? `${Math.round(levelSDockRateValue * 100)}%` : '--'
    const levelRetries = Math.max(0, levelAttempts - levelClears)
    const retriesPerClear = levelClears > 0 ? (levelRetries / levelClears) : null
    const retriesReadout = levelAttempts <= 0
      ? 'Retries --'
      : levelClears > 0
        ? `Retries ${levelRetries} (${retriesPerClear?.toFixed(1)}/clear)`
        : `Retries ${levelRetries} (seeking first clear)`
    const missionPressureReadout = levelAttempts <= 0
      ? 'Pressure --'
      : levelClears <= 0
        ? 'Pressure Extreme (no clears yet)'
        : (() => {
            const retryLoad = retriesPerClear ?? 0
            const pressureLabel = retryLoad <= 0.5
              ? 'Low'
              : retryLoad <= 1.5
                ? 'Medium'
                : retryLoad <= 3
                  ? 'High'
                  : 'Extreme'
            return `Pressure ${pressureLabel}`
          })()
    const pressureLabel = levelAttempts <= 0
      ? 'Unknown'
      : levelClears <= 0
        ? 'Extreme'
        : (() => {
            const retryLoad = retriesPerClear ?? 0
            return retryLoad <= 0.5
              ? 'Low'
              : retryLoad <= 1.5
                ? 'Medium'
                : retryLoad <= 3
                  ? 'High'
                  : 'Extreme'
          })()
    const masteryClearPoints = Math.round(levelClearRateValue * 35)
    const masteryFirstTryPoints = Math.round(levelFirstTryRateValue * 20)
    const masteryCleanPoints = Math.round(levelCleanRateValue * 20)
    const masteryRelicPoints = Math.round(levelRelicRateValue * 10)
    const masterySDockPoints = Math.round(levelSDockRateValue * 15)
    const masteryScore = levelClears > 0
      ? masteryClearPoints + masteryFirstTryPoints + masteryCleanPoints + masteryRelicPoints + masterySDockPoints
      : 0
    const masteryTier = levelClears <= 0
      ? 'Unrated'
      : masteryScore >= 90
        ? 'Ace'
        : masteryScore >= 75
          ? 'Gold'
          : masteryScore >= 55
            ? 'Silver'
            : 'Bronze'
    const missionDifficultyTier = level.id <= 1
      ? 'Bronze'
      : level.id === 2
        ? 'Silver'
        : level.id === 3
          ? 'Gold'
          : 'Ace'
    const masteryRank = masteryTier === 'Unrated'
      ? 0
      : masteryTier === 'Bronze'
        ? 1
        : masteryTier === 'Silver'
          ? 2
          : masteryTier === 'Gold'
            ? 3
            : 4
    const missionRank = missionDifficultyTier === 'Bronze'
      ? 1
      : missionDifficultyTier === 'Silver'
        ? 2
        : missionDifficultyTier === 'Gold'
          ? 3
          : 4
    const missionMatchReadout = levelClears <= 0
      ? `Match Calibrating (target ${missionDifficultyTier})`
      : masteryRank >= missionRank + 1
        ? `Match Overmatch (target ${missionDifficultyTier})`
        : masteryRank >= missionRank
          ? `Match Fair (target ${missionDifficultyTier})`
          : masteryRank + 1 === missionRank
            ? `Match Stretch (target ${missionDifficultyTier})`
            : `Match Spike (target ${missionDifficultyTier})`
    const missionConfidenceReadout = levelAttempts <= 0
      ? 'Confidence --'
      : (() => {
          const pressurePoints = pressureLabel === 'Low'
            ? 35
            : pressureLabel === 'Medium'
              ? 25
              : pressureLabel === 'High'
                ? 12
                : pressureLabel === 'Extreme'
                  ? 0
                  : 18
          const matchPoints = levelClears <= 0
            ? 10
            : masteryRank >= missionRank + 1
              ? 35
              : masteryRank >= missionRank
                ? 28
                : masteryRank + 1 === missionRank
                  ? 16
                  : 6
          const confidenceScore = Math.max(0, Math.min(100, Math.round((masteryScore * 0.3) + pressurePoints + matchPoints)))
          const confidenceBand = confidenceScore >= 85
            ? 'Locked'
            : confidenceScore >= 65
              ? 'Ready'
              : confidenceScore >= 45
                ? 'Swing'
                : 'Risk'
          const confidenceCue = confidenceBand === 'Locked'
            ? 'greenlight PB route'
            : confidenceBand === 'Ready'
              ? 'commit to one score push'
              : confidenceBand === 'Swing'
                ? 'stabilize one rep first'
                : 'reset to safe fundamentals'
          return `Confidence ${confidenceBand} ${confidenceScore} (${confidenceCue})`
        })()
    const masteryFocusAreas = [
      { label: 'Clear', value: levelClearRateValue },
      { label: 'First Try', value: levelFirstTryRateValue },
      { label: 'Clean', value: levelCleanRateValue },
      { label: 'Relic', value: levelRelicRateValue },
      { label: 'S Dock', value: levelSDockRateValue },
    ]
    const weakestFocusArea = masteryFocusAreas.reduce((worst, area) => (area.value < worst.value ? area : worst))
    const masteryFocus = levelClears <= 0
      ? 'Complete first clear to seed mastery telemetry'
      : weakestFocusArea.value >= 1
        ? 'All metrics capped — push speed PBs'
        : `Focus ${weakestFocusArea.label} (${Math.round(weakestFocusArea.value * 100)}%)`
    const nextMasteryTier = masteryTier === 'Unrated'
      ? 'Bronze'
      : masteryTier === 'Bronze'
        ? 'Silver'
        : masteryTier === 'Silver'
          ? 'Gold'
          : masteryTier === 'Gold'
            ? 'Ace'
            : null
    const masteryTierGap = nextMasteryTier
      ? Math.max(0, (nextMasteryTier === 'Bronze'
          ? 1
          : nextMasteryTier === 'Silver'
            ? 55
            : nextMasteryTier === 'Gold'
              ? 75
              : 90) - masteryScore)
      : 0
    const masteryTierProgress = levelClears <= 0
      ? 'Need first clear'
      : nextMasteryTier
        ? `+${masteryTierGap} to ${nextMasteryTier}`
        : 'Ace cap'
    const masteryMixReadout = levelClears <= 0
      ? 'Mix C0/F0/N0/R0/S0'
      : `Mix C${masteryClearPoints}/F${masteryFirstTryPoints}/N${masteryCleanPoints}/R${masteryRelicPoints}/S${masterySDockPoints}`
    const masteryCappedCount = masteryFocusAreas.filter((area) => area.value >= 1).length
    const masteryCapsReadout = levelClears <= 0 ? 'Caps 0/5' : `Caps ${masteryCappedCount}/5`
    const missionOutlookReadout = levelAttempts <= 0
      ? 'Outlook Fresh (seed baseline run)'
      : levelClears <= 0
        ? 'Outlook Breakthrough (land first clear)'
        : (() => {
            const stability = pressureLabel === 'Low'
              ? 'Stable'
              : pressureLabel === 'Medium'
                ? 'Shaky'
                : pressureLabel === 'High'
                  ? 'Fragile'
                  : 'Critical'
            const momentum = masteryScore >= 90
              ? 'maxed'
              : masteryScore >= 75
                ? 'strong'
                : masteryScore >= 55
                  ? 'building'
                  : 'early'
            const cue = stability === 'Stable'
              ? 'push speed'
              : stability === 'Shaky'
                ? 'tighten clean clears'
                : stability === 'Fragile'
                  ? 'prioritize consistency'
                  : 'stabilize before pushing PBs'
            return `Outlook ${stability} (${momentum}; ${cue})`
          })()
    const coachReadout = levelClears <= 0
      ? 'Coach: Land first clear, then optimize.'
      : weakestFocusArea.value >= 1
        ? 'Coach: Metrics capped. Chase faster mission times.'
        : (() => {
            const focus = weakestFocusArea.label
            const hasShield = this.saveData.unlockedPowerups.includes('shielded-hull')
            const hasFuelGel = this.saveData.unlockedPowerups.includes('fuel-gel')
            const hasStability = this.saveData.unlockedPowerups.includes('stability-thrusters')
            const perkHint = focus === 'Clean' && hasShield
              ? 'equip Shielded Hull'
              : focus === 'S Dock' && hasFuelGel
                ? 'equip Fuel Gel'
                : focus === 'Relic' && hasStability
                  ? 'equip Stability Thrusters'
                  : null
            const plan = pressureLabel === 'High' || pressureLabel === 'Extreme'
              ? 'run 2 safe consistency reps'
              : 'push one quality scoring run'
            return perkHint
              ? `Coach: ${focus} weak spot — ${perkHint}, then ${plan}.`
              : `Coach: ${focus} weak spot — ${plan}.`
          })()
    const missionPlanReadout = levelAttempts <= 0
      ? 'Plan Seed baseline clear'
      : levelClears <= 0
        ? 'Plan Drill first clear route'
        : (() => {
            const shouldStabilize = pressureLabel === 'High' || pressureLabel === 'Extreme'
            const hasStrongConfidence = missionConfidenceReadout.includes('Locked') || missionConfidenceReadout.includes('Ready')
            if (shouldStabilize) return 'Plan Stabilize with 2 safe reps'
            if (hasStrongConfidence && weakestFocusArea.value >= 0.8) return 'Plan Push PB pace now'
            if (hasStrongConfidence) return `Plan Push ${weakestFocusArea.label} quality rep`
            return `Plan Practice ${weakestFocusArea.label} fundamentals`
          })()
    const totalAttempts = this.saveData.levelAttempts.reduce((sum, value) => sum + (value ?? 0), 0)
    const totalLevelClears = this.saveData.levelClears.reduce((sum, value) => sum + (value ?? 0), 0)
    const lifetimeClearRate = totalAttempts > 0 ? `${Math.round((totalLevelClears / totalAttempts) * 100)}%` : '--'
    const bestTimePairs = this.saveData.bestLevelTimesMs
      .map((ms, index) => ({ ms: ms ?? 0, index }))
      .filter((entry) => entry.ms > 0)
    const fastestLevelTag = bestTimePairs.length > 0
      ? (() => {
          const fastest = bestTimePairs.reduce((best, entry) => (entry.ms < best.ms ? entry : best))
          return `L${fastest.index + 1} ${this.formatMs(fastest.ms)}`
        })()
      : '--'
    this.levelText.setText(
      `Level ${level.id}/${LEVELS.length}: ${level.name}   Requires ${required}   Unlocked ${this.saveData.unlockedLevel}/${LEVELS.length}   Best ${this.saveData.bestScore}   Best Streak ${this.saveData.bestStreak}   Best Run ${levelBestScore}   Best Time ${this.formatMs(levelBestTimeMs)}   Best Dock ${levelBestDockGrade}   Record ${levelClears}/${levelAttempts} (${levelClearRate})   ${retriesReadout}   ${missionPressureReadout}   ${missionOutlookReadout}   ${missionMatchReadout}   ${missionConfidenceReadout}   ${missionPlanReadout}   ${coachReadout}   First Try ${levelFirstTryClears}/${levelClears} (${levelFirstTryRate})   Clean ${levelCleanClears}/${levelClears} (${levelCleanRate})   Relic ${levelRelicCompletions}/${levelClears} (${levelRelicRate})   S Dock ${levelSDockClears}/${levelClears} (${levelSDockRate})   Mastery ${masteryTier} (${masteryScore}, ${masteryTierProgress})   ${masteryMixReadout}   ${masteryCapsReadout}   Next ${masteryFocus}   Lifetime ${totalLevelClears}/${totalAttempts} (${lifetimeClearRate})   Fastest ${fastestLevelTag}   Perk: ${powerupDescription}`
    )

    let objective = 'Land on planet, grab egg on foot, return, launch, then precision dock in orbit.'
    if (this.phase === 'on-foot' && !this.hasEgg) {
      if (this.bonusObjectiveActive && !this.bonusObjectiveCollected) {
        objective = this.bossActive
          ? 'Optional: secure cyan relic (+250), defeat boss, then steal egg.'
          : 'Optional: secure cyan relic (+250), then run right to steal egg.'
      } else {
        objective = this.bossActive ? 'Defeat boss with Space spears, then steal egg.' : 'Run right to steal egg.'
      }
    }
    if (this.phase === 'on-foot' && this.hasEgg) objective = 'Run back left to board lander with egg.'
    if (this.phase === 'orbital-docking') objective = 'Near-zero-G docking: low speed + upright alignment in ring.'

    const phaseGuide = this.getPhaseGuide()
    this.objectiveText.setText(`Objective: ${objective}`)
    this.phaseText.setText(`Phase: ${phaseGuide}`)
  }

  private formatMs(ms: number): string {
    if (!ms || ms <= 0) return '--'
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const centiseconds = Math.floor((ms % 1000) / 10)
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`
  }

  private getPhaseGuide(): string {
    switch (this.phase) {
      case 'level-select':
        return '0/5 Mission setup (select level + loadout)'
      case 'planet-brief':
      case 'planet-flying':
        return '1/5 Planet landing'
      case 'on-foot':
        return this.hasEgg ? '3/5 Return to lander' : '2/5 On-foot extraction'
      case 'takeoff':
        return '4/5 Planet takeoff'
      case 'orbital-docking':
        return '5/5 Orbital docking'
      case 'level-complete':
        return 'Complete ✓'
      case 'crashed':
        return 'Failed ✕ (auto-retry)'
      default:
        return this.phase
    }
  }

  private cycleSelectedPowerup(direction: 1 | -1) {
    const options: (PowerupId | null)[] = [null, ...this.saveData.unlockedPowerups]
    if (options.length === 0) return

    const currentIndex = options.findIndex((id) => id === this.saveData.selectedPowerup)
    const base = currentIndex >= 0 ? currentIndex : 0
    const nextIndex = (base + direction + options.length) % options.length
    this.saveData.selectedPowerup = options[nextIndex]
    this.saveSave(this.saveData)

    const selectedName = this.saveData.selectedPowerup ? POWERUPS[this.saveData.selectedPowerup].name : 'None'
    this.statusText.setText(`Loadout set: ${selectedName}`)
    this.hintText.setText('Level select: L/N level • A/D powerup • ↑ launch')
  }

  private tryUnlockPowerupsForLevel(levelNumber: number) {
    const unlocked: PowerupId[] = []
    ;(Object.keys(POWERUPS) as PowerupId[]).forEach((id) => {
      if (levelNumber >= POWERUPS[id].unlockLevel && !this.saveData.unlockedPowerups.includes(id)) {
        this.saveData.unlockedPowerups.push(id)
        unlocked.push(id)
      }
    })

    if (!this.saveData.selectedPowerup && this.saveData.unlockedPowerups.includes('stability-thrusters')) {
      this.saveData.selectedPowerup = 'stability-thrusters'
    }

    if (unlocked.length > 0) {
      const names = unlocked.map((id) => POWERUPS[id].name).join(' • ')
      this.statusText.setText(`${this.statusText.text}\nUnlocked: ${names}`)
    }
  }

  private loadSave(): SaveData {
    const fallback: SaveData = {
      version: SAVE_VERSION,
      unlockedLevel: 1,
      highestLevelReached: 1,
      bestScore: 0,
      totalClears: 0,
      bestStreak: 0,
      bestDockGrades: Array(LEVELS.length).fill('-'),
      bestLevelScores: Array(LEVELS.length).fill(0),
      bestLevelTimesMs: Array(LEVELS.length).fill(0),
      levelAttempts: Array(LEVELS.length).fill(0),
      levelClears: Array(LEVELS.length).fill(0),
      cleanLevelClears: Array(LEVELS.length).fill(0),
      firstTryLevelClears: Array(LEVELS.length).fill(0),
      relicLevelCompletions: Array(LEVELS.length).fill(0),
      sDockLevelClears: Array(LEVELS.length).fill(0),
      unlockedPowerups: [],
      selectedPowerup: null
    }

    try {
      const raw = window.localStorage.getItem(SAVE_KEY) ?? window.localStorage.getItem('egg-lander-save-v1')
      if (!raw) return fallback

      const parsed = JSON.parse(raw) as Partial<SaveData>
      return this.migrateParsedSave(parsed)
    } catch {
      return fallback
    }
  }

  private migrateParsedSave(parsed: Partial<SaveData>): SaveData {
    const unlockedPowerupsRaw = Array.isArray(parsed.unlockedPowerups) ? parsed.unlockedPowerups : []
    const unlockedPowerups = unlockedPowerupsRaw.filter((id): id is PowerupId => id in POWERUPS)

    let selectedPowerup = parsed.selectedPowerup && parsed.selectedPowerup in POWERUPS
      ? (parsed.selectedPowerup as PowerupId)
      : null
    if (selectedPowerup && !unlockedPowerups.includes(selectedPowerup)) {
      selectedPowerup = null
    }

    const bestDockGradesRaw = Array.isArray(parsed.bestDockGrades) ? parsed.bestDockGrades : []
    const bestDockGrades = Array.from({ length: LEVELS.length }, (_, i) => {
      const grade = bestDockGradesRaw[i]
      return typeof grade === 'string' && DOCK_GRADE_ORDER.includes(grade as (typeof DOCK_GRADE_ORDER)[number])
        ? grade
        : '-'
    })

    const bestLevelScoresRaw = Array.isArray(parsed.bestLevelScores) ? parsed.bestLevelScores : []
    const bestLevelScores = Array.from({ length: LEVELS.length }, (_, i) => {
      const score = bestLevelScoresRaw[i]
      return typeof score === 'number' && Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0
    })

    const bestLevelTimesRaw = Array.isArray((parsed as { bestLevelTimesMs?: unknown[] }).bestLevelTimesMs)
      ? ((parsed as { bestLevelTimesMs?: unknown[] }).bestLevelTimesMs ?? [])
      : []
    const bestLevelTimesMs = Array.from({ length: LEVELS.length }, (_, i) => {
      const timeMs = bestLevelTimesRaw[i]
      return typeof timeMs === 'number' && Number.isFinite(timeMs) ? Math.max(0, Math.floor(timeMs)) : 0
    })

    const levelAttemptsRaw = Array.isArray((parsed as { levelAttempts?: unknown[] }).levelAttempts)
      ? ((parsed as { levelAttempts?: unknown[] }).levelAttempts ?? [])
      : []
    const levelAttempts = Array.from({ length: LEVELS.length }, (_, i) => {
      const attempts = levelAttemptsRaw[i]
      return typeof attempts === 'number' && Number.isFinite(attempts) ? Math.max(0, Math.floor(attempts)) : 0
    })

    const levelClearsRaw = Array.isArray((parsed as { levelClears?: unknown[] }).levelClears)
      ? ((parsed as { levelClears?: unknown[] }).levelClears ?? [])
      : []
    const levelClears = Array.from({ length: LEVELS.length }, (_, i) => {
      const clears = levelClearsRaw[i]
      return typeof clears === 'number' && Number.isFinite(clears) ? Math.max(0, Math.floor(clears)) : 0
    })

    const cleanLevelClearsRaw = Array.isArray((parsed as { cleanLevelClears?: unknown[] }).cleanLevelClears)
      ? ((parsed as { cleanLevelClears?: unknown[] }).cleanLevelClears ?? [])
      : []
    const cleanLevelClears = Array.from({ length: LEVELS.length }, (_, i) => {
      const clears = cleanLevelClearsRaw[i]
      return typeof clears === 'number' && Number.isFinite(clears) ? Math.max(0, Math.floor(clears)) : 0
    })

    const firstTryLevelClearsRaw = Array.isArray((parsed as { firstTryLevelClears?: unknown[] }).firstTryLevelClears)
      ? ((parsed as { firstTryLevelClears?: unknown[] }).firstTryLevelClears ?? [])
      : []
    const firstTryLevelClears = Array.from({ length: LEVELS.length }, (_, i) => {
      const clears = firstTryLevelClearsRaw[i]
      return typeof clears === 'number' && Number.isFinite(clears) ? Math.max(0, Math.floor(clears)) : 0
    })

    const relicLevelCompletionsRaw = Array.isArray((parsed as { relicLevelCompletions?: unknown[] }).relicLevelCompletions)
      ? ((parsed as { relicLevelCompletions?: unknown[] }).relicLevelCompletions ?? [])
      : []
    const relicLevelCompletions = Array.from({ length: LEVELS.length }, (_, i) => {
      const clears = relicLevelCompletionsRaw[i]
      return typeof clears === 'number' && Number.isFinite(clears) ? Math.max(0, Math.floor(clears)) : 0
    })

    const sDockLevelClearsRaw = Array.isArray((parsed as { sDockLevelClears?: unknown[] }).sDockLevelClears)
      ? ((parsed as { sDockLevelClears?: unknown[] }).sDockLevelClears ?? [])
      : []
    const sDockLevelClears = Array.from({ length: LEVELS.length }, (_, i) => {
      const clears = sDockLevelClearsRaw[i]
      return typeof clears === 'number' && Number.isFinite(clears) ? Math.max(0, Math.floor(clears)) : 0
    })

    return {
      version: SAVE_VERSION,
      unlockedLevel: Phaser.Math.Clamp(Math.floor(parsed.unlockedLevel ?? 1), 1, LEVELS.length),
      highestLevelReached: Phaser.Math.Clamp(Math.floor(parsed.highestLevelReached ?? 1), 1, LEVELS.length),
      bestScore: Math.max(0, Math.floor(parsed.bestScore ?? 0)),
      totalClears: Math.max(0, Math.floor(parsed.totalClears ?? 0)),
      bestStreak: Math.max(0, Math.floor(parsed.bestStreak ?? 0)),
      bestDockGrades,
      bestLevelScores,
      bestLevelTimesMs,
      levelAttempts,
      levelClears,
      cleanLevelClears,
      firstTryLevelClears,
      relicLevelCompletions,
      sDockLevelClears,
      unlockedPowerups,
      selectedPowerup
    }
  }

  private saveSave(data: SaveData) {
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, version: SAVE_VERSION }))
    } catch {
      // keep playable even without storage
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: 960,
  height: 540,
  backgroundColor: '#1a1e3d',
  scene: [EggLanderMissionScene]
})

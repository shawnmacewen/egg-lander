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
  requiredPowerup?: PowerupId
}

type SaveData = {
  version: number
  unlockedLevel: number
  highestLevelReached: number
  bestScore: number
  unlockedPowerups: PowerupId[]
  selectedPowerup: PowerupId | null
}

const SAVE_VERSION = 2
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
    completionScore: 900
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
    completionScore: 1300
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
    requiredPowerup: 'stability-thrusters'
  }
]

const POWERUPS: Record<PowerupId, { name: string; unlockLevel: number; functional: boolean }> = {
  'stability-thrusters': { name: 'Stability Thrusters', unlockLevel: 2, functional: true },
  'shielded-hull': { name: 'Shielded Hull', unlockLevel: 3, functional: false },
  'fuel-gel': { name: 'Fuel Gel', unlockLevel: 3, functional: false }
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
  private statusText!: Phaser.GameObjects.Text
  private hintText!: Phaser.GameObjects.Text

  private planetLayer!: Phaser.GameObjects.Container
  private orbitalLayer!: Phaser.GameObjects.Container
  private planetPad!: Phaser.GameObjects.Rectangle
  private terrain!: Phaser.GameObjects.Rectangle
  private egg!: Phaser.GameObjects.Ellipse
  private runner!: Phaser.GameObjects.Sprite
  private stationRing!: Phaser.GameObjects.Ellipse
  private stationCore!: Phaser.GameObjects.Rectangle
  private dockingTarget!: Phaser.GameObjects.Ellipse
  private dockingGuideOuter!: Phaser.GameObjects.Ellipse
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
    unlockedPowerups: [],
    selectedPowerup: null
  }

  private sessionScore = 0
  private attempts = 0
  private fuel = 100
  private velocity = new Phaser.Math.Vector2(0, 0)

  private runnerSpeed = 210
  private hasEgg = false
  private eggStolen = false
  private bossActive = false
  private bossHp = 0
  private playerHp = 3
  private readonly spears: Array<{ obj: Phaser.GameObjects.Rectangle; vx: number; life: number }> = []
  private readonly bossShots: Array<{ obj: Phaser.GameObjects.Ellipse; vx: number; vy: number; life: number }> = []
  private lastSpearAt = 0
  private lastBossShotAt = 0

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
    this.runner = this.add.sprite(width / 2, height - 48, 'runner-v1', 0).setVisible(false).setScale(0.42)
    this.bossBody = this.add.ellipse(width - 240, height - 52, 66, 66, 0x0c0c0c).setStrokeStyle(4, 0x1f1f1f).setVisible(false)
    this.bossEye = this.add.ellipse(width - 240, height - 52, 18, 18, 0xffffff).setVisible(false)
    this.planetLayer.add([skyBand, sunDisc, farMount, nearMount, eyeTotem, eyePupil, this.terrain, this.planetPad, this.egg, this.bossBody, this.bossEye, this.runner])

    this.orbitalLayer.add([
      this.add.rectangle(width / 2, height / 2, width, height, 0x070b17),
      this.add.ellipse(width / 2 - 180, height / 2 + 120, 560, 220, 0x16213c).setAlpha(0.55),
      this.add.ellipse(width / 2 + 260, height / 2 - 150, 380, 180, 0x111933).setAlpha(0.45)
    ])
    this.stationRing = this.add.ellipse(width - 180, 120, 122, 122, 0x6ea8ff).setStrokeStyle(4, 0xcfe7ff)
    this.stationCore = this.add.rectangle(width - 180, 120, 18, 98, 0xb9c7de)
    this.dockingGuideOuter = this.add.ellipse(width - 180, 120, 78, 78, 0x75ffd2).setAlpha(0.22).setStrokeStyle(2, 0x75ffd2)
    this.dockingTarget = this.add.ellipse(width - 180, 120, 44, 44, 0x9ff6d2).setAlpha(0.7)
    this.orbitalLayer.add([this.stationRing, this.stationCore, this.dockingGuideOuter, this.dockingTarget])

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
    this.hintText = this.add.text(14, 72, '', { fontFamily: 'monospace', fontSize: '14px', color: '#d4d7ff' })

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
        this.beginPlanetBrief()
      }
      if (Phaser.Input.Keyboard.JustDown(this.keyA)) this.cycleSelectedPowerup(-1)
      if (Phaser.Input.Keyboard.JustDown(this.keyD)) this.cycleSelectedPowerup(1)
      return
    }

    if (this.phase === 'planet-brief' && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.phase = 'planet-flying'
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
    this.updateSpears(dt)
    this.updateBossCombat(dt)

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

    this.hintText.setText(
      `Docking: dist ${Math.round(dist)} / ${level.orbitalDockRadius}, speed ${Math.round(speed)} / ${level.orbitalSafeSpeed}, ${aligned ? 'aligned' : 'tilted'}`
    )

    if (dist <= level.orbitalDockRadius && speed <= level.orbitalSafeSpeed && aligned) {
      this.completeLevel()
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

    // Boss appears from level 2 onward.
    this.bossActive = LEVELS[this.levelIndex].id >= 2
    this.bossHp = this.bossActive ? 3 : 0
    this.playerHp = 3
    this.bossBody.setVisible(this.bossActive)
    this.bossEye.setVisible(this.bossActive)
    if (this.bossActive) {
      this.statusText.setText('Landed. Defeat boss with spears, then steal egg')
      this.hintText.setText('On foot: ←/→ run • Space throw spear')
    } else {
      this.statusText.setText('Landed. Exit, steal egg, return')
      this.hintText.setText('On foot: ←/→ run • steal egg then return to lander')
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

    this.statusText.setText('Orbital docking: near-zero-G precision')
    this.hintText.setText('Dock softly and upright inside ring • ↑ thrust • ←/→ rotate')
  }

  private updateBossCombat(dt: number) {
    if (!this.bossActive) return

    const level = LEVELS[this.levelIndex]
    const now = this.time.now
    const fireCadence = level.id >= 3 ? 700 : 950

    if (now - this.lastBossShotAt > fireCadence) {
      this.lastBossShotAt = now
      const dx = this.runner.x - this.bossBody.x
      const dy = this.runner.y - this.bossBody.y
      const dirX = Math.sign(dx) || -1
      const dirY = Phaser.Math.Clamp(dy / 120, -0.75, 0.75)

      const shot = this.add.ellipse(this.bossBody.x, this.bossBody.y, 10, 10, 0xff6a6a).setStrokeStyle(2, 0x3a1111)
      this.planetLayer.add(shot)
      this.bossShots.push({ obj: shot, vx: dirX * 190, vy: dirY * 110, life: 2.2 })

      // Level 3+ gets a second angled shot for pattern pressure.
      if (level.id >= 3) {
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
        this.playerHp -= 1
        this.statusText.setText(`Hit! HP ${this.playerHp}/3`)
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
    this.planetLayer.setVisible(true)
    this.orbitalLayer.setVisible(false)
    this.resetMissionEntities()
    this.statusText.setText(`${level.name}\n1) Land 2) Steal egg 3) Return 4) Take off`)
    this.hintText.setText('Press ↑ to start landing run • R new session')
  }

  private resetMissionEntities() {
    const level = LEVELS[this.levelIndex]
    this.fuel = 100
    this.hasEgg = false
    this.eggStolen = false
    this.egg.setVisible(true)
    this.bossActive = false
    this.bossHp = 0
    this.playerHp = 3
    this.bossBody.setVisible(false)
    this.bossEye.setVisible(false)

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

    this.ship.setPosition(this.scale.width / 2 + Phaser.Math.Between(-120, 120), 90)
    this.ship.setRotation(Phaser.Math.FloatBetween(-0.08, 0.08))
    this.velocity.set(Phaser.Math.FloatBetween(-8, 8), Phaser.Math.FloatBetween(-4, 4))

    this.runner.setVisible(false)
  }

  private failMission(reason: string) {
    this.phase = 'crashed'
    this.attempts += 1
    this.velocity.set(0, 0)
    this.ship.setFillStyle(0xff6b6b)
    this.statusText.setText(`Mission failed: ${reason}`)
    this.hintText.setText('Retrying this level… (R new session)')

    this.time.delayedCall(900, () => {
      this.ship.setFillStyle(0xffe48f)
      this.beginPlanetBrief()
    })
  }

  private completeLevel() {
    const level = LEVELS[this.levelIndex]
    this.phase = 'level-complete'
    this.attempts += 1
    this.velocity.set(0, 0)

    const gained = level.completionScore + Math.round(this.fuel * 0.5)
    this.sessionScore += gained

    const levelNumber = this.levelIndex + 1
    const nextLevel = levelNumber + 1
    if (nextLevel <= LEVELS.length) this.saveData.unlockedLevel = Math.max(this.saveData.unlockedLevel, nextLevel)
    this.saveData.highestLevelReached = Math.max(this.saveData.highestLevelReached, levelNumber)

    this.tryUnlockPowerupsForLevel(levelNumber)
    this.saveData.bestScore = Math.max(this.saveData.bestScore, this.sessionScore)
    this.saveSave(this.saveData)

    this.statusText.setText(`Dock complete! +${gained}\nN next level • L level select`)
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
    this.saveData = this.loadSave()
    this.enterLevelSelect()
  }

  private updateUi() {
    const level = LEVELS[this.levelIndex]
    const powerup = this.saveData.selectedPowerup ? POWERUPS[this.saveData.selectedPowerup].name : 'None'

    this.hudText.setText(
      `Score ${this.sessionScore}   Attempts ${this.attempts}   Fuel ${Math.round(this.fuel)}%   HP ${this.playerHp}   V ${Math.abs(this.velocity.y).toFixed(1)}   H ${Math.abs(this.velocity.x).toFixed(1)}   PWR ${powerup}`
    )
    const required = level.requiredPowerup ? POWERUPS[level.requiredPowerup].name : 'None'
    this.levelText.setText(
      `Level ${level.id}/${LEVELS.length}: ${level.name}   Requires ${required}   Unlocked ${this.saveData.unlockedLevel}/${LEVELS.length}   Best ${this.saveData.bestScore}`
    )

    let objective = 'Land on planet, grab egg on foot, return, launch, then precision dock in orbit.'
    if (this.phase === 'on-foot' && !this.hasEgg) {
      objective = this.bossActive ? 'Defeat boss with Space spears, then steal egg.' : 'Run right to steal egg.'
    }
    if (this.phase === 'on-foot' && this.hasEgg) objective = 'Run back left to board lander with egg.'
    if (this.phase === 'orbital-docking') objective = 'Near-zero-G docking: low speed + upright alignment in ring.'

    this.objectiveText.setText(`Objective: ${objective}`)
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
      unlockedPowerups: [],
      selectedPowerup: null
    }

    try {
      const raw = window.localStorage.getItem(SAVE_KEY) ?? window.localStorage.getItem('egg-lander-save-v1')
      if (!raw) return fallback

      const parsed = JSON.parse(raw) as Partial<SaveData>
      const unlockedPowerupsRaw = Array.isArray(parsed.unlockedPowerups) ? parsed.unlockedPowerups : []
      const unlockedPowerups = unlockedPowerupsRaw.filter((id): id is PowerupId => id in POWERUPS)
      const selectedPowerup = parsed.selectedPowerup && parsed.selectedPowerup in POWERUPS ? (parsed.selectedPowerup as PowerupId) : null

      return {
        version: SAVE_VERSION,
        unlockedLevel: Phaser.Math.Clamp(Math.floor(parsed.unlockedLevel ?? 1), 1, LEVELS.length),
        highestLevelReached: Phaser.Math.Clamp(Math.floor(parsed.highestLevelReached ?? 1), 1, LEVELS.length),
        bestScore: Math.max(0, Math.floor(parsed.bestScore ?? 0)),
        unlockedPowerups,
        selectedPowerup
      }
    } catch {
      return fallback
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

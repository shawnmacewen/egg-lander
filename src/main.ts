import './style.css'
import Phaser from 'phaser'

type RoundState = 'flying' | 'landed' | 'crashed' | 'campaign-complete'

type LevelConfig = {
  id: number
  name: string
  objective: string
  gravity: number
  thrust: number
  fuelBurnPerSecond: number
  padWidth: number
  startY: number
  safeVertical: number
  safeHorizontal: number
  safeAngle: number
  completionScore: number
}

type SaveData = {
  unlockedLevel: number
  highestLevelReached: number
  bestScore: number
}

const SAVE_KEY = 'egg-lander-save-v1'

const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Level 1 — Warmup',
    objective: 'Touch down anywhere on the big pad.',
    gravity: 245,
    thrust: 430,
    fuelBurnPerSecond: 20,
    padWidth: 190,
    startY: 98,
    safeVertical: 112,
    safeHorizontal: 82,
    safeAngle: 0.66,
    completionScore: 800
  },
  {
    id: 2,
    name: 'Level 2 — Crosswind',
    objective: 'Land with less drift on a smaller pad.',
    gravity: 285,
    thrust: 445,
    fuelBurnPerSecond: 24,
    padWidth: 150,
    startY: 84,
    safeVertical: 102,
    safeHorizontal: 72,
    safeAngle: 0.6,
    completionScore: 1200
  },
  {
    id: 3,
    name: 'Level 3 — Crunch Time',
    objective: 'Fast gravity, tight pad. Keep it smooth.',
    gravity: 330,
    thrust: 460,
    fuelBurnPerSecond: 28,
    padWidth: 120,
    startY: 70,
    safeVertical: 92,
    safeHorizontal: 62,
    safeAngle: 0.55,
    completionScore: 1700
  }
]

class EggLanderScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private resetKey!: Phaser.Input.Keyboard.Key

  private ship!: Phaser.GameObjects.Triangle
  private thruster!: Phaser.GameObjects.Triangle

  private statusText!: Phaser.GameObjects.Text
  private hudText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text
  private objectiveText!: Phaser.GameObjects.Text
  private hintText!: Phaser.GameObjects.Text

  private nearMountains!: Phaser.GameObjects.Rectangle
  private farMountains!: Phaser.GameObjects.Rectangle
  private cloudA!: Phaser.GameObjects.Ellipse
  private cloudB!: Phaser.GameObjects.Ellipse
  private landingPad!: Phaser.GameObjects.Rectangle

  private velocity = new Phaser.Math.Vector2(0, 0)
  private state: RoundState = 'flying'

  private sessionScore = 0
  private attempts = 0
  private fuel = 100
  private currentLevelIndex = 0

  private saveData: SaveData = {
    unlockedLevel: 1,
    highestLevelReached: 1,
    bestScore: 0
  }

  private readonly rotationSpeed = 2.7

  constructor() {
    super('EggLanderScene')
  }

  create() {
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1e3d)
    this.add.rectangle(width / 2, height - 180, width + 100, 230, 0x353b82).setAlpha(0.45)

    this.farMountains = this.add.rectangle(width / 2, height - 96, width + 160, 130, 0x40316f).setAlpha(0.95)
    this.nearMountains = this.add.rectangle(width / 2, height - 62, width + 220, 110, 0x2b204f)

    this.cloudA = this.add.ellipse(220, 118, 240, 46, 0x626bd1).setAlpha(0.35)
    this.cloudB = this.add.ellipse(720, 162, 200, 40, 0x7b87e3).setAlpha(0.25)

    this.add.rectangle(width / 2, height - 8, width, 16, 0x171135)
    this.landingPad = this.add.rectangle(width / 2, height - 25, 170, 16, 0xc9f25a).setStrokeStyle(3, 0x151515)

    this.ship = this.add.triangle(width / 2, 96, 0, 28, 20, -20, -20, -20, 0xffe48f)
    this.ship.setStrokeStyle(4, 0x0f0f0f)

    this.thruster = this.add.triangle(this.ship.x, this.ship.y + 24, 0, 0, 8, 18, -8, 18, 0xff7a3d)
    this.thruster.setVisible(false)

    this.statusText = this.add
      .text(width / 2, height / 2 - 30, 'READY', {
        fontFamily: 'monospace',
        fontSize: '34px',
        color: '#f5f5f5'
      })
      .setOrigin(0.5)
      .setAlpha(0)

    this.hudText = this.add.text(14, 10, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#f8f8f8'
    })

    this.levelText = this.add.text(14, 32, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#e8ebff'
    })

    this.objectiveText = this.add.text(14, 52, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#d6daff'
    })

    this.hintText = this.add.text(14, 74, '← → rotate • ↑ thrust • R new session', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#d4d7ff'
    })

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.resetKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R)

    this.saveData = this.loadSave()
    this.startNewSession()
  }

  update(_: number, deltaMs: number) {
    const dt = deltaMs / 1000

    if (Phaser.Input.Keyboard.JustDown(this.resetKey)) {
      this.startNewSession()
      return
    }

    this.animateBackground(dt)

    if (this.state !== 'flying') {
      this.thruster.setVisible(false)
      return
    }

    const level = LEVELS[this.currentLevelIndex]

    this.velocity.y += level.gravity * dt

    if (this.cursors.left?.isDown) this.ship.rotation -= this.rotationSpeed * dt
    if (this.cursors.right?.isDown) this.ship.rotation += this.rotationSpeed * dt

    let thrusting = false
    if (this.cursors.up?.isDown && this.fuel > 0) {
      const direction = this.ship.rotation - Math.PI / 2
      this.velocity.x += Math.cos(direction) * level.thrust * dt
      this.velocity.y += Math.sin(direction) * level.thrust * dt
      this.fuel = Math.max(0, this.fuel - level.fuelBurnPerSecond * dt)
      thrusting = true
    }

    this.thruster
      .setVisible(thrusting)
      .setPosition(this.ship.x + Math.cos(this.ship.rotation + Math.PI / 2) * 18, this.ship.y + Math.sin(this.ship.rotation + Math.PI / 2) * 18)
      .setRotation(this.ship.rotation)
      .setScale(1, 0.9 + Math.random() * 0.55)

    this.ship.x += this.velocity.x * dt
    this.ship.y += this.velocity.y * dt

    const { width, height } = this.scale
    if (this.ship.x < -10) this.ship.x = width + 10
    if (this.ship.x > width + 10) this.ship.x = -10

    if (this.ship.y < 18) {
      this.ship.y = 18
      this.velocity.y = Math.max(this.velocity.y, 0)
    }

    if (this.ship.y >= height - 34) {
      this.evaluateLanding(level)
    }

    this.updateHud()
  }

  private animateBackground(dt: number) {
    const vx = this.velocity.x
    this.farMountains.x -= vx * dt * 0.035
    this.nearMountains.x -= vx * dt * 0.07
    this.cloudA.x -= 7 * dt
    this.cloudB.x -= 11 * dt

    const { width } = this.scale
    if (this.cloudA.x < -120) this.cloudA.x = width + 120
    if (this.cloudB.x < -100) this.cloudB.x = width + 100

    const center = width / 2
    this.farMountains.x = Phaser.Math.Clamp(this.farMountains.x, center - 36, center + 36)
    this.nearMountains.x = Phaser.Math.Clamp(this.nearMountains.x, center - 56, center + 56)
  }

  private evaluateLanding(level: LevelConfig) {
    const { width, height } = this.scale
    this.ship.y = height - 34

    const onPad = Math.abs(this.ship.x - width / 2) <= level.padWidth / 2
    const safeVertical = Math.abs(this.velocity.y) <= level.safeVertical
    const safeHorizontal = Math.abs(this.velocity.x) <= level.safeHorizontal
    const upright = Math.abs(Phaser.Math.Angle.Wrap(this.ship.rotation)) <= level.safeAngle

    if (onPad && safeVertical && safeHorizontal && upright) {
      this.completeLevel(level)
      return
    }

    const reason = !onPad
      ? 'Missed pad'
      : !upright
        ? 'Too tilted'
        : Math.abs(this.velocity.y) > level.safeVertical
          ? 'Too fast down'
          : 'Too much drift'

    this.crash(reason)
  }

  private completeLevel(level: LevelConfig) {
    this.state = 'landed'
    this.attempts += 1
    this.velocity.set(0, 0)
    this.ship.rotation *= 0.15

    const fuelBonus = Math.round(this.fuel * 0.45)
    const gained = level.completionScore + fuelBonus
    this.sessionScore += gained

    const levelNumber = this.currentLevelIndex + 1
    const nextLevel = levelNumber + 1

    if (nextLevel <= LEVELS.length && this.saveData.unlockedLevel < nextLevel) {
      this.saveData.unlockedLevel = nextLevel
    }
    this.saveData.highestLevelReached = Math.max(this.saveData.highestLevelReached, levelNumber)
    this.saveSave(this.saveData)

    if (this.currentLevelIndex < LEVELS.length - 1) {
      this.statusText
        .setText(`LEVEL CLEAR +${gained}`)
        .setColor('#b9ff71')
        .setAlpha(1)
        .setStroke('#0f0f0f', 6)

      this.currentLevelIndex += 1
      this.hintText.setText('Level cleared. Press ↑ to continue to next level, or R for new session.')
      this.prepareRoundForCurrentLevel()
      return
    }

    this.state = 'campaign-complete'
    this.saveData.bestScore = Math.max(this.saveData.bestScore, this.sessionScore)
    this.saveSave(this.saveData)

    this.statusText
      .setText(`SESSION CLEAR! SCORE ${this.sessionScore}`)
      .setColor('#b9ff71')
      .setAlpha(1)
      .setStroke('#0f0f0f', 6)

    this.hintText.setText('All levels complete. Press R to start a fresh session.')
    this.updateHud()
    this.updateLevelUi()
  }

  private crash(reason: string) {
    this.state = 'crashed'
    this.attempts += 1
    this.velocity.set(0, 0)

    this.ship.setFillStyle(0xff6b6b)

    this.statusText
      .setText(`CRASHED: ${reason}`)
      .setColor('#ff6b6b')
      .setAlpha(1)
      .setStroke('#0f0f0f', 6)

    this.hintText.setText('Crash! Auto-retrying this level… (R starts a fresh session)')

    this.time.delayedCall(700, () => {
      if (this.state === 'crashed') {
        this.state = 'flying'
        this.prepareRoundForCurrentLevel()
      }
    })

    this.updateHud()
  }

  private startNewSession() {
    if (this.sessionScore > 0) {
      const latestSave = this.loadSave()
      latestSave.bestScore = Math.max(latestSave.bestScore, this.sessionScore)
      this.saveSave(latestSave)
    }

    this.state = 'flying'
    this.sessionScore = 0
    this.attempts = 0
    this.currentLevelIndex = 0
    this.saveData = this.loadSave()

    this.statusText.setText('NEW SESSION').setColor('#f5f5f5').setAlpha(0)
    this.hintText.setText('← → rotate • ↑ thrust • R new session')

    this.prepareRoundForCurrentLevel()
    this.updateHud()
    this.updateLevelUi()
  }

  private prepareRoundForCurrentLevel() {
    const level = LEVELS[this.currentLevelIndex]
    const { width } = this.scale

    this.state = 'flying'
    this.fuel = 100
    this.landingPad.setSize(level.padWidth, 16)

    this.ship
      .setPosition(width / 2 + Phaser.Math.Between(-180, 180), level.startY)
      .setRotation(Phaser.Math.FloatBetween(-0.12, 0.12))
      .setFillStyle(0xffe48f)

    this.velocity.set(Phaser.Math.FloatBetween(-10, 10), Phaser.Math.FloatBetween(-6, 6))
    this.statusText.setAlpha(0)

    this.updateHud()
    this.updateLevelUi()
  }

  private updateHud() {
    const level = LEVELS[this.currentLevelIndex]
    const speedY = Math.abs(this.velocity.y).toFixed(1)
    const speedX = Math.abs(this.velocity.x).toFixed(1)

    this.hudText.setText(
      `Session Score ${this.sessionScore}   Attempts ${this.attempts}   Fuel ${Math.round(this.fuel)}%   L${level.id} V ${speedY}   H ${speedX}`
    )
  }

  private updateLevelUi() {
    const level = LEVELS[this.currentLevelIndex]
    this.levelText.setText(
      `${level.name}   Unlocked: ${this.saveData.unlockedLevel}/${LEVELS.length}   Highest: ${this.saveData.highestLevelReached}   Best Score: ${this.saveData.bestScore}`
    )
    this.objectiveText.setText(`Objective: ${level.objective}`)
  }

  private loadSave(): SaveData {
    const fallback: SaveData = {
      unlockedLevel: 1,
      highestLevelReached: 1,
      bestScore: 0
    }

    try {
      const raw = window.localStorage.getItem(SAVE_KEY)
      if (!raw) return fallback

      const parsed = JSON.parse(raw) as Partial<SaveData>
      return {
        unlockedLevel: Phaser.Math.Clamp(Math.floor(parsed.unlockedLevel ?? 1), 1, LEVELS.length),
        highestLevelReached: Phaser.Math.Clamp(Math.floor(parsed.highestLevelReached ?? 1), 1, LEVELS.length),
        bestScore: Math.max(0, Math.floor(parsed.bestScore ?? 0))
      }
    } catch {
      return fallback
    }
  }

  private saveSave(data: SaveData) {
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    } catch {
      // Keep game playable even if storage is unavailable.
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: 960,
  height: 540,
  backgroundColor: '#1a1e3d',
  scene: [EggLanderScene]
})

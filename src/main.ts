import './style.css'
import Phaser from 'phaser'

type RoundState = 'flying' | 'landed' | 'crashed'

class EggLanderScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private resetKey!: Phaser.Input.Keyboard.Key

  private ship!: Phaser.GameObjects.Triangle
  private thruster!: Phaser.GameObjects.Triangle

  private statusText!: Phaser.GameObjects.Text
  private hudText!: Phaser.GameObjects.Text
  private hintText!: Phaser.GameObjects.Text

  private nearMountains!: Phaser.GameObjects.Rectangle
  private farMountains!: Phaser.GameObjects.Rectangle
  private cloudA!: Phaser.GameObjects.Ellipse
  private cloudB!: Phaser.GameObjects.Ellipse

  private velocity = new Phaser.Math.Vector2(0, 0)
  private score = 0
  private attempts = 0
  private fuel = 100
  private state: RoundState = 'flying'

  private readonly gravity = 260
  private readonly rotationSpeed = 2.7
  private readonly thrust = 430
  private readonly fuelBurnPerSecond = 24

  constructor() {
    super('EggLanderScene')
  }

  create() {
    const { width, height } = this.scale

    // Background: simple colorful palette + bold silhouettes
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1e3d)
    this.add.rectangle(width / 2, height - 180, width + 100, 230, 0x353b82).setAlpha(0.45)

    this.farMountains = this.add.rectangle(width / 2, height - 96, width + 160, 130, 0x40316f).setAlpha(0.95)
    this.nearMountains = this.add.rectangle(width / 2, height - 62, width + 220, 110, 0x2b204f)

    this.cloudA = this.add.ellipse(220, 118, 240, 46, 0x626bd1).setAlpha(0.35)
    this.cloudB = this.add.ellipse(720, 162, 200, 40, 0x7b87e3).setAlpha(0.25)

    // Ground + landing pad
    this.add.rectangle(width / 2, height - 8, width, 16, 0x171135)
    this.add.rectangle(width / 2, height - 25, 170, 16, 0xc9f25a).setStrokeStyle(3, 0x151515)

    // Ship (egg-like body + simple thruster flame)
    this.ship = this.add.triangle(width / 2, 96, 0, 28, 20, -20, -20, -20, 0xffe48f)
    this.ship.setStrokeStyle(4, 0x0f0f0f)

    this.thruster = this.add.triangle(this.ship.x, this.ship.y + 24, 0, 0, 8, 18, -8, 18, 0xff7a3d)
    this.thruster.setVisible(false)

    this.statusText = this.add
      .text(width / 2, height / 2 - 30, 'READY', {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: '#f5f5f5'
      })
      .setOrigin(0.5)
      .setAlpha(0)

    this.hudText = this.add.text(14, 10, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#f8f8f8'
    })

    this.hintText = this.add.text(14, 32, '← → rotate • ↑ thrust • R reset run', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#d4d7ff'
    })

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.resetKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R)

    this.input.keyboard?.on('keydown-R', () => this.resetRound())

    this.resetRound(true)
  }

  update(_: number, deltaMs: number) {
    const dt = deltaMs / 1000

    if (Phaser.Input.Keyboard.JustDown(this.resetKey)) {
      this.resetRound()
    }

    this.animateBackground(dt)

    if (this.state !== 'flying') {
      this.thruster.setVisible(false)
      return
    }

    this.velocity.y += this.gravity * dt

    if (this.cursors.left?.isDown) this.ship.rotation -= this.rotationSpeed * dt
    if (this.cursors.right?.isDown) this.ship.rotation += this.rotationSpeed * dt

    let thrusting = false
    if (this.cursors.up?.isDown && this.fuel > 0) {
      const direction = this.ship.rotation - Math.PI / 2
      this.velocity.x += Math.cos(direction) * this.thrust * dt
      this.velocity.y += Math.sin(direction) * this.thrust * dt
      this.fuel = Math.max(0, this.fuel - this.fuelBurnPerSecond * dt)
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

    // Horizontal wrap keeps flow active and forgiving
    if (this.ship.x < -10) this.ship.x = width + 10
    if (this.ship.x > width + 10) this.ship.x = -10

    if (this.ship.y < 18) {
      this.ship.y = 18
      this.velocity.y = Math.max(this.velocity.y, 0)
    }

    if (this.ship.y >= height - 34) {
      this.evaluateLanding()
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

    // keep layers centered in bounded drift
    const center = width / 2
    this.farMountains.x = Phaser.Math.Clamp(this.farMountains.x, center - 36, center + 36)
    this.nearMountains.x = Phaser.Math.Clamp(this.nearMountains.x, center - 56, center + 56)
  }

  private evaluateLanding() {
    const { width, height } = this.scale
    this.ship.y = height - 34

    const onPad = Math.abs(this.ship.x - width / 2) <= 85
    const safeVertical = Math.abs(this.velocity.y) < 76
    const safeHorizontal = Math.abs(this.velocity.x) < 52
    const upright = Math.abs(Phaser.Math.Angle.Wrap(this.ship.rotation)) < 0.38

    if (onPad && safeVertical && safeHorizontal && upright) {
      this.land()
    } else {
      const reason = !onPad
        ? 'Missed pad'
        : !upright
          ? 'Bad angle'
          : Math.abs(this.velocity.y) >= 76
            ? 'Too fast down'
            : 'Too much drift'
      this.crash(reason)
    }
  }

  private land() {
    this.state = 'landed'
    this.attempts += 1

    const verticalBonus = Math.max(0, 100 - Math.abs(this.velocity.y))
    const horizontalBonus = Math.max(0, 50 - Math.abs(this.velocity.x))
    const fuelBonus = Math.round(this.fuel)
    const gained = Math.round(100 + verticalBonus + horizontalBonus + fuelBonus)

    this.score += gained
    this.velocity.set(0, 0)
    this.ship.rotation *= 0.15

    this.statusText
      .setText(`LANDED +${gained}`)
      .setColor('#b9ff71')
      .setAlpha(1)
      .setStroke('#0f0f0f', 6)

    this.hintText.setText('Smooth touchdown. Press R for next attempt.')
    this.updateHud()
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

    this.hintText.setText('Adjust speed + angle. Press R to retry.')
    this.updateHud()
  }

  private resetRound(initial = false) {
    const { width } = this.scale
    this.state = 'flying'
    this.fuel = 100

    this.ship
      .setPosition(width / 2 + Phaser.Math.Between(-180, 180), 94)
      .setRotation(Phaser.Math.FloatBetween(-0.1, 0.1))
      .setFillStyle(0xffe48f)

    this.velocity.set(Phaser.Math.FloatBetween(-12, 12), Phaser.Math.FloatBetween(-8, 8))

    this.statusText.setAlpha(0)
    this.hintText.setText('← → rotate • ↑ thrust • R reset run')

    if (initial) {
      this.statusText.setText('READY').setColor('#f5f5f5')
    }

    this.updateHud()
  }

  private updateHud() {
    const speedY = Math.abs(this.velocity.y).toFixed(1)
    const speedX = Math.abs(this.velocity.x).toFixed(1)
    this.hudText.setText(
      `Score ${this.score}   Attempts ${this.attempts}   Fuel ${Math.round(this.fuel)}%   V ${speedY}   H ${speedX}`
    )
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

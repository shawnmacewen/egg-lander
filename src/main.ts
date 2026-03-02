import './style.css'
import Phaser from 'phaser'

class EggLanderScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private ship!: Phaser.GameObjects.Triangle
  private velocity = new Phaser.Math.Vector2(0, 0)
  private fuel = 100
  private landed = false

  constructor() {
    super('EggLanderScene')
  }

  create() {
    const { width, height } = this.scale

    // Parallax background layers (simple, clean silhouettes)
    this.add.rectangle(width / 2, height / 2, width, height, 0x1b1d3a)
    this.add.rectangle(width / 2, height - 110, width * 1.15, 160, 0x2a2f62).setAlpha(0.65)
    this.add.rectangle(width / 2, height - 70, width * 1.2, 120, 0x4b3d7a).setAlpha(0.9)

    // Landing pad
    this.add.rectangle(width / 2, height - 24, 140, 14, 0x8ae234)

    // Ship (egg-ish minimal style)
    this.ship = this.add.triangle(width / 2, 80, 0, 24, 18, -18, -18, -18, 0xffe082)
    this.ship.setStrokeStyle(3, 0x121212)

    this.cursors = this.input.keyboard!.createCursorKeys()

    this.add.text(16, 12, 'Egg Lander • Phaser Scaffold', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#f8f8f2'
    })

    this.add.text(16, 36, 'Controls: ← → rotate, ↑ thrust, R reset', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#f8f8f2'
    })

    this.input.keyboard?.on('keydown-R', () => this.scene.restart())
  }

  update(_: number, deltaMs: number) {
    if (this.landed) return

    const dt = deltaMs / 1000
    const gravity = 250

    this.velocity.y += gravity * dt

    if (this.cursors.left?.isDown) this.ship.rotation -= 2.2 * dt
    if (this.cursors.right?.isDown) this.ship.rotation += 2.2 * dt

    if (this.cursors.up?.isDown && this.fuel > 0) {
      const thrust = 360
      this.velocity.x += Math.cos(this.ship.rotation - Math.PI / 2) * thrust * dt
      this.velocity.y += Math.sin(this.ship.rotation - Math.PI / 2) * thrust * dt
      this.fuel = Math.max(0, this.fuel - 20 * dt)
    }

    this.ship.x += this.velocity.x * dt
    this.ship.y += this.velocity.y * dt

    const { width, height } = this.scale

    // World bounds checks
    if (this.ship.x < 0 || this.ship.x > width || this.ship.y < 0) {
      this.crash('Out of bounds')
      return
    }

    // Ground / pad check
    if (this.ship.y >= height - 32) {
      const onPad = Math.abs(this.ship.x - width / 2) <= 70
      const safeVertical = Math.abs(this.velocity.y) < 70
      const safeHorizontal = Math.abs(this.velocity.x) < 45
      const upright = Math.abs(Phaser.Math.Angle.Wrap(this.ship.rotation)) < 0.35

      if (onPad && safeVertical && safeHorizontal && upright) {
        this.land()
      } else {
        this.crash('Hard landing')
      }
    }
  }

  private land() {
    this.landed = true
    this.velocity.set(0, 0)
    this.add.text(this.scale.width / 2 - 70, this.scale.height / 2 - 20, 'LANDED ✅', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#8ae234'
    })
  }

  private crash(reason: string) {
    this.landed = true
    this.add.text(this.scale.width / 2 - 100, this.scale.height / 2 - 20, `CRASH 💥 (${reason})`, {
      fontFamily: 'monospace',
      fontSize: '26px',
      color: '#ff6b6b'
    })
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: 960,
  height: 540,
  backgroundColor: '#1b1d3a',
  scene: [EggLanderScene]
})

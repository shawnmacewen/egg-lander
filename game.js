const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;
const GROUND_Y = H - 70;

const state = {
  attempts: 0,
  bestLandingSpeed: null,
  running: true,
  message: 'Land gently on the nest.',
};

const lander = {
  x: 120,
  y: 80,
  vx: 0,
  vy: 0,
  angle: 0,
  fuel: 100,
  radius: 16,
  thrusting: false,
};

const physics = {
  gravity: 0.19,
  thrustPower: 0.33,
  rotateSpeed: 0.04,
  drag: 0.999,
  safeLandingSpeed: 2.1,
  safeLandingAngle: 0.22,
};

const pad = {
  x: W - 180,
  y: GROUND_Y,
  width: 120,
  height: 8,
};

const keys = new Set();

function resetRun() {
  lander.x = 120;
  lander.y = 80;
  lander.vx = 0;
  lander.vy = 0;
  lander.angle = 0;
  lander.fuel = 100;
  lander.thrusting = false;
  state.running = true;
  state.message = 'Land gently on the nest.';
}

function crash(msg) {
  state.running = false;
  state.attempts += 1;
  state.message = msg + ' Press R to retry.';
}

function win() {
  state.running = false;
  state.attempts += 1;
  const speed = Math.hypot(lander.vx, lander.vy);
  state.bestLandingSpeed = state.bestLandingSpeed == null
    ? speed
    : Math.min(speed, state.bestLandingSpeed);
  state.message = `Smooth landing! speed ${speed.toFixed(2)}. Press R to play again.`;
}

function update() {
  if (!state.running) return;

  if (keys.has('ArrowLeft')) {
    lander.angle -= physics.rotateSpeed;
  }
  if (keys.has('ArrowRight')) {
    lander.angle += physics.rotateSpeed;
  }
  lander.angle = Math.max(-0.9, Math.min(0.9, lander.angle));

  lander.thrusting = false;
  if (keys.has('ArrowUp') && lander.fuel > 0) {
    lander.thrusting = true;
    lander.fuel = Math.max(0, lander.fuel - 0.25);
    lander.vx += Math.sin(lander.angle) * physics.thrustPower;
    lander.vy -= Math.cos(lander.angle) * physics.thrustPower;
  }

  lander.vy += physics.gravity;
  lander.vx *= physics.drag;
  lander.vy *= physics.drag;

  lander.x += lander.vx;
  lander.y += lander.vy;

  if (lander.x - lander.radius < 0 || lander.x + lander.radius > W) {
    crash('You hit the wall.');
  }

  if (lander.y - lander.radius < 0) {
    crash('You flew too high and lost control.');
  }

  const touchingGround = lander.y + lander.radius >= GROUND_Y;
  if (touchingGround) {
    const onPad = lander.x > pad.x && lander.x < pad.x + pad.width;
    const speed = Math.hypot(lander.vx, lander.vy);
    const angleSafe = Math.abs(lander.angle) <= physics.safeLandingAngle;
    const speedSafe = speed <= physics.safeLandingSpeed;

    if (onPad && angleSafe && speedSafe) {
      lander.y = GROUND_Y - lander.radius;
      lander.vx = 0;
      lander.vy = 0;
      win();
      return;
    }

    crash(onPad ? 'Too fast or too tilted — cracked!' : 'Missed the nest and cracked!');
  }
}

function drawEgg(x, y, angle, thrusting) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 18, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#f8f2de';
  ctx.fill();

  ctx.strokeStyle = '#c9bd97';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(-4, -4, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#6b5f40';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(4, -4, 2, 0, Math.PI * 2);
  ctx.fill();

  if (thrusting) {
    ctx.beginPath();
    ctx.moveTo(-6, 18);
    ctx.lineTo(0, 18 + 10 + Math.random() * 8);
    ctx.lineTo(6, 18);
    ctx.closePath();
    ctx.fillStyle = '#ff8c42';
    ctx.fill();
  }

  ctx.restore();
}

function drawHud() {
  const speed = Math.hypot(lander.vx, lander.vy);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(10, 10, 260, 100);

  ctx.fillStyle = '#eaf2ff';
  ctx.font = '16px monospace';
  ctx.fillText(`Fuel: ${lander.fuel.toFixed(0)}%`, 20, 32);
  ctx.fillText(`Speed: ${speed.toFixed(2)}`, 20, 54);
  ctx.fillText(`Attempts: ${state.attempts}`, 20, 76);
  const best = state.bestLandingSpeed == null ? '-' : state.bestLandingSpeed.toFixed(2);
  ctx.fillText(`Best landing: ${best}`, 20, 98);

  ctx.textAlign = 'center';
  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(state.message, W / 2, 32);
  ctx.textAlign = 'start';
}

function drawScene() {
  ctx.clearRect(0, 0, W, H);

  for (let i = 0; i < 35; i++) {
    const sx = (i * 137) % W;
    const sy = (i * 83) % (GROUND_Y - 80);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(sx, sy, 2, 2);
  }

  ctx.fillStyle = '#2a5f2b';
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

  ctx.fillStyle = '#8e6239';
  ctx.fillRect(pad.x, pad.y, pad.width, pad.height);
  ctx.fillStyle = '#d0b08e';
  ctx.fillRect(pad.x + 10, pad.y - 8, pad.width - 20, 6);

  drawEgg(lander.x, lander.y, lander.angle, lander.thrusting);
  drawHud();
}

function loop() {
  update();
  drawScene();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    resetRun();
    return;
  }
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(e.key)) {
    keys.add(e.key);
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.key);
});

resetRun();
loop();

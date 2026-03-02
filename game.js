const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;
const GROUND_Y = H - 72;

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

  if (keys.has('ArrowLeft')) lander.angle -= physics.rotateSpeed;
  if (keys.has('ArrowRight')) lander.angle += physics.rotateSpeed;
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

  if (lander.x - lander.radius < 0 || lander.x + lander.radius > W) crash('You hit the wall.');
  if (lander.y - lander.radius < 0) crash('You flew too high and lost control.');

  if (lander.y + lander.radius >= GROUND_Y) {
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

function drawParallaxLayer(yBase, height, color, speedFactor, bump) {
  const offset = -((lander.x * speedFactor) % (W + 160));
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = -200; x <= W + 220; x += 80) {
    const localX = x + offset;
    const peak = yBase + Math.sin((x + offset) * 0.03) * bump;
    ctx.lineTo(localX, peak);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  ctx.fillRect(0, yBase, W, height);
}

function drawTotems(speedFactor, color, y, height) {
  const offset = -((lander.x * speedFactor) % 120);
  ctx.fillStyle = color;
  for (let x = -40; x < W + 80; x += 120) {
    const tx = x + offset;
    ctx.fillRect(tx, y, 12, height);
    ctx.beginPath();
    ctx.arc(tx + 6, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f7f0ca';
    ctx.fillRect(tx + 3, y - 3, 2, 2);
    ctx.fillRect(tx + 7, y - 3, 2, 2);
    ctx.fillStyle = color;
  }
}

function drawEgg(x, y, angle, thrusting) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = '#1b1b1b';
  ctx.fillRect(-16, 14, 32, 8);

  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 18, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#f9f3dc';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1b1b1b';
  ctx.stroke();

  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath();
  ctx.arc(-4, -4, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(4, -4, 2.3, 0, Math.PI * 2);
  ctx.fill();

  if (thrusting) {
    ctx.fillStyle = '#ff8f2f';
    ctx.beginPath();
    ctx.moveTo(-7, 22);
    ctx.lineTo(0, 31 + Math.random() * 9);
    ctx.lineTo(7, 22);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.moveTo(-4, 22);
    ctx.lineTo(0, 28 + Math.random() * 5);
    ctx.lineTo(4, 22);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawHud() {
  const speed = Math.hypot(lander.vx, lander.vy);

  ctx.fillStyle = '#111';
  ctx.fillRect(12, 12, 280, 104);
  ctx.strokeStyle = '#f3d24f';
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, 280, 104);

  ctx.font = 'bold 15px Trebuchet MS, sans-serif';
  ctx.fillStyle = '#f8f4dd';
  ctx.fillText(`FUEL ${lander.fuel.toFixed(0)}%`, 24, 36);
  ctx.fillText(`SPD ${speed.toFixed(2)}`, 24, 58);
  ctx.fillText(`TRY ${state.attempts}`, 24, 80);
  const best = state.bestLandingSpeed == null ? '-' : state.bestLandingSpeed.toFixed(2);
  ctx.fillText(`BEST ${best}`, 24, 102);

  const barX = 150;
  const barY = 26;
  const barW = 126;
  ctx.fillStyle = '#282828';
  ctx.fillRect(barX, barY, barW, 16);
  ctx.fillStyle = lander.fuel > 35 ? '#80d957' : '#ff9251';
  ctx.fillRect(barX + 2, barY + 2, (barW - 4) * (lander.fuel / 100), 12);
  ctx.strokeStyle = '#f8f4dd';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barW, 16);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f0f0f';
  ctx.fillRect(250, 14, 536, 34);
  ctx.strokeStyle = '#56b8f5';
  ctx.strokeRect(250, 14, 536, 34);
  ctx.fillStyle = '#f5f0dc';
  ctx.font = 'bold 19px Trebuchet MS, sans-serif';
  ctx.fillText(state.message, W / 2 + 118, 37);
  ctx.textAlign = 'start';
}

function drawScene() {
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = '#223a5f';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#f7ce5c';
  ctx.beginPath();
  ctx.arc(660, 92, 44, 0, Math.PI * 2);
  ctx.fill();

  drawParallaxLayer(230, H - 230, '#2e4b7f', 0.12, 16);
  drawTotems(0.18, '#0f1a2e', 245, 44);
  drawParallaxLayer(290, H - 290, '#24385c', 0.24, 22);
  drawTotems(0.34, '#101010', 302, 62);

  ctx.fillStyle = '#3f7b3c';
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, GROUND_Y - 6, W, 6);

  ctx.fillStyle = '#7a4b2d';
  ctx.fillRect(pad.x, pad.y, pad.width, pad.height);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 3;
  ctx.strokeRect(pad.x, pad.y, pad.width, pad.height);
  ctx.fillStyle = '#d8b783';
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

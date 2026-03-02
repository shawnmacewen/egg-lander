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
  state.message = `${msg} Press R to retry.`;
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

function drawParallaxLayer(config) {
  const {
    yBase, fill, speedFactor, bump, step,
  } = config;

  const offset = -((lander.x * speedFactor) % (W + step * 2));
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(0, H);

  for (let x = -step * 2; x <= W + step * 2; x += step) {
    const localX = x + offset;
    const wave = Math.sin((x + offset) * 0.026) * bump;
    ctx.lineTo(localX, yBase + wave);
  }

  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
}

function drawTotems(speedFactor, color, y, height, eyeColor = '#f8efcf') {
  const spacing = 124;
  const offset = -((lander.x * speedFactor) % spacing);

  for (let x = -60; x < W + spacing; x += spacing) {
    const tx = x + offset;
    ctx.fillStyle = color;
    ctx.fillRect(tx, y, 14, height);

    ctx.beginPath();
    ctx.arc(tx + 7, y, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = eyeColor;
    ctx.fillRect(tx + 3, y - 4, 3, 3);
    ctx.fillRect(tx + 8, y - 4, 3, 3);
  }
}

function drawSkyDecor() {
  ctx.fillStyle = '#203357';
  ctx.fillRect(0, 0, W, 160);

  ctx.fillStyle = '#f5c34b';
  ctx.beginPath();
  ctx.arc(660, 98, 42, 0, Math.PI * 2);
  ctx.fill();

  const clouds = [
    { x: 120, y: 88, w: 70 },
    { x: 300, y: 62, w: 82 },
    { x: 520, y: 122, w: 64 },
  ];

  ctx.fillStyle = '#b4d2f5';
  clouds.forEach((c) => {
    ctx.fillRect(c.x, c.y, c.w, 10);
    ctx.fillRect(c.x + 10, c.y - 10, c.w - 24, 8);
  });
}

function drawEgg(x, y, angle, thrusting) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = '#101010';
  ctx.fillRect(-16, 14, 32, 7);

  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 18, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#f7f0d6';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#101010';
  ctx.stroke();

  ctx.fillStyle = '#101010';
  ctx.fillRect(-7, -7, 3, 3);
  ctx.fillRect(4, -7, 3, 3);

  if (thrusting) {
    ctx.fillStyle = '#ff8730';
    ctx.beginPath();
    ctx.moveTo(-7, 22);
    ctx.lineTo(0, 31 + Math.random() * 8);
    ctx.lineTo(7, 22);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffe06e';
    ctx.beginPath();
    ctx.moveTo(-4, 22);
    ctx.lineTo(0, 28 + Math.random() * 4);
    ctx.lineTo(4, 22);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawHud() {
  const speed = Math.hypot(lander.vx, lander.vy);
  const best = state.bestLandingSpeed == null ? '-' : state.bestLandingSpeed.toFixed(2);

  ctx.fillStyle = '#141414';
  ctx.fillRect(14, 14, 248, 112);
  ctx.strokeStyle = '#ffe06d';
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, 248, 112);

  ctx.fillStyle = '#f5edd4';
  ctx.font = 'bold 14px Trebuchet MS, sans-serif';
  ctx.fillText(`FUEL  ${lander.fuel.toFixed(0)}%`, 26, 36);
  ctx.fillText(`SPEED ${speed.toFixed(2)}`, 26, 58);
  ctx.fillText(`TRIES ${state.attempts}`, 26, 80);
  ctx.fillText(`BEST  ${best}`, 26, 102);

  const barX = 152;
  const barY = 26;
  const barW = 98;
  ctx.fillStyle = '#292929';
  ctx.fillRect(barX, barY, barW, 15);
  ctx.fillStyle = lander.fuel > 35 ? '#8fd95f' : '#ff9259';
  ctx.fillRect(barX + 2, barY + 2, (barW - 4) * (lander.fuel / 100), 11);
  ctx.strokeStyle = '#f5edd4';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barW, 15);

  ctx.fillStyle = '#111111';
  ctx.fillRect(280, 16, W - 296, 38);
  ctx.strokeStyle = '#67c4ff';
  ctx.lineWidth = 3;
  ctx.strokeRect(280, 16, W - 296, 38);

  ctx.font = 'bold 18px Trebuchet MS, sans-serif';
  ctx.fillStyle = '#f9f2dc';
  ctx.textAlign = 'center';
  ctx.fillText(state.message, 280 + (W - 296) / 2, 41);
  ctx.textAlign = 'start';
}

function drawScene() {
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = '#2e4f7a';
  ctx.fillRect(0, 0, W, H);

  drawSkyDecor();

  drawParallaxLayer({
    yBase: 216,
    fill: '#3c5f92',
    speedFactor: 0.1,
    bump: 14,
    step: 88,
  });
  drawTotems(0.17, '#1b2f4f', 228, 42);

  drawParallaxLayer({
    yBase: 278,
    fill: '#2f4a73',
    speedFactor: 0.22,
    bump: 18,
    step: 84,
  });
  drawTotems(0.32, '#101b2f', 292, 58, '#f6e39b');

  ctx.fillStyle = '#4c8c44';
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

  ctx.fillStyle = '#141414';
  ctx.fillRect(0, GROUND_Y - 6, W, 6);

  ctx.fillStyle = '#7d4e31';
  ctx.fillRect(pad.x, pad.y, pad.width, pad.height);
  ctx.strokeStyle = '#151515';
  ctx.lineWidth = 3;
  ctx.strokeRect(pad.x, pad.y, pad.width, pad.height);
  ctx.fillStyle = '#debf8b';
  ctx.fillRect(pad.x + 10, pad.y - 8, pad.width - 20, 6);

  ctx.fillStyle = '#ffe276';
  ctx.font = 'bold 12px Trebuchet MS, sans-serif';
  ctx.fillText('NEST', pad.x + 38, pad.y - 12);

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

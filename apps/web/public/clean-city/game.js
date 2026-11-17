const N = 6, S = 100, PAD = 50, MAX_FUEL = 25;
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
const $ = id => document.getElementById(id);

let truck, cars, bins, station, fuel, score, over = true;
let best = +localStorage.getItem('cleancity-best') || 0;
$('best').textContent = best;

const px = v => PAD + v * S;
const same = (a, b) => a.x === b.x && a.y === b.y;
const rnd = n => Math.floor(Math.random() * n);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function freeSpot() {
  let p;
  do { p = { x: rnd(N), y: rnd(N) }; }
  while (same(p, truck) || bins.some(b => same(b, p)) || (station && same(station, p)) || cars.some(c => same(c, p)));
  return p;
}

function pickNext(c) {
  const opts = DIRS.map(([dx, dy]) => ({ x: c.x + dx, y: c.y + dy }))
    .filter(p => p.x >= 0 && p.y >= 0 && p.x < N && p.y < N);
  const ahead = { x: c.x + c.dx, y: c.y + c.dy };
  const straight = opts.find(p => same(p, ahead));
  const back = opts.filter(p => !(p.x === c.x - c.dx && p.y === c.y - c.dy));
  const t = straight && Math.random() < 0.6 ? straight : back[rnd(back.length)] || opts[0];
  c.dx = t.x - c.x; c.dy = t.y - c.y;
  c.tx = t.x; c.ty = t.y;
}

function start() {
  truck = { x: 0, y: 0, rx: 0, ry: 0, angle: 0 };
  cars = []; bins = []; station = null;
  fuel = MAX_FUEL; score = 0; over = false;
  for (let i = 0; i < 3; i++) bins.push(freeSpot());
  station = freeSpot();
  for (let i = 0; i < 4; i++) {
    const p = freeSpot();
    if (Math.abs(p.x) + Math.abs(p.y) < 3) { i--; continue; }
    const c = { ...p, rx: p.x, ry: p.y, dx: 1, dy: 0 };
    cars.push(c);
    pickNext(c);
  }
  $('overlay').classList.add('hidden');
  updateHud();
}

function end(reason) {
  over = true;
  if (score > best) { best = score; localStorage.setItem('cleancity-best', best); }
  $('best').textContent = best;
  $('title').textContent = reason;
  $('msg').textContent = `You made ${score} collection${score === 1 ? '' : 's'}.`;
  $('start').textContent = 'Play again';
  $('overlay').classList.remove('hidden');
}

function move(dx, dy) {
  if (over) return;
  const nx = truck.x + dx, ny = truck.y + dy;
  if (nx < 0 || ny < 0 || nx >= N || ny >= N) return;
  const from = { x: truck.x, y: truck.y }, to = { x: nx, y: ny };
  fuel--;
  truck.angle = Math.atan2(dy, dx);

  let crash = false;
  for (const c of cars) {
    if (same({ x: c.tx, y: c.ty }, to)) crash = true;                       // car arrives at truck
    if (same(c, to) && same({ x: c.tx, y: c.ty }, from)) crash = true;      // swap places
  }
  truck.x = nx; truck.y = ny;
  cars.forEach(c => { c.x = c.tx; c.y = c.ty; pickNext(c); });
  if (crash) { updateHud(); return end('Crash!'); }

  const i = bins.findIndex(b => same(b, truck));
  if (i >= 0) { bins.splice(i, 1); score++; bins.push(freeSpot()); }
  if (station && same(station, truck)) { fuel = Math.min(MAX_FUEL, fuel + 12); station = freeSpot(); }

  updateHud();
  if (fuel <= 0) end('Out of fuel');
}

function updateHud() {
  $('score').textContent = score;
  $('fuelNum').textContent = fuel;
  const bar = $('fuelBar');
  bar.style.width = (fuel / MAX_FUEL * 100) + '%';
  bar.classList.toggle('low', fuel <= 6);
}

/* ---------- input ---------- */
const KEYS = {
  ArrowRight: [1, 0], d: [1, 0], ArrowLeft: [-1, 0], a: [-1, 0],
  ArrowDown: [0, 1], s: [0, 1], ArrowUp: [0, -1], w: [0, -1]
};
addEventListener('keydown', e => {
  const k = KEYS[e.key];
  if (k) { e.preventDefault(); move(...k); }
});
cv.addEventListener('click', e => {
  const r = cv.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * cv.width;
  const y = (e.clientY - r.top) / r.height * cv.height;
  const dx = x - px(truck.x), dy = y - px(truck.y);
  if (Math.abs(dx) > Math.abs(dy)) move(Math.sign(dx), 0); else move(0, Math.sign(dy));
});
$('start').addEventListener('click', start);

/* ---------- drawing ---------- */
function roundRect(x, y, w, h, r, fill) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = '#eef1ee';
  ctx.fillRect(0, 0, cv.width, cv.height);

  // city blocks
  for (let i = -1; i < N; i++) for (let j = -1; j < N; j++) {
    roundRect(px(i) + 14, px(j) + 14, S - 28, S - 28, 8, '#e0e6e1');
  }
  // roads
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 22; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    ctx.moveTo(px(i), px(0)); ctx.lineTo(px(i), px(N - 1));
    ctx.moveTo(px(0), px(i)); ctx.lineTo(px(N - 1), px(i));
  }
  ctx.stroke();

  if (!truck) return;

  // fuel station
  if (station) {
    roundRect(px(station.x) - 13, px(station.y) - 13, 26, 26, 6, '#3b82f6');
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('F', px(station.x), px(station.y) + 1);
  }
  // garbage markers
  const pulse = 1 + Math.sin(Date.now() / 250) * 0.1;
  bins.forEach(b => {
    ctx.beginPath(); ctx.arc(px(b.x), px(b.y), 15 * pulse, 0, 7);
    ctx.fillStyle = 'rgba(46,168,107,.25)'; ctx.fill();
    ctx.beginPath(); ctx.arc(px(b.x), px(b.y), 8, 0, 7);
    ctx.fillStyle = '#2ea86b'; ctx.fill();
  });

  // cars and their next move
  cars.forEach(c => {
    c.rx += (c.x - c.rx) * 0.25; c.ry += (c.y - c.ry) * 0.25;
    const cx = px(c.rx), cy = px(c.ry);
    ctx.strokeStyle = 'rgba(228,87,46,.45)'; ctx.lineWidth = 3; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(px(c.x), px(c.y)); ctx.lineTo(px(c.tx), px(c.ty)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(px(c.tx), px(c.ty), 5, 0, 7); ctx.fillStyle = 'rgba(228,87,46,.45)'; ctx.fill();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.atan2(c.dy, c.dx));
    roundRect(-13, -8, 26, 16, 5, '#e4572e');
    ctx.restore();
  });

  // truck
  truck.rx += (truck.x - truck.rx) * 0.3; truck.ry += (truck.y - truck.ry) * 0.3;
  ctx.save(); ctx.translate(px(truck.rx), px(truck.ry)); ctx.rotate(truck.angle);
  roundRect(-17, -10, 26, 20, 5, '#1d2a24');
  roundRect(11, -8, 8, 16, 4, '#4b6b5a');
  ctx.restore();
}

(function loop() { draw(); requestAnimationFrame(loop); })();

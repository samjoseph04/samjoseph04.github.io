(() => {
'use strict';
const cv = document.getElementById('game'), ctx = cv.getContext('2d'), W = 900, H = 600;
const $ = id => document.getElementById(id);
const KEY = 'harborControlHighScore';
const COLORS = ['#ef476f', '#ffd166', '#06d6a0', '#a78bfa'];
const DOCK_X = [130, 340, 560, 770], APPROACH_Y = 420, BERTH_Y = 488, MAX_WAIT = 3;
const ENTRIES = [
  { spawn: { x: -30, y: 150 }, lane: { x: 90, y: 170 }, slot: i => ({ x: 60, y: 90 + i * 42 }) },
  { spawn: { x: 450, y: -30 }, lane: { x: 450, y: 250 }, slot: i => ({ x: 400 + i * 50, y: 50 }) },
  { spawn: { x: 930, y: 150 }, lane: { x: 810, y: 330 }, slot: i => ({ x: 840, y: 90 + i * 42 }) }
];

let S, mode = 'menu', clk = 0, last = 0, best = 0;
try { best = +localStorage.getItem(KEY) || 0; } catch (e) {}

function reset() {
  S = { ship: [], fx: [], score: 0, docked: 0, lives: 3, t: 0, spawn: 0.8, id: 1,
        selShip: null, selDock: 0, docks: DOCK_X.map(() => ({ busy: false })),
        msg: '', msgT: 0, shake: 0, flash: 0 };
}
reset();

const level = () => Math.floor(S.t / 20);
const speedNow = () => Math.min(150, 65 + level() * 9);
const waiting = () => S.ship.filter(s => s.state === 'waiting').sort((a, b) => a.id - b.id);
const fmt = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const say = m => { S.msg = m; S.msgT = 1.6; };
const show = id => { ['startScreen', 'pauseScreen', 'overScreen'].forEach(o => $(o).classList.toggle('hidden', o !== id)); };

function start() { reset(); mode = 'playing'; show(null); $('pauseBtn').textContent = 'Pause'; }
function togglePause() {
  if (mode === 'playing') { mode = 'paused'; show('pauseScreen'); $('pauseBtn').textContent = 'Resume'; }
  else if (mode === 'paused') { mode = 'playing'; show(null); $('pauseBtn').textContent = 'Pause'; }
}
function gameOver() {
  mode = 'over';
  const isBest = S.score > best;
  if (isBest) { best = S.score; try { localStorage.setItem(KEY, best); } catch (e) {} }
  $('finalScore').textContent = S.score; $('finalDocked').textContent = S.docked; $('finalTime').textContent = fmt(S.t);
  $('newBest').classList.toggle('hidden', !isBest);
  show('overScreen');
}

/* ---------- player actions ---------- */
function selectShip(dir) {
  if (mode !== 'playing') return;
  const l = waiting(); if (!l.length) return;
  let i = l.findIndex(s => s.id === S.selShip);
  i = i < 0 ? 0 : (i + dir + l.length) % l.length;
  S.selShip = l[i].id;
}
function selectDock(dir) { if (mode === 'playing') S.selDock = (S.selDock + dir + DOCK_X.length) % DOCK_X.length; }
function assign() {
  if (mode !== 'playing') return;
  const ship = S.ship.find(s => s.id === S.selShip && s.state === 'waiting');
  if (!ship) return say('Select a waiting ship first');
  const d = S.selDock, dock = S.docks[d];
  if (dock.busy) return say('Dock ' + (d + 1) + ' is busy');
  const e = ENTRIES[ship.entry], x = DOCK_X[d];
  dock.busy = true; ship.dock = d; ship.state = 'moving'; ship.speed = speedNow() + Math.random() * 10;
  ship.route = [e.lane, { x, y: e.lane.y }, { x, y: APPROACH_Y }, { x, y: BERTH_Y }];
  const l = waiting(); S.selShip = l.length ? l[0].id : null;
}

/* ---------- simulation ---------- */
function spawnShip() {
  const opts = [0, 1, 2].filter(e => S.ship.filter(s => s.state === 'waiting' && s.entry === e).length < MAX_WAIT);
  if (!opts.length) return;
  const entry = opts[Math.floor(Math.random() * opts.length)], p = ENTRIES[entry].spawn;
  const s = { id: S.id++, x: p.x, y: p.y, a: 0, dest: Math.floor(Math.random() * 4), entry, state: 'waiting', route: [], dock: -1, timer: 0, foam: 0, alpha: 1 };
  S.ship.push(s);
  if (S.selShip === null) S.selShip = s.id;
}
function step(s, tx, ty, d) {
  const dx = tx - s.x, dy = ty - s.y, dist = Math.hypot(dx, dy);
  if (dist > 1) s.a = Math.atan2(dy, dx);
  if (dist <= d) { s.x = tx; s.y = ty; return true; }
  s.x += dx / dist * d; s.y += dy / dist * d; return false;
}
function boom(x, y) {
  S.fx.push({ k: 'ring', x, y, life: .6, max: .6 });
  for (let i = 0; i < 28; i++) {
    const a = Math.random() * 6.28, v = 40 + Math.random() * 160;
    S.fx.push({ k: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .8, max: .8, r: 2 + Math.random() * 4, c: ['#ffd166', '#ff8a3d', '#ef476f', '#fff'][i % 4] });
  }
  S.shake = .4; S.flash = .5;
}

function update(dt) {
  S.t += dt;
  if ((S.spawn -= dt) <= 0) { spawnShip(); S.spawn = Math.max(1.6, 5.5 - S.t / 30) * (.75 + Math.random() * .5); }

  const counts = [0, 0, 0];
  waiting().forEach(s => {
    const p = ENTRIES[s.entry].slot(counts[s.entry]++);
    step(s, p.x, p.y, 130 * dt);
  });
  if (!waiting().some(s => s.id === S.selShip)) { const l = waiting(); S.selShip = l.length ? l[0].id : null; }

  S.ship.forEach(s => {
    if (s.state === 'moving') {
      let d = s.speed * dt;
      if ((s.foam -= dt) <= 0) { s.foam = .07; S.fx.push({ k: 'foam', x: s.x, y: s.y, life: .6, max: .6 }); }
      while (s.route.length && d > 0) {
        const t = s.route[0], dist = Math.hypot(t.x - s.x, t.y - s.y);
        if (step(s, t.x, t.y, d)) { s.route.shift(); d -= dist; } else d = 0;
      }
      if (!s.route.length) {
        s.state = 'docked'; s.timer = 2.6; s.a = Math.PI / 2;
        const ok = s.dock === s.dest; S.score += ok ? 100 : 50; S.docked++;
        S.fx.push({ k: 'text', x: s.x, y: s.y - 30, life: 1.1, max: 1.1, t: ok ? '+100' : '+50', c: ok ? '#ffd166' : '#eaf6fb' });
      }
    } else if (s.state === 'docked') {
      s.timer -= dt; s.alpha = Math.min(1, s.timer / .5);
      if (s.timer <= 0) { s.dead = true; }
    }
  });

  const mv = S.ship.filter(s => s.state === 'moving');
  for (let i = 0; i < mv.length; i++) for (let j = i + 1; j < mv.length; j++) {
    const a = mv[i], b = mv[j];
    if (!a.dead && !b.dead && Math.hypot(a.x - b.x, a.y - b.y) < 32) {
      boom((a.x + b.x) / 2, (a.y + b.y) / 2); a.dead = b.dead = true; S.lives--; say('Collision! Lose a life');
    }
  }
  S.ship = S.ship.filter(s => { if (s.dead) { if (s.dock >= 0) S.docks[s.dock].busy = false; return false; } return true; });
  if (S.lives <= 0) gameOver();
}
function updateFx(dt) {
  S.fx.forEach(f => { f.life -= dt; if (f.k === 'dot') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= .96; f.vy *= .96; } if (f.k === 'text') f.y -= 24 * dt; });
  S.fx = S.fx.filter(f => f.life > 0);
  S.shake = Math.max(0, S.shake - dt); S.flash = Math.max(0, S.flash - dt); S.msgT = Math.max(0, S.msgT - dt);
}

/* ---------- drawing ---------- */
function drawWater() {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a86c4'); g.addColorStop(1, '#154f86');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 2;
  for (let y = 30; y < 540; y += 45) {
    ctx.beginPath();
    for (let x = 0; x <= W; x += 20) { const yy = y + Math.sin(x / 40 + clk * 1.5 + y) * 4; x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }
    ctx.stroke();
  }
}
function drawDocks() {
  ctx.fillStyle = '#d8c58c'; ctx.fillRect(0, 538, W, 62);
  ctx.fillStyle = '#b8a570'; ctx.fillRect(0, 538, W, 5);
  DOCK_X.forEach((x, i) => {
    const sel = i === S.selDock, busy = S.docks[i].busy;
    ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(x - 40, 430, 80, 82);
    ctx.strokeStyle = sel ? '#fff' : 'rgba(255,255,255,.35)'; ctx.lineWidth = sel ? 3 : 1.5; ctx.setLineDash([7, 5]);
    ctx.strokeRect(x - 40, 430, 80, 82); ctx.setLineDash([]);
    ctx.fillStyle = '#8b5e34'; ctx.fillRect(x - 46, 512, 92, 30);
    ctx.fillStyle = COLORS[i]; ctx.fillRect(x - 46, 512, 92, 8);
    ctx.fillStyle = '#3d2a12'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Dock ' + (i + 1), x, 566);
    ctx.fillStyle = busy ? '#c0392b' : '#1e7a4a'; ctx.font = 'bold 12px sans-serif';
    ctx.fillText(busy ? 'Busy' : 'Free', x, 584);
    if (sel) {
      const b = Math.sin(clk * 6) * 4;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x, 418 + b); ctx.lineTo(x - 10, 402 + b); ctx.lineTo(x + 10, 402 + b); ctx.fill();
    }
  });
}
function drawRoutes() {
  ctx.lineWidth = 3; ctx.lineCap = 'round';
  S.ship.forEach(s => {
    if (s.state !== 'moving') return;
    ctx.strokeStyle = COLORS[s.dest]; ctx.globalAlpha = .55; ctx.setLineDash([2, 9]);
    ctx.beginPath(); ctx.moveTo(s.x, s.y); s.route.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
  });
  ctx.globalAlpha = 1;
  const ship = S.ship.find(s => s.id === S.selShip && s.state === 'waiting');
  if (ship) {
    const e = ENTRIES[ship.entry], x = DOCK_X[S.selDock];
    ctx.strokeStyle = S.docks[S.selDock].busy ? '#ff6b6b' : '#fff'; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -clk * 30; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ship.x, ship.y); [e.lane, { x, y: e.lane.y }, { x, y: APPROACH_Y }, { x, y: BERTH_Y }].forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    ctx.lineDashOffset = 0;
  }
  ctx.setLineDash([]);
}
function drawShip(s) {
  ctx.save(); ctx.translate(s.x, s.y); ctx.globalAlpha = s.alpha;
  if (s.id === S.selShip && s.state === 'waiting') {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.lineDashOffset = -clk * 20;
    ctx.beginPath(); ctx.arc(0, 0, 30 + Math.sin(clk * 6) * 2, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  }
  const bob = s.state === 'waiting' ? Math.sin(clk * 3 + s.id) * .06 : 0;
  ctx.rotate(s.a + bob);
  ctx.fillStyle = COLORS[s.dest]; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(11, -11); ctx.lineTo(-22, -11); ctx.lineTo(-22, 11); ctx.lineTo(11, 11); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(-16, -6, 14, 12);
  ctx.rotate(-s.a - bob);
  ctx.fillStyle = '#0a2540'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.fillStyle = '#0a2540'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(s.dest + 1, 0, 4.5);
  ctx.restore();
}
function drawFx() {
  S.fx.forEach(f => {
    const a = f.life / f.max; ctx.globalAlpha = Math.max(0, a);
    if (f.k === 'foam') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(f.x, f.y, 5 * a + 1, 0, 7); ctx.fill(); }
    else if (f.k === 'dot') { ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * a, 0, 7); ctx.fill(); }
    else if (f.k === 'ring') { ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 5 * a; ctx.beginPath(); ctx.arc(f.x, f.y, 70 * (1 - a) + 10, 0, 7); ctx.stroke(); }
    else if (f.k === 'text') { ctx.fillStyle = f.c; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(f.t, f.x, f.y); }
  });
  ctx.globalAlpha = 1;
}
function draw() {
  ctx.save();
  if (S.shake > 0) ctx.translate((Math.random() - .5) * 12 * S.shake * 2.5, (Math.random() - .5) * 12 * S.shake * 2.5);
  drawWater();
  ENTRIES.forEach(e => { for (let i = 0; i < MAX_WAIT; i++) { const p = e.slot(i); ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 22, 0, 7); ctx.stroke(); } });
  drawDocks(); drawRoutes();
  S.ship.filter(s => s.state !== 'moving').concat(S.ship.filter(s => s.state === 'moving')).forEach(drawShip);
  drawFx();
  ctx.restore();
  if (S.flash > 0) { ctx.fillStyle = 'rgba(239,71,111,' + S.flash * .5 + ')'; ctx.fillRect(0, 0, W, H); }
  if (S.msgT > 0) {
    ctx.globalAlpha = Math.min(1, S.msgT * 2); ctx.fillStyle = 'rgba(7,26,46,.85)'; ctx.fillRect(W / 2 - 170, 12, 340, 34);
    ctx.fillStyle = '#ffd166'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(S.msg, W / 2, 35); ctx.globalAlpha = 1;
  }
}
function hud() {
  const w = waiting().length;
  $('score').textContent = S.score; $('docked').textContent = S.docked; $('waiting').textContent = w;
  $('time').textContent = fmt(S.t); $('lives').textContent = '♥'.repeat(Math.max(0, S.lives)) + '♡'.repeat(Math.max(0, 3 - S.lives));
  $('high').textContent = Math.max(best, S.score);
  const sh = S.ship.find(s => s.id === S.selShip);
  const d = S.docks[S.selDock];
  $('sel').textContent = (sh ? 'Ship heading for Dock ' + (sh.dest + 1) : 'No ship selected') + '  ➜  Dock ' + (S.selDock + 1) + (d.busy ? ' (busy)' : ' (free)') + '   •   Traffic level ' + (level() + 1);
}

/* ---------- loop ---------- */
function loop(ts) {
  const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts; clk += dt;
  if (mode === 'playing') update(dt);
  if (mode !== 'paused') updateFx(dt);
  draw(); hud();
  requestAnimationFrame(loop);
}

/* ---------- input ---------- */
document.addEventListener('keydown', e => {
  const k = e.key;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(k)) e.preventDefault();
  if (k === ' ') { if (mode === 'playing' || mode === 'paused') togglePause(); return; }
  if (k === 'Enter') { if (mode === 'menu' || mode === 'over') start(); else assign(); e.preventDefault(); return; }
  if (k === 'w' || k === 'W' || k === 'ArrowUp') selectShip(-1);
  else if (k === 's' || k === 'S' || k === 'ArrowDown') selectShip(1);
  else if (k === 'a' || k === 'A' || k === 'ArrowLeft') selectDock(-1);
  else if (k === 'd' || k === 'D' || k === 'ArrowRight') selectDock(1);
});
cv.addEventListener('click', e => {
  if (mode !== 'playing') return;
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
  const hit = waiting().find(s => Math.hypot(s.x - x, s.y - y) < 32);
  if (hit) { S.selShip = hit.id; return; }
  if (y > 400) { const i = DOCK_X.findIndex(dx => Math.abs(dx - x) < 55); if (i >= 0) S.selDock = i; }
});
const bind = (id, fn) => $(id).addEventListener('click', e => { fn(); e.currentTarget.blur(); });
bind('startBtn', start); bind('restartBtn', start); bind('resumeBtn', togglePause); bind('pauseBtn', togglePause);
bind('shipPrev', () => selectShip(-1)); bind('shipNext', () => selectShip(1));
bind('dockPrev', () => selectDock(-1)); bind('dockNext', () => selectDock(1)); bind('assignBtn', assign);

requestAnimationFrame(loop);
})();

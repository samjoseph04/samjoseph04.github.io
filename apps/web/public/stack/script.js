(() => {
"use strict";
const W = 300, H = 500, BH = 22, BASE_Y = H - 70, SNAP = 4;
const cv = document.getElementById("c"), ctx = cv.getContext("2d");
const $ = id => document.getElementById(id);
const scoreEl = $("score"), bestEl = $("best"), msg = $("msg"), perfectEl = $("perfect");

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} }
};
let best = +store.get("stackBest") || 0;
let state = "ready", stack, cur, pieces, phase, cam, camTarget, score, lockUntil = 0, last = 0;
const dark = matchMedia("(prefers-color-scheme: dark)");

function fit() {
  const r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
}
addEventListener("resize", fit);

let L = "58%";
function readTheme() { L = getComputedStyle(document.documentElement).getPropertyValue("--l").trim(); }
const hue = i => `hsl(${(165 + i * 7) % 360} 45% ${L})`;

function reset() {
  stack = [{ x: 50, w: 200 }]; pieces = []; phase = 0; cam = 0; camTarget = 0; score = 0;
  spawn(); show();
}
function spawn() { const t = stack[stack.length - 1]; cur = { w: t.w, x: 0 }; }
function show() {
  scoreEl.textContent = score;
  bestEl.textContent = best ? "Best " + best : "";
}
function speed() { return Math.min(.0009 + score * .000022, .0021); }

function drop() {
  const top = stack[stack.length - 1], i = stack.length;
  const left = Math.max(cur.x, top.x), right = Math.min(cur.x + cur.w, top.x + top.w), ov = right - left;
  if (ov <= 0) { pieces.push({ x: cur.x, w: cur.w, i, vy: 0, y: i * BH }); return end(); }
  let next;
  if (Math.abs(cur.x - top.x) < SNAP) {
    next = { x: top.x, w: top.w };
    perfectEl.classList.remove("show"); void perfectEl.offsetWidth; perfectEl.classList.add("show");
  } else {
    next = { x: left, w: ov };
    const cutX = cur.x < top.x ? cur.x : right, cutW = cur.w - ov;
    pieces.push({ x: cutX, w: cutW, i, vy: 0, y: i * BH });
  }
  stack.push(next); score++; show();
  camTarget = Math.max(0, (stack.length - 7) * BH);
  spawn();
}
function end() {
  state = "over"; lockUntil = performance.now() + 500;
  if (score > best) { best = score; store.set("stackBest", best); }
  show();
  msg.innerHTML = `<b>${score} stacked</b>Tap to play again`; msg.style.opacity = 1;
}
function press() {
  if (state === "ready") { state = "play"; msg.style.opacity = 0; return; }
  if (state === "play") return drop();
  if (performance.now() >= lockUntil) { reset(); state = "play"; msg.style.opacity = 0; }
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(50, now - (last || now)); last = now;
  if (state === "play") {
    phase += speed() * dt * 2;
    const t = phase % 2, p = t < 1 ? t : 2 - t;
    cur.x = (W - cur.w) * p;
  } else if (state === "ready") { phase += .0008 * dt * 2; const t = phase % 2; cur.x = (W - cur.w) * (t < 1 ? t : 2 - t); }
  cam += (camTarget - cam) * Math.min(1, dt * .006);
  for (const p of pieces) { p.vy += dt * .0009; p.y -= p.vy * dt; }
  pieces = pieces.filter(p => BASE_Y - (p.y - cam) < H + 60);
  draw();
}

function draw() {
  const s = cv.width / W;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const rect = (x, i, w, y) => { ctx.fillStyle = hue(i); ctx.fillRect(x, BASE_Y - (y - cam) - BH, w, BH - 1.5); };
  stack.forEach((b, i) => rect(b.x, i, b.w, i * BH));
  for (const p of pieces) rect(p.x, p.i, p.w, p.y);
  if (state !== "over") { ctx.globalAlpha = state === "ready" ? .55 : 1; rect(cur.x, stack.length, cur.w, stack.length * BH); ctx.globalAlpha = 1; }
}

$("stage").addEventListener("pointerdown", e => { e.preventDefault(); press(); });
addEventListener("keydown", e => {
  if (e.repeat) return;
  if (e.key === " " || e.key === "Enter") { e.preventDefault(); press(); }
});
document.addEventListener("visibilitychange", () => { last = 0; });
dark.addEventListener?.("change", readTheme);

readTheme(); fit(); reset();
requestAnimationFrame(frame);
})();

(() => {
"use strict";

const $ = s => document.querySelector(s);
const pads = [...document.querySelectorAll(".pad")];
const ui = { score: $("#score"), best: $("#best"), status: $("#status"), start: $("#start"), sound: $("#sound"), grid: $(".grid") };
const FREQ = [329.63, 392, 440, 523.25];
const KEYS = { 1: 0, 2: 1, 3: 2, 4: 3, q: 0, w: 1, a: 2, s: 3 };

const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

// state: ready | show | input | wait | over
const G = { state: "ready", seq: [], pos: 0, score: 0, best: +store.get("echoBest") || 0, run: 0, resume: false, sound: store.get("echoSound") !== "0", ctx: null };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const stepMs = () => Math.max(260, 520 - G.score * 18);

/* ---------- audio / feedback ---------- */
function beep(i, ms = 250) {
  if (!G.sound) return;
  try {
    const c = G.ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (c.state === "suspended") c.resume();
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = "sine"; o.frequency.value = i < 0 ? 150 : FREQ[i];
    g.gain.setValueAtTime(.06, t); g.gain.exponentialRampToValueAtTime(.001, t + ms / 1000);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + ms / 1000);
  } catch { /* audio unavailable */ }
}
function flash(i, ms) {
  pads[i].classList.add("lit"); beep(i, ms);
  setTimeout(() => pads[i].classList.remove("lit"), ms);
}

/* ---------- rendering ---------- */
function render(status) {
  ui.score.textContent = G.score;
  ui.best.textContent = G.best ? "Best " + G.best : "";
  if (status) ui.status.textContent = status;
  ui.grid.classList.toggle("locked", G.state !== "input");
  ui.start.textContent = G.state === "ready" ? "Start" : G.state === "over" ? "Play again" : "Restart";
}

/* ---------- game flow (a run id cancels any in-flight sequence) ---------- */
async function playSeq(id) {
  G.state = "show"; G.pos = 0; render("Watch…");
  await sleep(550);
  for (const p of G.seq) {
    if (id !== G.run) return;
    flash(p, stepMs() * .7);
    await sleep(stepMs());
  }
  if (id !== G.run) return;
  G.state = "input"; render("Your turn");
}
const addStep = () => G.seq.push(Math.floor(Math.random() * 4));

function start() {
  const id = ++G.run;
  pads.forEach(p => p.classList.remove("lit", "wrong"));
  G.seq = []; G.score = 0; G.resume = false;
  addStep(); playSeq(id);
}
async function nextRound(id) {
  G.state = "wait";
  await sleep(700);
  if (id !== G.run) return;
  addStep(); playSeq(id);
}
function tap(i) {
  if (G.state !== "input") return;
  if (i !== G.seq[G.pos]) return fail(i);
  flash(i, 180);
  if (++G.pos === G.seq.length) {
    G.score++;
    if (G.score > G.best) { G.best = G.score; store.set("echoBest", G.best); }
    G.state = "wait"; render("Nice");
    nextRound(G.run);
  }
}
function fail(i) {
  G.run++; G.state = "over";
  pads[i].classList.remove("wrong"); void pads[i].offsetWidth; pads[i].classList.add("wrong");
  beep(-1, 400);
  setTimeout(() => flash(G.seq[G.pos], 500), 450);   // show the pad that was expected
  render(G.score === 1 ? "Wrong pad. 1 round" : `Wrong pad. ${G.score} rounds`);
}

/* ---------- input (registered once) ---------- */
pads.forEach((p, i) => p.addEventListener("click", () => tap(i)));
ui.start.addEventListener("click", start);
ui.sound.addEventListener("click", () => {
  G.sound = !G.sound; store.set("echoSound", G.sound ? "1" : "0");
  ui.sound.textContent = G.sound ? "Sound on" : "Sound off"; beep(0, 120);
});
document.addEventListener("click", e => { if (e.detail > 0) e.target.closest?.("button")?.blur(); });
document.addEventListener("keydown", e => {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.target.closest?.("button")) return;
  const k = e.key.toLowerCase();
  if (k in KEYS) tap(KEYS[k]);
  else if (k === " " || k === "Enter") { e.preventDefault(); start(); }
});
// If the tab is hidden mid-pattern, cancel it and replay it when the player returns.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (G.state === "show" || G.state === "wait") { G.resume = G.state; G.run++; }
  } else if (G.resume) {
    const was = G.resume; G.resume = false;
    if (was === "wait") addStep();
    playSeq(++G.run);
  }
});

ui.sound.textContent = G.sound ? "Sound on" : "Sound off";
render();
})();

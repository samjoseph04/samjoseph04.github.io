const arena = document.getElementById("arena");
const target = document.getElementById("target");
const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const gameOver = document.getElementById("gameOver");
const statusEl = document.getElementById("status");
const feedback = document.getElementById("feedback");
const flash = document.getElementById("flash");

const scoreEl = document.getElementById("score");
const reactionEl = document.getElementById("reaction");
const streakEl = document.getElementById("streak");
const bestEl = document.getElementById("best");

const finalScoreEl = document.getElementById("finalScore");
const finalBestEl = document.getElementById("finalBest");
const finalAvgEl = document.getElementById("finalAvg");
const finalReactionEl = document.getElementById("finalReaction");
const newBestEl = document.getElementById("newBest");

const COLORS = ["#4dfcff", "#ff4fd8", "#b7ff4a", "#9b7cff", "#ffbd4a"];
const SCORE_KEY = "neonReflexBestScore";
const REACTION_KEY = "neonReflexBestReaction";

let running = false;
let waiting = false;
let score = 0;
let streak = 0;
let round = 0;
let reactions = [];
let spawnTime = 0;
let timer = null;
let bestScore = Number(localStorage.getItem(SCORE_KEY) || 0);
let bestReaction = Number(localStorage.getItem(REACTION_KEY) || 0);
let audio = null;

bestEl.textContent = bestScore;

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function initAudio() {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
  } catch {}
}

function beep(freq, duration = .06, type = "sine", volume = .03) {
  try {
    initAudio();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + duration);
  } catch {}
}

function updateHud() {
  scoreEl.textContent = score;
  streakEl.textContent = streak;
  reactionEl.textContent = reactions.length ? `${reactions.at(-1)} ms` : "--";
  bestEl.textContent = bestScore;
}

function difficulty() {
  return Math.min(round, 30);
}

function getDelay() {
  return Math.max(550, random(850, 2200) - difficulty() * 42);
}

function getTargetSize() {
  return Math.max(48, 94 - difficulty() * 1.55);
}

function hideTarget() {
  target.classList.add("hidden");
}

function showFeedback(text, x, y, color) {
  feedback.textContent = text;
  feedback.style.left = `${x}px`;
  feedback.style.top = `${y}px`;
  feedback.style.color = color;
  feedback.className = "";
  void feedback.offsetWidth;
  feedback.className = "pop";
}

function burst(x, y, color) {
  for (let i = 0; i < 18; i++) {
    const particle = document.createElement("i");
    particle.className = "particle";
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.color = color;

    const angle = Math.random() * Math.PI * 2;
    const distance = random(25, 90);
    particle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);

    arena.appendChild(particle);
    setTimeout(() => particle.remove(), 600);
  }
}

function doFlash(type) {
  flash.className = "";
  void flash.offsetWidth;
  flash.className = type;
}

function scheduleTarget() {
  if (!running) return;

  waiting = true;
  statusEl.textContent = "WAIT...";
  statusEl.classList.remove("active");
  hideTarget();

  clearTimeout(timer);
  timer = setTimeout(spawnTarget, getDelay());
}

function spawnTarget() {
  if (!running) return;

  waiting = false;
  statusEl.textContent = "HIT!";
  statusEl.classList.add("active");

  const bounds = arena.getBoundingClientRect();
  const size = getTargetSize();
  const margin = Math.max(34, size / 2 + 10);

  const x = random(margin, bounds.width - margin);
  const y = random(112, bounds.height - 70);
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  target.style.left = `${x}px`;
  target.style.top = `${y}px`;
  target.style.setProperty("--target-size", `${size}px`);
  target.style.setProperty("--target-color", color);
  target.classList.remove("hidden");

  spawnTime = performance.now();
  beep(650 + difficulty() * 7, .045, "triangle", .025);
}

function startGame() {
  initAudio();
  clearTimeout(timer);

  running = true;
  waiting = false;
  score = 0;
  streak = 0;
  round = 0;
  reactions = [];

  gameOver.classList.remove("show");
  startScreen.classList.add("hidden");
  statusEl.textContent = "GET READY";
  statusEl.classList.remove("active");

  updateHud();
  beep(500, .08, "square", .035);
  scheduleTarget();
}

function finish(reason) {
  if (!running) return;

  running = false;
  waiting = false;
  clearTimeout(timer);
  hideTarget();

  const average = reactions.length
    ? Math.round(reactions.reduce((sum, value) => sum + value, 0) / reactions.length)
    : 0;

  const oldBest = bestScore;

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem(SCORE_KEY, String(bestScore));
  }

  finalScoreEl.textContent = score;
  finalBestEl.textContent = bestScore;
  finalAvgEl.textContent = average ? `${average} ms` : "--";
  finalReactionEl.textContent = bestReaction ? `${bestReaction} ms` : "--";
  newBestEl.textContent = score > oldBest ? "★ NEW BEST SCORE ★" : reason;

  gameOver.classList.add("show");
  doFlash("bad");
  beep(120, .18, "sawtooth", .035);
}

function hit(event) {
  if (!running || waiting || target.classList.contains("hidden")) return;

  event.preventDefault();
  event.stopPropagation();

  const ms = Math.round(performance.now() - spawnTime);
  reactions.push(ms);

  if (!bestReaction || ms < bestReaction) {
    bestReaction = ms;
    localStorage.setItem(REACTION_KEY, String(bestReaction));
  }

  round++;
  streak++;

  const speedBonus = Math.max(0, 700 - ms);
  const comboBonus = streak * 8;
  const points = Math.max(20, 100 + Math.round(speedBonus * .12) + comboBonus);

  score += points;
  updateHud();

  const bounds = arena.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  const y = event.clientY - bounds.top;
  const color = target.style.getPropertyValue("--target-color").trim() || "#4dfcff";

  showFeedback(`+${points}`, x + 12, y - 10, color);
  burst(x, y, color);
  doFlash("good");
  beep(780 + Math.max(0, 350 - ms), .07, "sine", .04);

  hideTarget();
  scheduleTarget();
}

function miss(event) {
  if (!running || waiting) return;
  if (event.target !== arena) return;

  streak = 0;
  score = Math.max(0, score - 35);
  updateHud();

  const bounds = arena.getBoundingClientRect();
  showFeedback("MISS  -35", event.clientX - bounds.left, event.clientY - bounds.top, "#ff5577");
  doFlash("bad");
  beep(100, .1, "square", .025);

  scheduleTarget();
}

target.addEventListener("pointerdown", hit);
arena.addEventListener("pointerdown", miss);

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

document.addEventListener("keydown", event => {
  if ((event.code === "Space" || event.code === "Enter") && !running) {
    event.preventDefault();
    startGame();
  }

  if (event.code === "Escape" && running) {
    finish("ENDED");
  }
});

window.addEventListener("blur", () => {
  if (running) finish("FOCUS LOST");
});

updateHud();

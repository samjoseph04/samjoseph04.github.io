// BUS! Counter Challenge
// The player gets one action window per move. The required action is
// determined by the number that will be reached after that action.

const ACTION_INTERVAL = 1000;
const HIGH_SCORE_KEY = "busCounterHighScore";

const screens = {
  start: document.getElementById("startScreen"),
  game: document.getElementById("gameScreen"),
  over: document.getElementById("gameOverScreen")
};

const counterEl = document.getElementById("counter");
const scoreEl = document.getElementById("score");
const streakEl = document.getElementById("streak");
const highScoreEl = document.getElementById("highScore");
const promptEl = document.getElementById("prompt");
const promptTextEl = document.getElementById("promptText");
const timerBar = document.getElementById("timerBar");
const timerText = document.getElementById("timerText");
const flash = document.getElementById("flash");

const finalScoreEl = document.getElementById("finalScore");
const finalCounterEl = document.getElementById("finalCounter");
const finalHighScoreEl = document.getElementById("finalHighScore");

const startBtn = document.getElementById("startBtn");
const againBtn = document.getElementById("againBtn");
const countBtn = document.getElementById("countBtn");
const busBtn = document.getElementById("busBtn");

let currentNumber = 0;
let score = 0;
let streak = 0;
let highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;

let gameRunning = false;
let actionLocked = false;
let actionDeadline = 0;
let timerId = null;
let audioContext = null;

highScoreEl.textContent = highScore;

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove("active"));
  screens[name].classList.add("active");
}

function isBusNumber(number) {
  return number !== 0 && number % 5 === 0;
}

function requiredAction() {
  // The next number is currentNumber + 1.
  return isBusNumber(currentNumber + 1) ? "BUS" : "COUNT";
}

function updatePrompt() {
  const busRequired = requiredAction() === "BUS";

  promptEl.classList.toggle("bus-prompt", busRequired);
  promptEl.classList.toggle("count-prompt", !busRequired);

  promptTextEl.textContent = busRequired
    ? "BUS! Next stop is a multiple of 5"
    : "COUNT to continue";

  document.title = busRequired ? "🚌 BUS! — Counter Challenge" : "BUS! Counter Challenge";
}

function updateUI() {
  counterEl.textContent = currentNumber;
  scoreEl.textContent = score;
  streakEl.textContent = streak;
  highScoreEl.textContent = highScore;
  updatePrompt();

  counterEl.classList.remove("pop");
  void counterEl.offsetWidth;
  counterEl.classList.add("pop");
}

function playTone(frequency, duration, type = "sine", volume = 0.045) {
  // Audio is initialized only after a user interaction, satisfying browser
  // autoplay restrictions.
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + duration
  );

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function showFlash(type) {
  flash.className = `flash ${type}`;
  void flash.offsetWidth;
  flash.classList.add(type);
}

function startGame() {
  initAudio();

  currentNumber = 0;
  score = 0;
  streak = 0;
  gameRunning = true;
  actionLocked = false;

  showScreen("game");
  updateUI();
  beginActionWindow();
}

function beginActionWindow(interval = ACTION_INTERVAL) {
  if (!gameRunning) return;

  actionLocked = false;
  actionDeadline = performance.now() + interval;

  clearInterval(timerId);

  // Frequent updates make the timer visually smooth.
  timerId = setInterval(updateTimer, 16);
  updateTimer();
}

function updateTimer() {
  if (!gameRunning) return;

  const remaining = Math.max(0, actionDeadline - performance.now());
  const ratio = remaining / ACTION_INTERVAL;

  timerBar.style.transform = `scaleX(${ratio})`;
  timerText.textContent = `${(remaining / 1000).toFixed(2)}s`;

  timerBar.classList.toggle("warning", ratio < 0.45 && ratio >= 0.2);
  timerBar.classList.toggle("danger", ratio < 0.2);

  if (remaining <= 0) {
    clearInterval(timerId);
    endGame("timeout");
  }
}

function handleAction(action) {
  if (!gameRunning || actionLocked) return;

  const now = performance.now();

  // A click after the current deadline is a missed action.
  if (now >= actionDeadline) {
    endGame("timeout");
    return;
  }

  const expected = requiredAction();

  if (action !== expected) {
    actionLocked = true;
    playTone(110, 0.18, "sawtooth", 0.06);
    showFlash("wrong");
    endGame("wrong");
    return;
  }

  // Lock immediately so double-clicks/taps cannot score twice.
  actionLocked = true;

  currentNumber += 1;
  score += 1;
  streak += 1;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
  }

  playTone(action === "BUS" ? 660 : 520, 0.07, "sine", 0.04);
  showFlash("success");
  updateUI();

  // Difficulty increases gradually, from 1000 ms down to 650 ms.
  const interval = Math.max(
    650,
    ACTION_INTERVAL - Math.floor(score / 10) * 25
  );

  // Start a completely fresh timing window for the next action.
  beginActionWindow(interval);
}

function endGame(reason) {
  if (!gameRunning) return;

  gameRunning = false;
  actionLocked = true;
  clearInterval(timerId);

  if (reason === "timeout") {
    playTone(90, 0.25, "sawtooth", 0.055);
  }

  finalScoreEl.textContent = score;
  finalCounterEl.textContent = currentNumber;
  finalHighScoreEl.textContent = highScore;

  setTimeout(() => showScreen("over"), 120);
}

startBtn.addEventListener("click", startGame);
againBtn.addEventListener("click", startGame);

countBtn.addEventListener("click", () => handleAction("COUNT"));
busBtn.addEventListener("click", () => handleAction("BUS"));

// Keyboard support makes desktop play faster while buttons remain the
// primary interface. Space/Enter are deliberately not mapped to avoid
// accidental browser/button activation causing duplicate actions.
window.addEventListener("keydown", event => {
  if (!gameRunning) return;

  if (event.key.toLowerCase() === "c") {
    event.preventDefault();
    handleAction("COUNT");
  } else if (event.key.toLowerCase() === "b") {
    event.preventDefault();
    handleAction("BUS");
  }
});

(() => {
  "use strict";

  const SHUFFLE_MOVES = 350;
  const SIZES = {
    3: "Beginner", 4: "Easy", 5: "Medium", 6: "Hard",
    7: "Expert", 8: "Master", 9: "Insane", 10: "Ultimate"
  };
  const BEST_PREFIX = "slide-solve-best-";
  const SETTINGS_KEY = "slide-solve-settings";

  const state = {
    size: 3,
    tiles: [],
    blankIndex: 8,
    moves: 0,
    elapsedMs: 0,
    timerId: null,
    started: false,
    solved: false,
    touchStart: null,
    soundEnabled: false,
    audioContext: null,
    theme: "dark"
  };

  const $ = id => document.getElementById(id);
  const board = $("board");
  const sizeSelector = $("sizeSelector");
  const timeEl = $("time");
  const movesEl = $("moves");
  const bestEl = $("bestTime");
  const difficultyEl = $("difficultyName");
  const timeCard = $("timeCard");
  const modal = $("winModal");

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      state.theme = saved.theme === "light" ? "light" : "dark";
      state.soundEnabled = saved.sound === true;
    } catch (_) {}
    document.body.classList.toggle("light", state.theme === "light");
    $("themeBtn").textContent = state.theme === "light" ? "🌙" : "☀️";
    $("soundBtn").textContent = state.soundEnabled ? "🔊" : "🔇";
    $("soundBtn").setAttribute("aria-label", state.soundEnabled ? "Turn sound off" : "Turn sound on");
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      theme: state.theme,
      sound: state.soundEnabled
    }));
  }

  function createSizeButtons() {
    sizeSelector.innerHTML = "";
    Object.keys(SIZES).forEach(size => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "size-btn";
      button.dataset.size = size;
      button.textContent = `${size}×${size}`;
      button.setAttribute("aria-label", `${size} by ${size}, ${SIZES[size]}`);
      button.addEventListener("click", () => newGame(Number(size)));
      sizeSelector.appendChild(button);
    });
  }

  function solvedBoard(size) {
    return Array.from({ length: size * size }, (_, i) =>
      i === size * size - 1 ? 0 : i + 1
    );
  }

  function adjacent(index, size) {
    const row = Math.floor(index / size);
    const col = index % size;
    const result = [];
    if (row > 0) result.push(index - size);
    if (row < size - 1) result.push(index + size);
    if (col > 0) result.push(index - 1);
    if (col < size - 1) result.push(index + 1);
    return result;
  }

  // Legal moves from the solved state always preserve solvability.
  function createPuzzle(size) {
    const tiles = solvedBoard(size);
    let blank = tiles.length - 1;
    let previousBlank = -1;

    for (let i = 0; i < SHUFFLE_MOVES; i++) {
      let choices = adjacent(blank, size);
      if (choices.length > 1) {
        choices = choices.filter(index => index !== previousBlank);
      }

      const target = choices[Math.floor(Math.random() * choices.length)];
      [tiles[blank], tiles[target]] = [tiles[target], tiles[blank]];
      previousBlank = blank;
      blank = target;
    }

    return isSolved(tiles) ? createPuzzle(size) : { tiles, blank };
  }

  function isSolved(tiles = state.tiles) {
    for (let i = 0; i < tiles.length - 1; i++) {
      if (tiles[i] !== i + 1) return false;
    }
    return tiles[tiles.length - 1] === 0;
  }

  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
  }

  function getBest(size = state.size) {
    const value = Number(localStorage.getItem(BEST_PREFIX + size));
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function setBest(size, milliseconds) {
    localStorage.setItem(BEST_PREFIX + size, String(milliseconds));
  }

  function updateBestDisplay() {
    const best = getBest();
    bestEl.textContent = best ? formatTime(best) : "--:--";
  }

  function startTimer() {
    if (state.started || state.solved) return;
    state.started = true;
    timeCard.classList.add("active");

    const startedAt = performance.now() - state.elapsedMs;
    state.timerId = setInterval(() => {
      state.elapsedMs = performance.now() - startedAt;
      timeEl.textContent = formatTime(state.elapsedMs);
    }, 50);
  }

  function stopTimer() {
    if (state.timerId !== null) clearInterval(state.timerId);
    state.timerId = null;
    timeCard.classList.remove("active");
  }

  function render(movedIndex = -1) {
    board.innerHTML = "";
    board.style.setProperty("--grid-size", state.size);
    board.style.gridTemplateColumns = `repeat(${state.size}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${state.size}, 1fr)`;

    const fragment = document.createDocumentFragment();

    state.tiles.forEach((value, index) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = value === 0 ? "tile blank" : "tile";
      tile.dataset.index = index;
      tile.style.setProperty("--i", index);
      tile.setAttribute("aria-label", value === 0 ? "Blank space" : `Tile ${value}`);

      if (value !== 0) {
        // HSL creates a coordinated rainbow while keeping consistent saturation/lightness.
        const hue = (value * 17 + state.size * 23) % 360;
        tile.style.background = `linear-gradient(145deg,hsl(${hue} 88% 76%),hsl(${(hue + 25) % 360} 82% 65%))`;
        tile.textContent = value;
        tile.addEventListener("click", () => moveTile(index));
        if (index === movedIndex) tile.classList.add("moving");
      }

      fragment.appendChild(tile);
    });

    board.appendChild(fragment);
  }

  function moveTile(index) {
    if (state.solved) return;

    // Only a tile directly next to the blank can move.
    if (!adjacent(state.blankIndex, state.size).includes(index)) {
      board.classList.remove("shake");
      void board.offsetWidth;
      board.classList.add("shake");
      playTone(120, 0.045, "square", 0.025);
      return;
    }

    startTimer();
    [state.tiles[state.blankIndex], state.tiles[index]] =
      [state.tiles[index], state.tiles[state.blankIndex]];

    state.blankIndex = index;
    state.moves++;
    movesEl.textContent = state.moves;
    playTone(420 + Math.min(state.moves, 30) * 5, 0.045, "sine", 0.035);
    render(index);

    if (isSolved()) {
      finishGame();
    } else {
      const messages = ["Nice move!", "Keep going!", "You're getting faster!", "Find the next move!", "Great rhythm!"];
      $("status").innerHTML = `<span class="status-dot"></span>${messages[state.moves % messages.length]}`;
    }
  }

  function moveBlank(direction) {
    if (state.solved) return;

    const row = Math.floor(state.blankIndex / state.size);
    const col = state.blankIndex % state.size;
    let target = -1;

    if (direction === "up" && row > 0) target = state.blankIndex - state.size;
    if (direction === "down" && row < state.size - 1) target = state.blankIndex + state.size;
    if (direction === "left" && col > 0) target = state.blankIndex - 1;
    if (direction === "right" && col < state.size - 1) target = state.blankIndex + 1;

    if (target !== -1) moveTile(target);
  }

  document.addEventListener("keydown", event => {
    if (state.solved || modal.classList.contains("visible")) return;

    const directions = {
      arrowup: "up", w: "up",
      arrowdown: "down", s: "down",
      arrowleft: "left", a: "left",
      arrowright: "right", d: "right"
    };

    const direction = directions[event.key.toLowerCase()];
    if (!direction) return;

    event.preventDefault();
    moveBlank(direction);
  });

  board.addEventListener("touchstart", event => {
    const touch = event.changedTouches[0];
    state.touchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });

  board.addEventListener("touchend", event => {
    if (!state.touchStart || state.solved) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - state.touchStart.x;
    const dy = touch.clientY - state.touchStart.y;
    state.touchStart = null;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      moveBlank(dx > 0 ? "right" : "left");
    } else {
      moveBlank(dy > 0 ? "down" : "up");
    }
  }, { passive: true });

  function ensureAudio() {
    if (!state.audioContext) {
      state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (state.audioContext.state === "suspended") state.audioContext.resume();
  }

  function playTone(frequency, duration, type = "sine", volume = 0.03) {
    if (!state.soundEnabled) return;

    try {
      ensureAudio();
      const ctx = state.audioContext;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + duration);
    } catch (_) {}
  }

  function playWinSound() {
    if (!state.soundEnabled) return;
    playTone(523, .12, "sine", .035);
    setTimeout(() => playTone(659, .12, "sine", .035), 90);
    setTimeout(() => playTone(784, .2, "sine", .04), 180);
  }

  function makeConfetti() {
    const container = $("confetti");
    container.innerHTML = "";
    for (let i = 0; i < 42; i++) {
      const piece = document.createElement("i");
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = ["#8b7cff", "#47d7ff", "#ff62b5", "#ffd66b", "#63e6be"][i % 5];
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      piece.style.animationDelay = `${Math.random() * .3}s`;
      container.appendChild(piece);
    }
  }

  function victoryMessage() {
    const messages = [
      "That was seriously smooth.",
      "You made it look easy.",
      "Your puzzle skills are leveling up.",
      "Can you beat that on the next run?",
      "One more game?",
      "That was impressive!"
    ];
    return messages[state.moves % messages.length];
  }

  function finishGame() {
    state.solved = true;
    stopTimer();

    // The interval may have fired shortly before the winning move.
    // Keep the displayed value stable for the result screen.
    timeEl.textContent = formatTime(state.elapsedMs);

    const previousBest = getBest();
    const isNewBest = !previousBest || state.elapsedMs < previousBest;
    if (isNewBest) setBest(state.size, state.elapsedMs);

    $("finalTime").textContent = formatTime(state.elapsedMs);
    $("finalMoves").textContent = state.moves;
    $("modalBest").textContent = formatTime(isNewBest ? state.elapsedMs : previousBest);
    $("winMessage").textContent = victoryMessage();
    $("newBest").hidden = !isNewBest;
    updateBestDisplay();

    board.classList.add("celebrate");
    playWinSound();
    makeConfetti();

    setTimeout(() => {
      modal.classList.add("visible");
      modal.setAttribute("aria-hidden", "false");
      $("playAgainBtn").focus();
    }, 180);
  }

  function closeModal() {
    modal.classList.remove("visible");
    modal.setAttribute("aria-hidden", "true");
    board.classList.remove("celebrate");
  }

  function newGame(size = state.size) {
    size = Math.min(10, Math.max(3, Number(size) || 3));
    stopTimer();
    closeModal();

    state.size = size;
    state.moves = 0;
    state.elapsedMs = 0;
    state.started = false;
    state.solved = false;
    state.touchStart = null;

    const puzzle = createPuzzle(size);
    state.tiles = puzzle.tiles;
    state.blankIndex = puzzle.blank;

    sizeSelector.querySelectorAll(".size-btn").forEach(button => {
      button.classList.toggle("active", Number(button.dataset.size) === size);
    });

    difficultyEl.textContent = SIZES[size];
    timeEl.textContent = "00:00";
    movesEl.textContent = "0";
    updateBestDisplay();
    $("status").innerHTML = '<span class="status-dot"></span>Make your first move to start the timer.';

    render();
    board.classList.add("entering");
    setTimeout(() => board.classList.remove("entering"), 450);
  }

  $("newGameBtn").addEventListener("click", () => {
    playTone(300, .05, "sine", .03);
    newGame(state.size);
  });

  $("playAgainBtn").addEventListener("click", () => {
    playTone(420, .05, "sine", .03);
    newGame(state.size);
  });

  $("changeSizeBtn").addEventListener("click", () => {
    closeModal();
    sizeSelector.querySelector(".active")?.focus();
  });

  $("themeBtn").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    document.body.classList.toggle("light", state.theme === "light");
    $("themeBtn").textContent = state.theme === "light" ? "🌙" : "☀️";
    saveSettings();
    playTone(560, .05);
  });

  $("soundBtn").addEventListener("click", () => {
    state.soundEnabled = !state.soundEnabled;
    $("soundBtn").textContent = state.soundEnabled ? "🔊" : "🔇";
    $("soundBtn").setAttribute("aria-label", state.soundEnabled ? "Turn sound off" : "Turn sound on");
    saveSettings();
    if (state.soundEnabled) playTone(660, .08, "sine", .035);
  });

  loadSettings();
  createSizeButtons();
  newGame(3);
})();

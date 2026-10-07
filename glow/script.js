(() => {
"use strict";

const $ = s => document.querySelector(s);
const ui = { grid: $("#grid"), level: $("#level"), moves: $("#moves"), par: $("#par"), status: $("#status"),
  best: $("#best"), reset: $("#reset"), next: $("#next") };

const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

// state: play | won
const G = { level: 1, n: 3, board: [], start: [], par: 0, moves: 0, state: "play", best: +store.get("glowBest") || 0, cells: [] };
const sizeFor = lvl => lvl <= 3 ? 3 : lvl <= 7 ? 4 : 5;

/* ---------- puzzle logic ---------- */
function toggle(board, i, n) {
  const r = Math.floor(i / n), c = i % n;
  board[i] = !board[i];
  if (r > 0) board[i - n] = !board[i - n];
  if (r < n - 1) board[i + n] = !board[i + n];
  if (c > 0) board[i - 1] = !board[i - 1];
  if (c < n - 1) board[i + 1] = !board[i + 1];
}
// Scramble by pressing random distinct cells, so every puzzle is solvable in `par` presses or fewer.
function generate(level) {
  const n = sizeFor(level), total = n * n, par = Math.min(total - 3, 2 + level);
  let board;
  do {
    board = Array(total).fill(false);
    const picks = [...board.keys()].sort(() => Math.random() - .5).slice(0, par);
    picks.forEach(i => toggle(board, i, n));
  } while (!board.some(Boolean));
  return { n, par, board };
}

/* ---------- rendering ---------- */
function buildGrid() {
  ui.grid.style.setProperty("--n", G.n);
  ui.grid.replaceChildren(...Array.from({ length: G.n * G.n }, (_, i) => {
    const b = document.createElement("button");
    b.className = "cell"; b.dataset.i = i; b.setAttribute("aria-label", `Row ${Math.floor(i / G.n) + 1}, column ${i % G.n + 1}`);
    return b;
  }));
  G.cells = [...ui.grid.children];
}
function render() {
  G.cells.forEach((el, i) => { el.classList.toggle("on", G.board[i]); el.setAttribute("aria-pressed", G.board[i]); });
  ui.level.textContent = G.level; ui.moves.textContent = G.moves; ui.par.textContent = G.par;
  ui.best.textContent = G.best > 1 ? `Best level reached: ${G.best}` : "";
  ui.grid.classList.toggle("locked", G.state === "won");
  ui.next.hidden = G.state !== "won";
}

/* ---------- game flow ---------- */
function load(level) {
  const p = generate(level);
  const rebuild = p.n !== G.n || !G.cells.length;
  Object.assign(G, { level, n: p.n, par: p.par, start: p.board.slice(), board: p.board.slice(), moves: 0, state: "play" });
  if (rebuild) buildGrid();
  ui.status.textContent = "Turn every light off";
  render();
}
function resetPuzzle() {
  G.board = G.start.slice(); G.moves = 0; G.state = "play";
  ui.status.textContent = "Turn every light off";
  render(); G.cells[0]?.focus({ preventScroll: true });
}
function press(i) {
  if (G.state !== "play") return;
  toggle(G.board, i, G.n); G.moves++;
  if (!G.board.some(Boolean)) {
    G.state = "won";
    if (G.level + 1 > G.best) { G.best = G.level + 1; store.set("glowBest", G.best); }
    ui.status.textContent = G.moves <= G.par ? `Solved in ${G.moves}. Par or better!` : `Solved in ${G.moves} moves`;
    render(); ui.next.focus({ preventScroll: true });
  } else render();
}
const nextLevel = () => { load(G.level + 1); };

/* ---------- input (registered once) ---------- */
ui.grid.addEventListener("click", e => { const c = e.target.closest(".cell"); if (c) press(+c.dataset.i); });
ui.reset.addEventListener("click", resetPuzzle);
ui.next.addEventListener("click", nextLevel);
document.addEventListener("click", e => { if (e.detail > 0 && !e.target.closest?.("#next")) e.target.closest?.("button")?.blur(); });
document.addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const cur = G.cells.indexOf(document.activeElement), n = G.n;
  const move = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -n, ArrowDown: n, a: -1, d: 1, w: -n, s: n }[k];
  if (move !== undefined) {
    e.preventDefault();
    const from = cur < 0 ? 0 : cur, to = from + move;
    const sameRow = Math.abs(move) !== 1 || Math.floor(to / n) === Math.floor(from / n);
    if (to >= 0 && to < n * n && sameRow) G.cells[to].focus({ preventScroll: true });
    else if (cur < 0) G.cells[0].focus({ preventScroll: true });
  } else if (k === "r") resetPuzzle();
  else if ((k === " " || k === "Enter") && cur < 0 && !e.target.closest?.("button")) {
    e.preventDefault(); G.state === "won" ? nextLevel() : G.cells[0].focus({ preventScroll: true });
  }
});

load(1);
})();

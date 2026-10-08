/**
 * games-data.js
 * -----------------------------------------------------------------
 * Central configuration for the Games section.
 * To add a new game: add one entry to the GAMES array below.
 * The section renders automatically — no other file needs editing.
 *
 * Fields
 * ------
 *   id          — slug matching the actual folder name
 *   name        — display title on the card
 *   description — one-sentence summary
 *   tags        — 1-2 genre labels
 *   category    — filter chip: Arcade | Puzzle | Strategy | Reflex | Casual
 *   folder      — path from site root (no trailing slash)
 *   color       — accent hex  (gradient, glow, button, tags)
 *   colorRGB    — same color as "r,g,b" for CSS rgba() usage
 * -----------------------------------------------------------------
 */

const GAMES = [
  {
    id:          "archery",
    name:        "Archery",
    description: "Pull back, aim, and release — a precision challenge that tests your timing and steady hand.",
    tags:        ["Precision", "Canvas"],
    category:    "Reflex",
    folder:      "archery",
    color:       "#f43f5e",
    colorRGB:    "244,63,94",
  },
  {
    id:          "bus-game",
    name:        "Bus Game",
    description: "Navigate packed streets, pick up passengers on time, and dodge relentless city traffic.",
    tags:        ["Driving", "Arcade"],
    category:    "Arcade",
    folder:      "bus-game",
    color:       "#f59e0b",
    colorRGB:    "245,158,11",
  },
  {
    id:          "clean-city",
    name:        "Clean City",
    description: "Manage resources and clean up pollution — build the greenest, healthiest city you can.",
    tags:        ["Strategy", "Simulation"],
    category:    "Strategy",
    folder:      "clean-city",
    color:       "#22c55e",
    colorRGB:    "34,197,94",
  },
  {
    id:          "color-maze",
    name:        "Color Maze",
    description: "Match hues to unlock paths through a shifting labyrinth — fast reflexes, sharp logic.",
    tags:        ["Puzzle", "Maze"],
    category:    "Puzzle",
    folder:      "color-maze",
    color:       "#a855f7",
    colorRGB:    "168,85,247",
  },
  {
    id:          "dodge-the-blocks",
    name:        "Dodge the Blocks",
    description: "Survive an endless storm of falling blocks — dodge, weave, and outlast them all.",
    tags:        ["Reflex", "Survival"],
    category:    "Reflex",
    folder:      "dodge-the-blocks",
    color:       "#3b82f6",
    colorRGB:    "59,130,246",
  },
  {
    id:          "drop",
    name:        "Drop",
    description: "Time your releases to stack pieces perfectly and build the tallest tower possible.",
    tags:        ["Timing", "Casual"],
    category:    "Casual",
    folder:      "drop",
    color:       "#06b6d4",
    colorRGB:    "6,182,212",
  },
  {
    id:          "echo",
    name:        "Echo",
    description: "Listen carefully, then repeat the audio sequence — each round adds one more beat.",
    tags:        ["Memory", "Audio"],
    category:    "Puzzle",
    folder:      "echo",
    color:       "#8b5cf6",
    colorRGB:    "139,92,246",
  },
  {
    id:          "glow",
    name:        "Glow",
    description: "Trace neon patterns in sync with the rhythm — a hypnotic visual and tactile treat.",
    tags:        ["Rhythm", "Neon"],
    category:    "Casual",
    folder:      "glow",
    color:       "#fbbf24",
    colorRGB:    "251,191,36",
  },
  {
    id:          "harbour-control",
    name:        "Harbour Control",
    description: "Guide ships into port safely, manage docking queues, and prevent maritime collisions.",
    tags:        ["Strategy", "Management"],
    category:    "Strategy",
    folder:      "harbour-control",
    color:       "#38bdf8",
    colorRGB:    "56,189,248",
  },
  {
    id:          "memory-grid",
    name:        "Memory Grid",
    description: "Watch the grid flash, then recreate the pattern — each round harder than the last.",
    tags:        ["Memory", "Puzzle"],
    category:    "Puzzle",
    folder:      "memory-grid",
    color:       "#ec4899",
    colorRGB:    "236,72,153",
  },
  {
    id:          "neon-reflex",
    name:        "Neon Reflex",
    description: "React to flashing neon cues before they vanish — the ultimate reaction-speed test.",
    tags:        ["Reflex", "Neon"],
    category:    "Reflex",
    folder:      "neon-reflex",
    color:       "#00d9ff",
    colorRGB:    "0,217,255",
  },
  {
    id:          "number-rush",
    name:        "Number Rush",
    description: "Tap numbers in the correct order against the clock — speed and accuracy both count.",
    tags:        ["Speed", "Arcade"],
    category:    "Arcade",
    folder:      "number-rush",
    color:       "#f97316",
    colorRGB:    "249,115,22",
  },
  {
    id:          "reaction",
    name:        "Reaction",
    description: "Wait for the signal, then click as fast as humanly possible — a pure reflex benchmark.",
    tags:        ["Reflex", "Speed"],
    category:    "Reflex",
    folder:      "reaction",
    color:       "#ef4444",
    colorRGB:    "239,68,68",
  },
  {
    id:          "slidensolve",
    name:        "Slide n Solve",
    description: "Slide tiles into place to restore a scrambled image — a classic puzzle, reimagined.",
    tags:        ["Puzzle", "Classic"],
    category:    "Puzzle",
    folder:      "slidensolve",
    color:       "#7c3aed",
    colorRGB:    "124,58,237",
  },
  {
    id:          "stack",
    name:        "Stack",
    description: "Stack blocks with split-second timing and build the tallest tower you can manage.",
    tags:        ["Timing", "Casual"],
    category:    "Casual",
    folder:      "stack",
    color:       "#84cc16",
    colorRGB:    "132,204,22",
  },
  {
    id:          "traffic",
    name:        "Traffic",
    description: "Control signals at chaotic intersections to keep the city moving and avoid gridlock.",
    tags:        ["Strategy", "Management"],
    category:    "Strategy",
    folder:      "traffic",
    color:       "#10b981",
    colorRGB:    "16,185,129",
  },
];

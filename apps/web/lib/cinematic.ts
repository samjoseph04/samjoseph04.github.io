// One cadence for all entrances. Long content never creates long reveal queues.
export const cinema = {
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  enter: 0.72,
  word: 0.72,
  character: 0.9,
  image: 1.15,
  detail: 0.42,
};

// A tiny, fixed first-paint gate, never interpolated with authored content.
// No JS/reduced motion stays visible; failed or slow hydration fails open.
export const cinematicBoot = `try {
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.dataset.cinemaBoot = 'on';
    setTimeout(function () {
      document.documentElement.dataset.cinemaBoot =
        document.querySelector('[data-cinema="on"]') ? 'complete' : 'expired';
    }, 1800);
  }
} catch (e) {}`;

export function revealStep(count: number, characters = false) {
  return count > 1 ? Math.min(characters ? 0.035 : 0.032, 0.36 / (count - 1)) : 0;
}

export function splitWords(text: string) {
  return text.split(/(\s+)/u).filter(Boolean);
}

export function splitCharacters(text: string) {
  return Array.from(new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text),
    ({ segment }) => segment);
}

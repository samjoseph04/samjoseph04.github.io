import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { runInNewContext } from 'node:vm';
import CinematicText from '../apps/web/components/CinematicText';
import { cinema, cinematicBoot, revealStep, splitWords, splitCharacters } from '../apps/web/lib/cinematic';

test('first-paint preparation respects reduced motion and fails open without hydration', () => {
  for (const reduced of [true, false]) for (const hydrated of [true, false]) {
    const dataset: Record<string, string> = {};
    let fallback: (() => void) | undefined;
    runInNewContext(cinematicBoot, {
      matchMedia: () => ({ matches: reduced }),
      document: { documentElement: { dataset }, querySelector: () => hydrated ? {} : null },
      setTimeout: (callback: () => void, delay: number) => {
        assert.equal(delay, 1800);
        fallback = callback;
      },
    });
    if (reduced) {
      assert.equal(dataset.cinemaBoot, undefined);
      assert.equal(fallback, undefined);
    } else {
      assert.equal(dataset.cinemaBoot, 'on');
      fallback!();
      assert.equal(dataset.cinemaBoot, hydrated ? 'complete' : 'expired');
    }
  }
});

test('text splitting preserves authored whitespace, punctuation and complete Unicode characters', () => {
  const text = 'Build  with\ncuriosity.\tCreate 👩🏽‍💻 & café.';
  assert.equal(splitWords(text).join(''), text);
  assert.deepEqual(splitCharacters('👩🏽‍💻e\u0301'), ['👩🏽‍💻', 'e\u0301']);
});

test('cinematic text exports visible, escaped text and one unsplit accessible version', () => {
  for (const characters of [true, false]) {
    const html = renderToStaticMarkup(createElement(CinematicText, {
      text: 'Code <script> & create.', characters,
    }));
    assert.equal((html.match(/class="sr-only"/g) || []).length, 1);
    assert(html.includes('<span class="sr-only">Code &lt;script&gt; &amp; create.</span>'));
    assert(html.includes('aria-hidden="true" class="cinema-visual"'));
    assert(!html.includes('<script>'));
    assert(!html.includes('opacity:0'));
    assert(!html.includes('data-reveal-state'));
  }
});

test('long descriptions have a bounded reveal queue rather than per-word cumulative delays', () => {
  for (const count of [0, 1, 5, 20, 100, 1000]) {
    for (const characters of [false, true]) {
      const spread = revealStep(count, characters) * Math.max(0, count - 1);
      assert(spread >= 0 && spread <= 0.360001);
      assert(spread + (characters ? cinema.character : cinema.word) <= 1.260001);
    }
  }
});

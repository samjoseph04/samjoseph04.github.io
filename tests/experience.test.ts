import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { portfolioSchema } from '../packages/content/schema';
import { AmbientSound, formatIndiaTime } from '../apps/web/lib/experience';
import { searchGames, gameHref, gameRailState } from '../apps/web/lib/games';
import Games from '../apps/web/components/Games';
import ExperienceControls from '../apps/web/components/ExperienceControls';

const content = portfolioSchema.parse(
  JSON.parse(readFileSync(new URL('../content/portfolio.json', import.meta.url), 'utf8')),
);

test('clock converts UTC to IST, including midnight, without relying on machine timezone', () => {
  assert.equal(formatIndiaTime(new Date('2026-11-13T10:20:30Z')), '15:50:30');
  assert.equal(formatIndiaTime(new Date('2026-11-13T18:30:00Z')), '00:00:00');
});
test('search matches category, tags and descriptions; whitespace and case do not affect results', () => {
  assert.equal(searchGames(content.games, '  ARCHERY  ')[0].id, 'archery');
  assert.equal(
    searchGames(content.games, 'puzzle').filter((g) => g.category === 'Puzzle').length,
    4,
  );
  assert.ok(searchGames(content.games, 'Canvas').some((g) => g.id === 'archery'));
  assert.ok(searchGames(content.games, 'multiples').length === 0);
  assert.ok(searchGames(content.games, 'multiple of five').some((g) => g.id === 'bus-game'));
  assert.equal(searchGames(content.games, 'no-such-game').length, 0);
  assert.equal(searchGames(content.games, ' ').length, 17);
});
test('legacy metadata remains compatible while production and development game destinations stay intact', () => {
  const legacy = structuredClone(content);
  delete (legacy.games[0] as Partial<(typeof legacy.games)[number]>).featured;
  assert.equal(portfolioSchema.parse(legacy).games[0].featured, false);
  for (const game of content.games) {
    assert.equal(gameHref(game), game.destination);
    assert.equal(gameHref(game, true), `${game.destination}index.html`);
  }
});
test('minimal markup retains all 17 playable games without the featured panel or decorative artwork; sound is initially off', () => {
  const html = renderToStaticMarkup(createElement(Games, { games: content.games }));
  assert.equal((html.match(/class="arcade-card"/g) || []).length, 17);
  assert.ok(html.includes('aria-label="Game collection"'));
  assert.ok(html.includes('tabindex="0"'));
  assert.ok(html.includes('aria-label="Scroll to previous games"'));
  assert.ok(html.includes('aria-label="Scroll to next games"'));
  assert.ok(!html.includes('arcade-featured'));
  assert.ok(!html.includes('arcade-art'));
  assert.ok(!html.includes('arcade-tags'));
  assert.ok(html.includes('Showing 17 of 17 games'));
  for (const game of content.games) assert.ok(html.includes(`href="${game.destination}"`));
  const controls = renderToStaticMarkup(createElement(ExperienceControls));
  assert.ok(controls.includes('aria-pressed="false"'));
  assert.ok(controls.includes('Enable ambient sound'));
  assert.ok(controls.includes('--:--:--'));
});

test('horizontal rail navigation handles both ends, fractional pixels, overscroll and resize', () => {
  assert.deepEqual(gameRailState(0, 300, 1200), {
    previous: false,
    next: true,
    progress: 0,
    fraction: 0.25,
  });
  assert.deepEqual(gameRailState(450, 300, 1200), {
    previous: true,
    next: true,
    progress: 50,
    fraction: 0.25,
  });
  assert.deepEqual(gameRailState(899.6, 300, 1200), {
    previous: true,
    next: false,
    progress: 100,
    fraction: 0.25,
  });
  assert.equal(gameRailState(-20, 300, 1200).previous, false);
  assert.equal(gameRailState(1000, 300, 1200).progress, 100);
  assert.deepEqual(gameRailState(450, 1200, 1200), {
    previous: false,
    next: false,
    progress: 0,
    fraction: 1,
  });
  assert.deepEqual(gameRailState(0, 0, 0), {
    previous: false,
    next: false,
    progress: 0,
    fraction: 1,
  });
});

function fakeAudio(resume: () => Promise<void> = async () => {}) {
  const sources: any[] = [];
  let closed = 0;
  const parameter = () => ({
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    cancelScheduledValues() {},
  });
  const context = {
    state: 'running',
    currentTime: 0,
    destination: {},
    resume,
    close: async () => {
      closed++;
    },
    createGain: () => ({ gain: parameter(), connect() {}, disconnect() {} }),
    createOscillator: () => {
      const source = {
        frequency: parameter(),
        type: '',
        started: false,
        stopped: false,
        connect() {},
        disconnect() {},
        start() {
          this.started = true;
        },
        stop() {
          this.stopped = true;
        },
      };
      sources.push(source);
      return source;
    },
  };
  return { context: context as unknown as AudioContext, sources, closed: () => closed };
}
test('ambient audio is lazy and releases all oscillators/context when disabled', async () => {
  const fake = fakeAudio();
  let created = 0;
  const sound = new AmbientSound(() => {
    created++;
    return fake.context;
  });
  assert.equal(created, 0);
  assert.equal(await sound.start(), true);
  assert.equal(created, 1);
  assert.equal(fake.sources.length, 6);
  sound.stop();
  sound.stop();
  assert.ok(fake.sources.every((source) => source.stopped));
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(fake.closed(), 1);
});
test('disabling during a pending browser resume cannot start late audio', async () => {
  let complete!: () => void;
  const fake = fakeAudio(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  const sound = new AmbientSound(() => fake.context);
  const pending = sound.start();
  sound.stop();
  complete();
  assert.equal(await pending, false);
  assert.equal(fake.sources.length, 0);
  assert.equal(fake.closed(), 1);
});
test('browser audio failures close the context and do not leave playing sources', async () => {
  const fake = fakeAudio(async () => {
    throw new Error('Gesture rejected');
  });
  const sound = new AmbientSound(() => fake.context);
  await assert.rejects(sound.start(), /Gesture rejected/);
  assert.equal(fake.sources.length, 0);
  assert.equal(fake.closed(), 1);
});

test('an unexpected browser suspension stops the session and reports interruption', async () => {
  const fake = fakeAudio();
  let interrupted = 0;
  const sound = new AmbientSound(
    () => fake.context,
    () => {
      interrupted++;
    },
  );
  await sound.start();
  Object.assign(fake.context, { state: 'suspended' });
  fake.context.onstatechange?.(new Event('statechange'));
  assert.equal(interrupted, 1);
  assert.ok(fake.sources.every((source) => source.stopped));
  assert.equal(fake.closed(), 1);
});

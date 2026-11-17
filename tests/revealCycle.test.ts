import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RevealCycle, revealSide } from '../apps/web/lib/revealCycle';

test('reveal cycles replay after exits on both sides, including initial bottom/middle loads', () => {
  for (const start of ['above', 'below', 'inside'] as const) {
    const cycle = new RevealCycle(start);
    assert.equal(cycle.phase, 'pending');
    for (const exit of ['above', 'below', 'above', 'below'] as const) {
      const revision = cycle.enter()!;
      assert.equal(cycle.phase, 'revealing');
      assert.equal(cycle.enter(), null, 'repeated observations must not restart a run');
      assert(cycle.complete(revision));
      assert.equal(cycle.phase, 'revealed');
      assert.equal(cycle.enter(), null);
      cycle.leave(exit);
      assert.equal(cycle.phase, 'pending');
      assert.equal(cycle.side, exit);
    }
  }
});

test('rapid direction changes invalidate old animation completions instead of hiding a newer run', () => {
  const cycle = new RevealCycle('below');
  const first = cycle.enter()!;
  cycle.leave('above');
  const second = cycle.enter()!;
  assert(!cycle.complete(first));
  assert.equal(cycle.phase, 'revealing');
  assert(cycle.complete(second));
  cycle.leave('below');
  assert(!cycle.complete(second));
  assert.equal(cycle.phase, 'pending');
});

test('keyboard/late-start visibility is retained until the next unfocused full exit', () => {
  const cycle = new RevealCycle('above');
  const first = cycle.enter()!;
  cycle.show();
  assert.equal(cycle.phase, 'revealed');
  assert(!cycle.complete(first));
  cycle.leave('above', true);
  assert.equal(cycle.phase, 'revealed');
  cycle.leave('above', false);
  assert.equal(cycle.phase, 'pending');
  assert.notEqual(cycle.enter(), null);
});

test('visibility sides use actual viewport bounds, with symmetric top/bottom and rail-edge handling', () => {
  const view = { top: 0, bottom: 960, left: 0, right: 1440 };
  const rect = { top: 100, bottom: 200, left: 50, right: 300 };
  assert.equal(revealSide(rect, view), 'inside');
  assert.equal(revealSide({ ...rect, top: -100, bottom: 0 }, view), 'above');
  assert.equal(revealSide({ ...rect, top: 960, bottom: 1060 }, view), 'below');
  assert.equal(revealSide({ ...rect, left: -250, right: 0 }, view), 'left');
  assert.equal(revealSide({ ...rect, left: 1440, right: 1600 }, view), 'right');
  assert.equal(revealSide({ ...rect, top: -99, bottom: 1 }, view), 'inside');
  assert.equal(revealSide({ ...rect, top: 959, bottom: 1060 }, view), 'inside');
});

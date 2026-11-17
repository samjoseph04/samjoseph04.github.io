import { test } from 'node:test';
import assert from 'node:assert/strict';
import { magneticOffset, pointerEffectsAllowed } from '../apps/web/lib/interactions';

test('pointer effects require a fine mouse, hover support, and no reduced-motion preference', () => {
  assert.equal(pointerEffectsAllowed(true, true, false), true);
  assert.equal(pointerEffectsAllowed(false, true, false), false);
  assert.equal(pointerEffectsAllowed(true, false, false), false);
  assert.equal(pointerEffectsAllowed(true, true, true), false);
  assert.equal(pointerEffectsAllowed(true, true, false, 'touch'), false);
  assert.equal(pointerEffectsAllowed(true, true, false, 'pen'), false);
});

test('magnetic offsets remain bounded and center on stationary control geometry', () => {
  const bounds = { left: 100, top: 50, width: 80, height: 40 };
  assert.deepEqual(magneticOffset(140, 70, bounds), { x: 0, y: 0 });
  assert.deepEqual(magneticOffset(180, 90, bounds), { x: 4, y: 4 });
  assert.deepEqual(magneticOffset(-100, 500, bounds), { x: -4, y: 4 });
  assert.deepEqual(magneticOffset(1000, -500, bounds, 100), { x: 6, y: -6 });
  assert.deepEqual(magneticOffset(180, 90, bounds, 2), { x: 2, y: 2 });
  assert.deepEqual(magneticOffset(180, 90, bounds, -3), { x: 0, y: 0 });
});

test('hidden or invalid magnetic targets never produce NaN or unbounded transforms', () => {
  assert.deepEqual(magneticOffset(10, 20, { left: 0, top: 0, width: 0, height: 0 }), {
    x: 0,
    y: 0,
  });
  assert.deepEqual(magneticOffset(Infinity, 20, { left: 0, top: 0, width: 50, height: 30 }), {
    x: 0,
    y: 0,
  });
});

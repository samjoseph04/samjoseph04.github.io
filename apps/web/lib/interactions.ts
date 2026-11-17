export type Bounds = { left: number; top: number; width: number; height: number };

export function pointerEffectsAllowed(
  fine: boolean,
  hover: boolean,
  reduced: boolean,
  pointerType = 'mouse',
) {
  return fine && hover && !reduced && pointerType === 'mouse';
}

export function magneticOffset(x: number, y: number, bounds: Bounds, strength = 4) {
  if (
    bounds.width <= 0 ||
    bounds.height <= 0 ||
    ![x, y, bounds.left, bounds.top, bounds.width, bounds.height].every(Number.isFinite)
  )
    return { x: 0, y: 0 };
  const limit = Math.max(0, Math.min(Number.isFinite(strength) ? strength : 4, 6));
  const clamp = (value: number) => Math.max(-1, Math.min(1, value));
  return {
    x: clamp(((x - bounds.left) / bounds.width - 0.5) * 2) * limit,
    y: clamp(((y - bounds.top) / bounds.height - 0.5) * 2) * limit,
  };
}

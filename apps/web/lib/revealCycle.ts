export type RevealSide = 'above' | 'below' | 'left' | 'right' | 'inside';
export type RevealPhase = 'pending' | 'revealing' | 'revealed';

// Observation survives completion. A full exit arms the next entrance.
// Revisions prevent a cancelled run from completing a newer one.
export class RevealCycle {
  phase: RevealPhase = 'pending';
  revision = 0;
  constructor(public side: RevealSide = 'inside') {}

  enter() {
    if (this.phase !== 'pending') return null;
    this.phase = 'revealing';
    return ++this.revision;
  }
  leave(side: RevealSide, focused = false) {
    this.side = side;
    this.phase = focused ? 'revealed' : 'pending';
    this.revision++;
  }
  complete(revision: number) {
    if (revision !== this.revision || this.phase !== 'revealing') return false;
    this.phase = 'revealed';
    return true;
  }
  show() {
    this.phase = 'revealed';
    this.revision++;
  }
}

export function revealSide(
  rect: { top: number; bottom: number; left: number; right: number },
  viewport: { top: number; bottom: number; left: number; right: number },
): RevealSide {
  if (rect.bottom <= viewport.top) return 'above';
  if (rect.top >= viewport.bottom) return 'below';
  if (rect.right <= viewport.left) return 'left';
  if (rect.left >= viewport.right) return 'right';
  return 'inside';
}

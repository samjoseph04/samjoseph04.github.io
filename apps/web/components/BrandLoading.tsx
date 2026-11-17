import React from 'react';
import BrandMark from './BrandMark';

/** Uses the existing boot gate; never delays content or adds a scroll lock. */
export default function BrandLoading({ initial = false }: { initial?: boolean }) {
  return (
    <div
      className={`brand-loading${initial ? ' brand-loading--initial' : ''}`}
      role={initial ? undefined : 'status'}
      aria-hidden={initial ? true : undefined}
    >
      <BrandMark className="brand-loading-mark" />
      {!initial && <span className="sr-only">Loading portfolio…</span>}
    </div>
  );
}

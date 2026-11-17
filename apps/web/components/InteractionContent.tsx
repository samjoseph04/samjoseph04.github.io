import React, { type ReactNode } from 'react';

/** Only this inner content moves; the native control's hit area remains stationary. */
export function MagneticContent({ children }: { children: ReactNode }) {
  return (
    <span className="magnetic-content" data-magnetic-content="">
      {children}
    </span>
  );
}

/** Clipped well inside a section so lighting never changes its straight boundary. */
export function SectionLight() {
  return (
    <div className="interaction-light-window" aria-hidden="true">
      <div className="interaction-light-spot" />
    </div>
  );
}

import React from 'react';
import geometry from '../brand/monogram.json';

/** Geometry generated from the approved assets/sj-logo.svg. No font substitutes. */
export default function BrandMark({ className = 'brand-monogram' }: { className?: string }) {
  return (
    <svg className={className} aria-hidden="true" focusable="false"
      xmlns="http://www.w3.org/2000/svg" viewBox={geometry.viewBox} fill="none">
      <g fill="var(--tone-paper)">
        {geometry.paths.map((d, index) => <path key={index} d={d} />)}
      </g>
      <circle {...geometry.dot} fill="var(--tone-secondary)" />
    </svg>
  );
}

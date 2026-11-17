'use client';

import React, {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { gameRailState } from '../lib/games';
import { MagneticContent } from './InteractionContent';

export default function GameRail({
  children,
  resetKey,
  count,
  total,
}: {
  children: ReactNode;
  resetKey: string;
  count: number;
  total: number;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const id = useId();
  const reduce = useReducedMotion();
  const [position, setPosition] = useState(() => gameRailState(0, 0, 0));

  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    // A new search/category starts at the first result, even during a smooth scroll.
    element.scrollTo({ left: 0, behavior: 'instant' });
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        setPosition(gameRailState(element.scrollLeft, element.clientWidth, element.scrollWidth)),
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    for (const card of element.children) observer.observe(card);
    element.addEventListener('scroll', measure, { passive: true });
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      element.removeEventListener('scroll', measure);
    };
  }, [resetKey, count]);

  function navigate(direction: number | 'start' | 'end') {
    const element = rail.current;
    if (!element) return;
    const next =
      direction === 'start'
        ? 0
        : direction === 'end'
          ? element.scrollWidth
          : element.scrollLeft + direction * element.clientWidth * 0.85;
    element.scrollTo({ left: next, behavior: reduce ? 'instant' : 'smooth' });
  }
  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Let native links retain their own keyboard behavior.
    if (
      event.target !== event.currentTarget ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return;
    const keys = { ArrowLeft: -1, ArrowRight: 1, Home: 'start', End: 'end' } as const;
    const direction = keys[event.key as keyof typeof keys];
    if (direction !== undefined) {
      event.preventDefault();
      navigate(direction);
    }
  }
  return (
    <div className="arcade-library">
      <div className="arcade-rail-heading">
        <p className="arcade-results" role="status">
          Showing {count} of {total} games
        </p>
        <div className="arcade-rail-controls" role="group" aria-label="Game collection navigation">
          <button
            type="button"
            data-magnetic="3"
            aria-label="Scroll to previous games"
            aria-controls={count > 0 ? id : undefined}
            disabled={count === 0 || !position.previous}
            onClick={() => navigate(-1)}
          >
            <MagneticContent>
              <ArrowLeft size={18} aria-hidden="true" />
            </MagneticContent>
          </button>
          <button
            type="button"
            data-magnetic="3"
            aria-label="Scroll to next games"
            aria-controls={count > 0 ? id : undefined}
            disabled={count === 0 || !position.next}
            onClick={() => navigate(1)}
          >
            <MagneticContent>
              <ArrowRight size={18} aria-hidden="true" />
            </MagneticContent>
          </button>
        </div>
      </div>
      <p id={`${id}-help`} className="sr-only">
        Swipe or scroll to explore. When the collection is focused, use Left, Right, Home or End.
        Tab reaches each game.
      </p>
      {count > 0 && (
        <div
          ref={rail}
          id={id}
          className="arcade-rail"
          role="region"
          aria-label="Game collection"
          aria-describedby={`${id}-help`}
          tabIndex={0}
          onKeyDown={keyDown}
        >
          {children}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useRef, useState, type RefObject } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { magneticOffset, pointerEffectsAllowed } from '../lib/interactions';

const controls = 'a[href], button, summary, [role="button"]';
const headingSelector = '.hero h1, .section-heading h2, .contact-section h2';

function cursorContext(target: Element) {
  if (target.closest('input,textarea,select,[contenteditable="true"]'))
    return { label: '', kind: 'text' };
  const control = target.closest<HTMLElement>(controls);
  if (control?.matches(':disabled,[aria-disabled="true"]')) return { label: 'DISABLED', kind: 'control' };
  const explicit = target.closest<HTMLElement>('[data-cursor]')?.dataset.cursor;
  if (explicit) return { label: explicit, kind: 'control' };
  if (target.closest('[draggable="true"]')) return { label: 'DRAG', kind: 'control' };
  if (control?.matches('summary'))
    return { label: control.closest('details')?.open ? 'CLOSE' : 'OPEN', kind: 'control' };
  if (control?.closest('.arcade-filters')) return { label: 'FILTER', kind: 'control' };
  if (control?.matches('.sound-toggle')) return { label: 'SOUND', kind: 'control' };
  if (control?.matches('.menu-button')) return { label: 'MENU', kind: 'control' };
  if (control?.matches('a'))
    return {
      label: control.getAttribute('href')?.startsWith('#') ? 'GO' : 'OPEN',
      kind: 'control',
    };
  if (control) return { label: 'CLICK', kind: 'control' };
  return { label: target.closest('.project') ? 'PROJECT' : '', kind: 'default' };
}

export default function InteractionLayer({
  rootRef,
}: {
  rootRef: RefObject<HTMLDivElement | null>;
}) {
  const [enabled, setEnabled] = useState(false);
  const [context, setContext] = useState({ label: '', kind: 'default' });
  const [pressed, setPressed] = useState(false);
  const [pulse, setPulse] = useState<{ id: number; x: number; y: number; color: string } | null>(
    null,
  );
  const contextRef = useRef(context);
  const x = useMotionValue(-1000),
    y = useMotionValue(-1000),
    visible = useMotionValue(0);
  const dotX = useSpring(x, { stiffness: 1100, damping: 50 }),
    dotY = useSpring(y, { stiffness: 1100, damping: 50 });
  const ringX = useSpring(x, { stiffness: 500, damping: 38 }),
    ringY = useSpring(y, { stiffness: 500, damping: 38 });
  const tailX = useSpring(x, { stiffness: 240, damping: 32 }),
    tailY = useSpring(y, { stiffness: 240, damping: 32 });
  const tailOpacity = useTransform(visible, (value) => value * 0.2);

  useEffect(() => {
    const fine = matchMedia('(pointer: fine)'),
      hover = matchMedia('(hover: hover)'),
      reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () =>
      setEnabled(pointerEffectsAllowed(fine.matches, hover.matches, reduced.matches));
    update();
    for (const query of [fine, hover, reduced]) query.addEventListener('change', update);
    return () => {
      for (const query of [fine, hover, reduced]) query.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root) return;
    root.dataset.interactions = 'pointer';
    let frame = 0,
      sequence = 0;
    let mouseInput = false;
    let latest: { x: number; y: number; target: Element } | null = null;
    let magnet: { control: HTMLElement; content: HTMLElement; rect: DOMRect } | null = null;
    let heading: { element: HTMLElement; rect: DOMRect } | null = null;
    let light: {
      section: HTMLElement;
      window: HTMLElement;
      spot: HTMLElement;
      rect: DOMRect;
    } | null = null;

    function resetMagnet() {
      if (!magnet) return;
      magnet.content.style.removeProperty('--magnet-x');
      magnet.content.style.removeProperty('--magnet-y');
      magnet.content.removeAttribute('data-magnet-active');
      magnet = null;
    }
    function resetHeading() {
      if (!heading) return;
      heading.element.removeAttribute('data-heading-active');
      for (const name of ['--heading-base', '--heading-x', '--heading-y'])
        heading.element.style.removeProperty(name);
      heading = null;
    }
    function resetLight() {
      if (!light) return;
      light.window.removeAttribute('data-light-active');
      light = null;
    }
    function reset() {
      mouseInput = false;
      cancelAnimationFrame(frame);
      frame = 0;
      latest = null;
      visible.set(0);
      delete root!.dataset.customCursor;
      setPressed(false);
      setPulse(null);
      resetMagnet();
      resetHeading();
      resetLight();
    }
    function update() {
      frame = 0;
      if (!latest || !root!.contains(latest.target)) return;
      const point = latest,
        target = point.target;
      const next = cursorContext(target);
      if (next.label !== contextRef.current.label || next.kind !== contextRef.current.kind) {
        contextRef.current = next;
        setContext(next);
      }
      if (visible.get() === 0) {
        x.jump(point.x);
        y.jump(point.y);
        dotX.jump(point.x);
        dotY.jump(point.y);
        ringX.jump(point.x);
        ringY.jump(point.y);
        tailX.jump(point.x);
        tailY.jump(point.y);
      }
      x.set(point.x);
      y.set(point.y);
      visible.set(1);
      // Hide native pointers only after the replacement is positioned/visible.
      root!.dataset.customCursor = 'active';

      const control = target.closest<HTMLElement>('[data-magnetic]');
      if (control !== magnet?.control) {
        resetMagnet();
        const content = control?.querySelector<HTMLElement>('[data-magnetic-content]');
        // Never move a photograph, logo, or a wrapper containing an image.
        if (
          control &&
          content &&
          !control.matches(':disabled,[aria-disabled="true"]') &&
          !content.querySelector('img,picture,video') &&
          !content.matches('img,picture,video')
        ) {
          magnet = { control, content, rect: control.getBoundingClientRect() };
          content.setAttribute('data-magnet-active', '');
        }
      }
      if (magnet) {
        const offset = magneticOffset(
          point.x,
          point.y,
          magnet.rect,
          Number(magnet.control.dataset.magnetic) || 4,
        );
        magnet.content.style.setProperty('--magnet-x', `${offset.x}px`);
        magnet.content.style.setProperty('--magnet-y', `${offset.y}px`);
      }

      const title = target.closest<HTMLElement>(headingSelector);
      if (title !== heading?.element) {
        resetHeading();
        if (title) {
          const base = getComputedStyle(title).color;
          heading = { element: title, rect: title.getBoundingClientRect() };
          title.style.setProperty('--heading-base', base);
          title.setAttribute('data-heading-active', '');
        }
      }
      if (heading) {
        heading.element.style.setProperty('--heading-x', `${point.x - heading.rect.left}px`);
        heading.element.style.setProperty('--heading-y', `${point.y - heading.rect.top}px`);
      }

      const section = target.closest<HTMLElement>('[data-interactive-light]');
      if (section !== light?.section) {
        resetLight();
        const window = section?.querySelector<HTMLElement>('.interaction-light-window');
        const spot = window?.querySelector<HTMLElement>('.interaction-light-spot');
        if (section && window && spot)
          light = { section, window, spot, rect: window.getBoundingClientRect() };
      }
      if (light) {
        const inside =
          point.x >= light.rect.left &&
          point.x <= light.rect.right &&
          point.y >= light.rect.top &&
          point.y <= light.rect.bottom;
        light.window.toggleAttribute('data-light-active', inside);
        light.spot.style.setProperty('--light-x', `${point.x - light.rect.left}px`);
        light.spot.style.setProperty('--light-y', `${point.y - light.rect.top}px`);
      }
    }
    function move(event: PointerEvent) {
      if (!pointerEffectsAllowed(true, true, false, event.pointerType)) {
        reset();
        return;
      }
      if (!(event.target instanceof Element)) return;
      mouseInput = true;
      latest = { x: event.clientX, y: event.clientY, target: event.target };
      if (!frame) frame = requestAnimationFrame(update);
    }
    function down(event: PointerEvent) {
      if (event.pointerType === 'mouse') {
        mouseInput = true;
        setPressed(true);
        if (event.target instanceof Element) {
          latest = { x: event.clientX, y: event.clientY, target: event.target };
          if (!frame) frame = requestAnimationFrame(update);
        }
      } else reset();
    }
    function refreshPointer() {
      resetMagnet();
      resetHeading();
      resetLight();
      if (!mouseInput || !latest) return;
      // Retain the cursor during wheel/rail scrolling; re-hit-test the stationary
      // pointer as content moves beneath it, using the same coalesced RAF.
      const target = document.elementFromPoint(latest.x, latest.y);
      if (!target || !root!.contains(target)) { reset(); return; }
      latest = { ...latest, target };
      if (!frame) frame = requestAnimationFrame(update);
    }
    const up = () => setPressed(false);
    function click(event: MouseEvent) {
      if (!mouseInput || !event.detail || !(event.target instanceof Element)) return;
      const control = event.target.closest<HTMLElement>(controls);
      if (!control || control.matches(':disabled,[aria-disabled="true"]')) return;
      // Clicks can resize disclosures or filtered results; remeasure on the next frame.
      resetMagnet();
      resetHeading();
      resetLight();
      latest = { x: event.clientX, y: event.clientY, target: event.target };
      if (!frame) frame = requestAnimationFrame(update);
      setPulse({
        id: ++sequence,
        x: event.clientX,
        y: event.clientY,
        color: 'var(--accent-link)',
      });
    }
    root.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerleave', reset);
    root.addEventListener('pointerdown', down, { passive: true });
    root.addEventListener('click', click, { passive: true });
    root.addEventListener('dragend', reset);
    window.addEventListener('pointerup', up, { passive: true });
    window.addEventListener('keydown', reset);
    window.addEventListener('blur', reset);
    window.addEventListener('scroll', refreshPointer, { passive: true, capture: true });
    window.addEventListener('resize', refreshPointer, { passive: true });
    return () => {
      reset();
      delete root.dataset.interactions;
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', reset);
      root.removeEventListener('pointerdown', down);
      root.removeEventListener('click', click);
      root.removeEventListener('dragend', reset);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('keydown', reset);
      window.removeEventListener('blur', reset);
      window.removeEventListener('scroll', refreshPointer, true);
      window.removeEventListener('resize', refreshPointer);
    };
  }, [enabled, rootRef, x, y, visible, dotX, dotY, ringX, ringY, tailX, tailY]);

  if (!enabled) return null;
  return (
    <div className="interaction-overlays" aria-hidden="true">
      <motion.div
        className="interaction-cursor-dot"
        style={{ x: dotX, y: dotY, opacity: context.kind === 'text' ? 0 : visible }}
      />
      <motion.div
        className={`interaction-cursor-ring ${context.label ? 'has-label' : ''} ${context.kind === 'text' ? 'is-text' : ''}`}
        style={{ x: ringX, y: ringY, opacity: visible }}
      >
        <motion.span
          animate={{
            width: context.kind === 'text' ? 2 : context.label ? 64 : 26,
            height: context.kind === 'text' ? 20 : context.label ? 64 : 26,
            scale: pressed ? 0.85 : 1,
          }}
          transition={{ duration: 0.18 }}
        >
          <span>{context.label}</span>
        </motion.span>
      </motion.div>
      <motion.div
        className="interaction-cursor-tail"
        style={{ x: tailX, y: tailY, opacity: context.kind === 'text' ? 0 : tailOpacity }}
      />
      {pulse && (
        <motion.span
          key={pulse.id}
          className="interaction-click"
          style={{ left: pulse.x, top: pulse.y, borderColor: pulse.color }}
          initial={{ opacity: 0.45, scale: 0.35 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 0.38 }}
          onAnimationComplete={() =>
            setPulse((current) => (current?.id === pulse.id ? null : current))
          }
        />
      )}
    </div>
  );
}

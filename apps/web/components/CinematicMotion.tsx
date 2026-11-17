'use client';

import { useEffect, type RefObject } from 'react';
import { animate, stagger, type AnimationSequence } from 'motion';
import { cinema, revealStep } from '../lib/cinematic';
import { RevealCycle, revealSide, type RevealSide } from '../lib/revealCycle';

type Playback = ReturnType<typeof animate>;
const selector = '[data-reveal]';

// One persistent observer drives both directions. No scroll listener/controller.
export default function CinematicMotion({ rootRef }: {
  rootRef: RefObject<HTMLDivElement | null>;
}) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const registered = new Map<HTMLElement, RevealCycle>();
    const running = new Map<HTMLElement, Playback>();
    const completionFrames = new Set<number>();
    let active = false;
    let refreshFrame = 0;
    let observer: IntersectionObserver | undefined;
    let mutations: MutationObserver | undefined;

    const viewport = () => ({ top: 0, left: 0, bottom: innerHeight, right: innerWidth });
    const children = (element: HTMLElement) =>
      Array.from(element.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
    const units = (element: HTMLElement) =>
      element.matches('[data-reveal="words"], [data-reveal="characters"]')
        ? Array.from(element.querySelectorAll<HTMLElement>('.reveal-unit'))
        : children(element);
    const focused = (element: HTMLElement) => element.contains(document.activeElement);

    function clearStyles(element: HTMLElement) {
      for (const unit of [element, ...units(element)])
        for (const property of ['opacity', 'transform', 'clip-path', 'will-change'])
          unit.style.removeProperty(property);
    }
    function cancel(element: HTMLElement) {
      const playback = running.get(element);
      running.delete(element); // Invalidate its completion before cancelling.
      playback?.cancel();
      clearStyles(element);
    }
    function show(element: HTMLElement) {
      cancel(element);
      registered.get(element)?.show();
      element.dataset.revealState = 'revealed';
    }
    function leave(element: HTMLElement, side: RevealSide) {
      cancel(element);
      const cycle = registered.get(element);
      if (!cycle) return;
      cycle.leave(side, focused(element));
      element.dataset.revealState = cycle.phase;
    }

    function complete(element: HTMLElement, playback: Playback, revision: number) {
      const cycle = registered.get(element);
      if (!active || running.get(element) !== playback || !cycle?.complete(revision)) return;
      cancel(element);
      element.dataset.revealState = cycle.phase;
      // Clear again after Motion's last style flush. Never clear a newer run.
      const frame = requestAnimationFrame(() => {
        completionFrames.delete(frame);
        if (registered.get(element) === cycle && !running.has(element)) clearStyles(element);
      });
      completionFrames.add(frame);
    }

    function play(element: HTMLElement) {
      const cycle = registered.get(element);
      if (!cycle || cycle.phase !== 'pending') return;
      if (reduced.matches || document.hidden || focused(element)) return show(element);
      const revision = cycle.enter()!;
      const up = cycle.side === 'above';
      const kind = element.dataset.reveal;
      const targets = units(element);
      const delay = Math.max(0, Math.min(0.5, Number(element.dataset.revealDelay) || 0));
      element.dataset.revealState = cycle.phase;
      element.dataset.revealDirection = up ? 'up' : 'down';
      let playback: Playback;
      try {
        if (kind === 'image' && targets.length) {
          // Observe the stationary frame; clip/fade its existing image/drawing.
          playback = animate(targets, {
            clipPath: [up ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)'],
            opacity: [0.35, 1],
          }, { duration: cinema.image, delay, ease: cinema.ease });
        } else if (kind === 'words' || kind === 'characters') {
          if (!targets.length) return show(element);
          playback = animate(targets, {
            opacity: [0, 1],
            transform: [`translateY(${up ? '-' : ''}0.65em)`, 'translateY(0em)'],
          }, {
            duration: kind === 'characters' ? cinema.character : cinema.word,
            delay: stagger(revealStep(targets.length, kind === 'characters'), { startDelay: delay }),
            ease: cinema.ease,
          });
        } else if (kind === 'accent') {
          playback = animate(targets.length ? targets : element, { opacity: [0, 1], transform: ['scale(0.94)', 'scale(1)'] },
            { duration: cinema.enter, delay, ease: cinema.ease });
        } else {
          const containsImage = element.matches('img,picture,video') || !!element.querySelector('img,picture,video');
          // Translate contents, never the observed frame: its intersection stays
          // stable at viewport edges, including rapid direction changes.
          const sequence: AnimationSequence = [
            [element, { opacity: [0, 1] }, { duration: cinema.enter, delay, ease: cinema.ease }],
          ];
          if (!containsImage && targets.length) sequence.push([targets, {
              transform: [`translateY(${up ? -16 : 16}px)`, 'translateY(0px)'],
            }, { at: delay, duration: cinema.enter, ease: cinema.ease }]);
          playback = animate(sequence);
        }
        running.set(element, playback);
        void playback.then(() => complete(element, playback, revision), () => {
          if (running.get(element) === playback) show(element);
        });
      } catch {
        show(element); // Animation support must never gate content.
      }
    }

    function register(element: HTMLElement, skipVisible = false) {
      if (registered.has(element)) return;
      const side = revealSide(element.getBoundingClientRect(), viewport());
      registered.set(element, new RevealCycle(side));
      element.dataset.revealState = 'pending';
      if (skipVisible && side === 'inside') show(element);
      observer?.observe(element); // Includes targets above a restored scroll position.
    }
    function unregister(element: HTMLElement) {
      observer?.unobserve(element);
      cancel(element);
      registered.delete(element);
      element.removeAttribute('data-reveal-state');
      element.removeAttribute('data-reveal-direction');
    }

    // IO tracks layout natively; force fresh observations after load, fonts,
    // navigation/restoration, resize or content changes. Coalesce them into one RAF.
    function refresh() {
      if (!active || refreshFrame) return;
      refreshFrame = requestAnimationFrame(() => {
        refreshFrame = 0;
        if (!active) return;
        for (const element of registered.keys()) {
          observer?.unobserve(element);
          observer?.observe(element);
        }
      });
    }

    function stop() {
      active = false;
      observer?.disconnect();
      mutations?.disconnect();
      cancelAnimationFrame(refreshFrame);
      refreshFrame = 0;
      for (const frame of completionFrames) cancelAnimationFrame(frame);
      completionFrames.clear();
      for (const element of registered.keys()) unregister(element);
      root!.removeAttribute('data-cinema');
    }
    function start(skipVisible = document.documentElement.dataset.cinemaBoot === 'expired') {
      if (active || reduced.matches) return;
      active = true;
      const nextObserver = new IntersectionObserver((entries) => {
        if (!active || observer !== nextObserver) return;
        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          const cycle = registered.get(element);
          if (!cycle) continue;
          if (entry.isIntersecting) play(element);
          else {
            const side = revealSide(entry.boundingClientRect, entry.rootBounds || viewport());
            leave(element, side);
          }
        }
      }, { rootMargin: '0px', threshold: 0 });
      observer = nextObserver;
      root!.dataset.cinema = 'on';
      root!.querySelectorAll<HTMLElement>(selector).forEach((element) => register(element, skipVisible));
      const nextMutations = new MutationObserver((records) => {
        if (!active || mutations !== nextMutations) return;
        let changed = false;
        for (const record of records) {
          for (const removed of record.removedNodes) {
            if (!(removed instanceof HTMLElement) || root!.contains(removed)) continue;
            changed = true;
            for (const element of [...registered.keys()])
              if (removed === element || removed.contains(element)) unregister(element);
          }
          for (const added of record.addedNodes) {
            if (!(added instanceof HTMLElement)) continue;
            changed = true;
            if (added.matches(selector)) register(added);
            added.querySelectorAll<HTMLElement>(selector).forEach((element) => register(element));
          }
        }
        if (changed) refresh();
      });
      mutations = nextMutations;
      mutations.observe(root!.querySelector('main') || root!, { childList: true, subtree: true });
      refresh();
    }

    function focus(event: FocusEvent) {
      if (!(event.target instanceof HTMLElement)) return;
      for (const element of registered.keys()) if (element.contains(event.target)) show(element);
    }
    function visibility() {
      if (document.hidden) for (const element of [...running.keys()]) show(element);
      else refresh();
    }
    function preference() { stop(); start(true); }
    function restore() { if (!active) start(true); else refresh(); }

    start();
    reduced.addEventListener('change', preference);
    root.addEventListener('focusin', focus);
    root.addEventListener('focusout', refresh);
    root.addEventListener('load', refresh, true);
    root.addEventListener('error', refresh, true);
    root.addEventListener('toggle', refresh, true);
    document.addEventListener('visibilitychange', visibility);
    for (const event of ['load', 'resize', 'hashchange', 'popstate']) window.addEventListener(event, refresh);
    window.addEventListener('pageshow', restore);
    window.addEventListener('pagehide', stop);
    void document.fonts?.ready.then(refresh);
    return () => {
      stop();
      reduced.removeEventListener('change', preference);
      root.removeEventListener('focusin', focus);
      root.removeEventListener('focusout', refresh);
      root.removeEventListener('load', refresh, true);
      root.removeEventListener('error', refresh, true);
      root.removeEventListener('toggle', refresh, true);
      document.removeEventListener('visibilitychange', visibility);
      for (const event of ['load', 'resize', 'hashchange', 'popstate']) window.removeEventListener(event, refresh);
      window.removeEventListener('pageshow', restore);
      window.removeEventListener('pagehide', stop);
    };
  }, [rootRef]);
  return null;
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import {
  AmbientSound,
  ambientPreferenceKey,
  formatIndiaTime,
  pauseAmbientEvent,
} from '../lib/experience';

function IndiaClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 1000);
    document.addEventListener('visibilitychange', update);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return (
    <span className="india-clock" aria-live="off">
      <span className="utility-dot" aria-hidden="true" />
      <span className="sr-only">Current time in India: </span>
      <time dateTime={now?.toISOString()}>{now ? formatIndiaTime(now) : '--:--:--'}</time>
      <span className="utility-muted">IST</span>
    </span>
  );
}

export default function ExperienceControls() {
  const [on, setOn] = useState(false);
  const [starting, setStarting] = useState(false);
  const [preferred, setPreferred] = useState(false);
  const [message, setMessage] = useState('');
  const session = useRef<AmbientSound | null>(null);
  const persist = (enabled: boolean) => {
    setPreferred(enabled);
    try {
      localStorage.setItem(ambientPreferenceKey, enabled ? 'on' : 'off');
    } catch {}
  };
  useEffect(() => {
    try {
      setPreferred(localStorage.getItem(ambientPreferenceKey) === 'on');
    } catch {}
    const pause = () => {
      session.current?.stop();
      session.current = null;
      setOn(false);
      setStarting(false);
    };
    const visibility = () => {
      if (document.hidden) pause();
    };
    window.addEventListener(pauseAmbientEvent, pause);
    window.addEventListener('pagehide', pause);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      pause();
      window.removeEventListener(pauseAmbientEvent, pause);
      window.removeEventListener('pagehide', pause);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  async function toggle() {
    setMessage('');
    if (session.current) {
      session.current.stop();
      session.current = null;
      setOn(false);
      setStarting(false);
      persist(false);
      return;
    }
    const sound = new AmbientSound(undefined, () => {
      if (session.current !== sound) return;
      session.current = null;
      setOn(false);
      setStarting(false);
      setMessage('Ambient sound paused. Click to resume.');
    });
    session.current = sound;
    setStarting(true);
    try {
      const playing = await sound.start();
      if (session.current !== sound) return;
      setStarting(false);
      setOn(playing);
      if (playing) persist(true);
    } catch {
      if (session.current !== sound) return;
      session.current = null;
      setStarting(false);
      setOn(false);
      setMessage('Sound could not start in this browser. Please try again.');
    }
  }
  return (
    <div className="site-utilities page-width mono">
      <IndiaClock />
      <button
        type="button"
        className="sound-toggle"
        data-magnetic="3"
        onClick={toggle}
        aria-pressed={on}
        aria-label={
          starting ? 'Cancel starting ambient sound' : `${on ? 'Disable' : 'Enable'} ambient sound`
        }
        title={
          preferred && !on
            ? 'Sound preference saved. Click to resume; audio never starts automatically.'
            : 'Original ambient tones · stops when you leave this tab'
        }
      >
        {on ? (
          <Volume2 size={14} aria-hidden="true" data-magnetic-content="" />
        ) : (
          <VolumeX size={14} aria-hidden="true" data-magnetic-content="" />
        )}
        SOUND <span>{starting ? 'STARTING' : on ? 'ON' : 'OFF'}</span>
      </button>
      <span className="sr-only" role="status">
        {message}
      </span>
    </div>
  );
}

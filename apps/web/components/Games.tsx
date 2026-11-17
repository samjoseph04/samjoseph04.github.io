'use client';

import React, { useId, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, ArrowRight, Search, X } from 'lucide-react';
import { gameCategories } from '@portfolio/content/categories';
import { gameHref, searchGames, type Game } from '../lib/games';
import { pauseAmbientEvent } from '../lib/experience';
import GameRail from './GameRail';
import { MagneticContent, SectionLight } from './InteractionContent';
import CinematicText from './CinematicText';
import { cinema } from '../lib/cinematic';

export default function Games({ games }: { games: Game[] }) {
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const reduce = useReducedMotion();
  const filterId = useId();
  const searched = searchGames(games, query);
  const visible = searched.filter((game) => filter === 'All' || game.category === filter);
  const reset = () => {
    setQuery('');
    setFilter('All');
  };
  return (
    <section
      id="games"
      className="games-section section-shell section-surface surface-dark"
      data-interactive-light=""
    >
      <SectionLight />
      <div className="section-heading">
        <h2>
          <CinematicText text="Serious about play." />
        </h2>
      </div>
      <p className="arcade-intro">
        <CinematicText
          text="Small experiments. Instant play. A collection of browser games exploring logic, timing, and interaction."
          delay={0.08}
        />
      </p>
      <div className="arcade-tools" data-reveal="enter" data-reveal-delay="0.12">
        <div className="arcade-filters" role="group" aria-label="Filter games by category">
          {['All', ...gameCategories].map((category) => (
            <button
              type="button"
              key={category}
              data-magnetic="3"
              aria-pressed={filter === category}
              onClick={() => setFilter(category)}
            >
              {filter === category && (
                <motion.span
                  className="arcade-filter-active"
                  layoutId={`category-${filterId}`}
                  transition={{ duration: reduce ? 0 : 0.3, ease: cinema.ease }}
                />
              )}
              <span data-magnetic-content="">
                {category}{' '}
                <span className="arcade-filter-count">
                  {category === 'All'
                    ? searched.length
                    : searched.filter((game) => game.category === category).length}
                </span>
              </span>
            </button>
          ))}
        </div>
        <div className="arcade-search">
          <Search size={16} aria-hidden="true" />
          <label className="sr-only" htmlFor={`${filterId}-search`}>
            Search games
          </label>
          <input
            id={`${filterId}-search`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search games"
          />
          {query && (
            <button
              type="button"
              data-magnetic="3"
              onClick={() => setQuery('')}
              aria-label="Clear game search"
            >
              <MagneticContent>
                <X size={16} aria-hidden="true" />
              </MagneticContent>
            </button>
          )}
        </div>
      </div>
      <GameRail resetKey={`${filter}:${query}`} count={visible.length} total={games.length}>
        {visible.map((game, index) => (
          <a
            key={game.id}
            className="arcade-card"
            data-category={game.category}
            href={gameHref(game, process.env.NODE_ENV === 'development')}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="PLAY"
            data-magnetic="2"
            aria-label={`Play ${game.name} (opens in a new tab)`}
            onClick={() => window.dispatchEvent(new Event(pauseAmbientEvent))}
            data-reveal="enter"
            data-reveal-delay={Math.min(index, 3) * 0.055}
          >
            <div className="arcade-card-content">
              <h3>{game.name}</h3>
              <p>{game.description}</p>
              <div className="arcade-card-footer">
                <span className="arcade-category">{game.category}</span>
                <span className="arcade-play mono" data-magnetic-content="">
                  PLAY <ArrowUpRight size={16} aria-hidden="true" />
                </span>
              </div>
            </div>
          </a>
        ))}
      </GameRail>
      {!visible.length && (
        <div className="arcade-empty">
          <h3>No games found.</h3>
          <p>Try another name, tag or category.</p>
          <button type="button" className="text-link" data-magnetic="3" onClick={reset}>
            <MagneticContent>
              Reset filters <ArrowRight size={16} />
            </MagneticContent>
          </button>
        </div>
      )}
    </section>
  );
}

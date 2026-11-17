import React from 'react';
import { splitWords, splitCharacters } from '../lib/cinematic';

// Keep a single, unsplit accessible version; visual tokens preserve every space.
// All tokens are visible in the static export, before JS, and in admin previews.
export default function CinematicText({
  text,
  characters = false,
  delay = 0,
}: {
  text: string;
  characters?: boolean;
  delay?: number;
}) {
  return (
    <span
      className="cinema-text"
      data-reveal={characters ? 'characters' : 'words'}
      data-reveal-delay={delay || undefined}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="cinema-visual">
        {splitWords(text).map((word, index) =>
          /^\s+$/u.test(word) ? (
            word
          ) : characters ? (
            <span className="cinema-word" key={index}>
              {splitCharacters(word).map((character, part) => (
                <span className="reveal-unit" key={part}>{character}</span>
              ))}
            </span>
          ) : (
            <span className="cinema-word" key={index}>
              <span className="reveal-unit">{word}</span>
            </span>
          ),
        )}
      </span>
    </span>
  );
}

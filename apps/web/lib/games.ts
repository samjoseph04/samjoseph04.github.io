import type { Portfolio } from '@portfolio/content';
export type Game = Portfolio['games'][number];

export function gameRailState(scrollLeft: number, clientWidth: number, scrollWidth: number) {
  const maximum = Math.max(0, scrollWidth - clientWidth);
  const left = Math.max(0, Math.min(scrollLeft, maximum));
  return {
    previous: left > 1,
    next: maximum - left > 1,
    progress: maximum > 0 ? Math.round((left / maximum) * 100) : 0,
    fraction: scrollWidth > 0 ? Math.min(1, clientWidth / scrollWidth) : 1,
  };
}
export function searchGames(games: Game[], query: string) {
  const term = query.trim().toLocaleLowerCase();
  return games.filter((game) =>
    `${game.name} ${game.description} ${game.category} ${game.tags.join(' ')}`
      .toLocaleLowerCase()
      .includes(term),
  );
}
export function gameHref(game: Game, development = false) {
  return development && game.destination.startsWith('/')
    ? `${game.destination}index.html`
    : game.destination;
}

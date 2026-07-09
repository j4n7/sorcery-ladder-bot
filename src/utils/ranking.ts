export type RankingStats = {
  displayName: string;
  wins: number;
  draws: number;
  losses: number;
  matches: number;
  opponents: Set<number>;
};

export function calculateWinRate(stats: Pick<RankingStats, "wins" | "matches">): number {
  return stats.matches === 0 ? 0 : stats.wins / stats.matches;
}

export function getGamesNeeded(matches: number, minimumMatches: number): number {
  return Math.max(0, minimumMatches - matches);
}

export function compareByWinRate<T extends RankingStats>(a: T, b: T): number {
  return (
    calculateWinRate(b) - calculateWinRate(a) ||
    b.wins - a.wins ||
    b.opponents.size - a.opponents.size ||
    b.matches - a.matches ||
    a.displayName.localeCompare(b.displayName)
  );
}

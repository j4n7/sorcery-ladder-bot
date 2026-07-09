import { MatchStatus, ResultType } from "@prisma/client";
import { config } from "../config.js";
import { prisma } from "../db/prisma.js";
import { calculateWinRate, compareByWinRate, getGamesNeeded } from "../utils/ranking.js";
import { getActiveSeason } from "./seasonService.js";

export type PlayerStats = {
  playerId: number;
  displayName: string;
  countryFlag: string | null;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  matches: number;
  opponents: Set<number>;
};

export type RankedPlayerStats = PlayerStats & {
  winRate: number;
  qualified: boolean;
  gamesNeeded: number;
};

export type CompetitiveLeaderboard = {
  qualified: RankedPlayerStats[];
  notQualified: RankedPlayerStats[];
};

function ensureStats(
  map: Map<number, PlayerStats>,
  playerId: number,
  displayName: string,
  countryFlag: string | null
): PlayerStats {
  let stats = map.get(playerId);
  if (!stats) {
    stats = {
      playerId,
      displayName,
      countryFlag,
      points: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      matches: 0,
      opponents: new Set<number>()
    };
    map.set(playerId, stats);
  }
  return stats;
}

function rankPlayer(stats: PlayerStats, minimumMatches: number): RankedPlayerStats {
  const gamesNeeded = getGamesNeeded(stats.matches, minimumMatches);
  return {
    ...stats,
    winRate: calculateWinRate(stats),
    qualified: gamesNeeded === 0,
    gamesNeeded
  };
}

export async function getCompetitiveLeaderboard(): Promise<CompetitiveLeaderboard> {
  const season = await getActiveSeason();
  const matches = await prisma.match.findMany({
    where: { seasonId: season.id, status: MatchStatus.CONFIRMED, competitive: true },
    include: { player1: true, player2: true }
  });

  const statsMap = new Map<number, PlayerStats>();

  for (const match of matches) {
    const player1 = ensureStats(statsMap, match.player1Id, match.player1.displayName, match.player1.countryFlag);
    const player2 = ensureStats(statsMap, match.player2Id, match.player2.displayName, match.player2.countryFlag);

    player1.matches += 1;
    player2.matches += 1;
    player1.opponents.add(match.player2Id);
    player2.opponents.add(match.player1Id);

    if (match.resultType === ResultType.PLAYER_1_WIN) {
      player1.points += 3;
      player1.wins += 1;
      player2.points += 1;
      player2.losses += 1;
    } else if (match.resultType === ResultType.PLAYER_2_WIN) {
      player2.points += 3;
      player2.wins += 1;
      player1.points += 1;
      player1.losses += 1;
    } else {
      player1.points += 2;
      player2.points += 2;
      player1.draws += 1;
      player2.draws += 1;
    }
  }

  const entries = [...statsMap.values()]
    .map((stats) => rankPlayer(stats, config.leaderboardMinMatches))
    .sort(compareByWinRate);

  return {
    qualified: entries.filter((entry) => entry.qualified),
    notQualified: entries.filter((entry) => !entry.qualified)
  };
}

import { MatchStatus, ResultType } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { getActiveSeason } from "./seasonService.js";

export type PlayerStats = {
  playerId: number;
  displayName: string;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  matches: number;
  opponents: Set<number>;
};

function ensureStats(map: Map<number, PlayerStats>, playerId: number, displayName: string): PlayerStats {
  let stats = map.get(playerId);
  if (!stats) {
    stats = { playerId, displayName, points: 0, wins: 0, losses: 0, draws: 0, matches: 0, opponents: new Set<number>() };
    map.set(playerId, stats);
  }
  return stats;
}

export async function getCompetitiveLeaderboard() {
  const season = await getActiveSeason();
  const matches = await prisma.match.findMany({
    where: { seasonId: season.id, status: MatchStatus.CONFIRMED, competitive: true },
    include: { player1: true, player2: true }
  });

  const statsMap = new Map<number, PlayerStats>();

  for (const match of matches) {
    const player1 = ensureStats(statsMap, match.player1Id, match.player1.displayName);
    const player2 = ensureStats(statsMap, match.player2Id, match.player2.displayName);
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

  return [...statsMap.values()].sort((a, b) => {
    const aWinrate = a.matches === 0 ? 0 : a.wins / a.matches;
    const bWinrate = b.matches === 0 ? 0 : b.wins / b.matches;
    return b.points - a.points || bWinrate - aWinrate || b.wins - a.wins || b.opponents.size - a.opponents.size || b.matches - a.matches;
  });
}

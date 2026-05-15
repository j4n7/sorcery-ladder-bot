import { MatchStatus, ResultType } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { config } from "../config.js";
import { getActiveSeason } from "./seasonService.js";

export async function getAvatarLeaderboard(avatar: string) {
  const season = await getActiveSeason();
  const matches = await prisma.match.findMany({
    where: {
      seasonId: season.id,
      status: MatchStatus.CONFIRMED,
      competitive: true,
      OR: [{ player1Avatar: avatar }, { player2Avatar: avatar }]
    },
    include: { player1: true, player2: true }
  });

  const map = new Map<number, { displayName: string; countryFlag: string | null; points: number; wins: number; losses: number; draws: number; matches: number; opponents: Set<number> }>();

  function getEntry(playerId: number, displayName: string, countryFlag: string | null) {
    const entry = map.get(playerId) ?? { displayName, countryFlag, points: 0, wins: 0, losses: 0, draws: 0, matches: 0, opponents: new Set<number>() };
    map.set(playerId, entry);
    return entry;
  }

  for (const match of matches) {
    const sides = [
      { playerId: match.player1Id, opponentId: match.player2Id, displayName: match.player1.displayName, countryFlag: match.player1.countryFlag, avatar: match.player1Avatar, won: match.resultType === ResultType.PLAYER_1_WIN, lost: match.resultType === ResultType.PLAYER_2_WIN },
      { playerId: match.player2Id, opponentId: match.player1Id, displayName: match.player2.displayName, countryFlag: match.player2.countryFlag, avatar: match.player2Avatar, won: match.resultType === ResultType.PLAYER_2_WIN, lost: match.resultType === ResultType.PLAYER_1_WIN }
    ];

    for (const side of sides) {
      if (side.avatar !== avatar) continue;
      const entry = getEntry(side.playerId, side.displayName, side.countryFlag);
      entry.matches += 1;
      entry.opponents.add(side.opponentId);
      if (match.resultType === ResultType.DRAW) {
        entry.points += 2;
        entry.draws += 1;
      } else if (side.won) {
        entry.points += 3;
        entry.wins += 1;
      } else if (side.lost) {
        entry.points += 1;
        entry.losses += 1;
      }
    }
  }

  const entries = [...map.values()].sort((a, b) => {
    const aWinrate = a.matches === 0 ? 0 : a.wins / a.matches;
    const bWinrate = b.matches === 0 ? 0 : b.wins / b.matches;
    return b.points - a.points || bWinrate - aWinrate || b.wins - a.wins || b.opponents.size - a.opponents.size || b.matches - a.matches;
  });

  return {
    qualified: entries.filter((entry) => entry.matches >= config.avatarMinMatches),
    notQualified: entries.filter((entry) => entry.matches < config.avatarMinMatches)
  };
}

import { MatchStatus, ResultType } from "@prisma/client";
import { config } from "../config.js";
import { prisma } from "../db/prisma.js";
import { calculateWinRate, getGamesNeeded } from "../utils/ranking.js";
import { getActiveSeason } from "./seasonService.js";

type AvatarProfileStats = {
  avatar: string;
  totalMatches: number;
  competitiveMatches: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  winRate: number;
};

export async function getProfile(discordId: string) {
  const season = await getActiveSeason();
  const player = await prisma.player.findUnique({ where: { discordId } });
  if (!player) return null;

  const matches = await prisma.match.findMany({
    where: {
      seasonId: season.id,
      status: MatchStatus.CONFIRMED,
      OR: [{ player1Id: player.id }, { player2Id: player.id }]
    }
  });

  const avatarMap = new Map<string, Omit<AvatarProfileStats, "avatar" | "winRate">>();
  let competitiveMatches = 0;
  const totalMatches = matches.length;
  let points = 0;
  let wins = 0;
  let losses = 0;
  let draws = 0;

  for (const match of matches) {
    const isPlayer1 = match.player1Id === player.id;
    const avatar = isPlayer1 ? match.player1Avatar : match.player2Avatar;
    const entry = avatarMap.get(avatar) ?? {
      totalMatches: 0,
      competitiveMatches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0
    };
    entry.totalMatches += 1;

    if (match.competitive) {
      competitiveMatches += 1;
      entry.competitiveMatches += 1;

      if (match.resultType === ResultType.DRAW) {
        points += 2;
        draws += 1;
        entry.points += 2;
        entry.draws += 1;
      } else {
        const won =
          (isPlayer1 && match.resultType === ResultType.PLAYER_1_WIN) ||
          (!isPlayer1 && match.resultType === ResultType.PLAYER_2_WIN);

        if (won) {
          points += 3;
          wins += 1;
          entry.points += 3;
          entry.wins += 1;
        } else {
          points += 1;
          losses += 1;
          entry.points += 1;
          entry.losses += 1;
        }
      }
    }

    avatarMap.set(avatar, entry);
  }

  const avatarStats: AvatarProfileStats[] = [...avatarMap.entries()]
    .map(([avatar, stats]) => ({
      avatar,
      ...stats,
      winRate: calculateWinRate({ wins: stats.wins, matches: stats.competitiveMatches })
    }))
    .sort((a, b) => b.totalMatches - a.totalMatches || b.competitiveMatches - a.competitiveMatches || b.winRate - a.winRate);

  const mainAvatar = avatarStats[0]?.avatar ?? "No matches yet";
  const winRate = calculateWinRate({ wins, matches: competitiveMatches });
  const gamesNeeded = getGamesNeeded(competitiveMatches, config.leaderboardMinMatches);

  return {
    player,
    points,
    wins,
    losses,
    draws,
    winRate,
    competitiveMatches,
    totalMatches,
    qualified: gamesNeeded === 0,
    gamesNeeded,
    mainAvatar,
    avatarStats
  };
}

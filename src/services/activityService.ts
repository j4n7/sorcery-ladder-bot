import { MatchStatus } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { getActiveSeason } from "./seasonService.js";

export async function getActivityLeaderboard() {
  const season = await getActiveSeason();
  const matches = await prisma.match.findMany({
    where: { seasonId: season.id, status: MatchStatus.CONFIRMED },
    include: { player1: true, player2: true }
  });

  const map = new Map<number, { playerId: number; displayName: string; matches: number }>();

  for (const match of matches) {
    for (const player of [match.player1, match.player2]) {
      const current = map.get(player.id) ?? { playerId: player.id, displayName: player.displayName, matches: 0 };
      current.matches += 1;
      map.set(player.id, current);
    }
  }

  return [...map.values()].sort((a, b) => b.matches - a.matches || a.displayName.localeCompare(b.displayName));
}

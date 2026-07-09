import { MatchStatus, ResultType } from "@prisma/client";
import { config } from "../config.js";
import { prisma } from "../db/prisma.js";
import { AVATARS } from "../utils/avatarList.js";
import { calculateWinRate, compareByWinRate, getGamesNeeded } from "../utils/ranking.js";
import { getActiveSeason } from "./seasonService.js";

export type AvatarPilotStats = {
  playerId: number;
  displayName: string;
  countryFlag: string | null;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  matches: number;
  opponents: Set<number>;
  winRate: number;
  gamesNeeded: number;
  meetsMatchRequirement: boolean;
  meetsWinRateRequirement: boolean;
  qualified: boolean;
};

export type AvatarLeaderboard = {
  avatar: string;
  qualified: AvatarPilotStats[];
  notQualified: AvatarPilotStats[];
};

type AvatarPilotAccumulator = Omit<
  AvatarPilotStats,
  "winRate" | "gamesNeeded" | "meetsMatchRequirement" | "meetsWinRateRequirement" | "qualified"
>;

type MatchWithPlayers = Awaited<ReturnType<typeof findCompetitiveAvatarMatches>>[number];

async function findCompetitiveAvatarMatches(avatar?: string) {
  const season = await getActiveSeason();
  return prisma.match.findMany({
    where: {
      seasonId: season.id,
      status: MatchStatus.CONFIRMED,
      competitive: true,
      ...(avatar ? { OR: [{ player1Avatar: avatar }, { player2Avatar: avatar }] } : {})
    },
    include: { player1: true, player2: true }
  });
}

function ensurePilot(
  map: Map<number, AvatarPilotAccumulator>,
  playerId: number,
  displayName: string,
  countryFlag: string | null
): AvatarPilotAccumulator {
  const existing = map.get(playerId);
  if (existing) return existing;

  const created: AvatarPilotAccumulator = {
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
  map.set(playerId, created);
  return created;
}

function addMatchToAvatarMaps(
  avatarMaps: Map<string, Map<number, AvatarPilotAccumulator>>,
  match: MatchWithPlayers
): void {
  const sides = [
    {
      playerId: match.player1Id,
      opponentId: match.player2Id,
      displayName: match.player1.displayName,
      countryFlag: match.player1.countryFlag,
      avatar: match.player1Avatar,
      won: match.resultType === ResultType.PLAYER_1_WIN,
      lost: match.resultType === ResultType.PLAYER_2_WIN
    },
    {
      playerId: match.player2Id,
      opponentId: match.player1Id,
      displayName: match.player2.displayName,
      countryFlag: match.player2.countryFlag,
      avatar: match.player2Avatar,
      won: match.resultType === ResultType.PLAYER_2_WIN,
      lost: match.resultType === ResultType.PLAYER_1_WIN
    }
  ];

  for (const side of sides) {
    const pilotMap = avatarMaps.get(side.avatar) ?? new Map<number, AvatarPilotAccumulator>();
    avatarMaps.set(side.avatar, pilotMap);

    const entry = ensurePilot(pilotMap, side.playerId, side.displayName, side.countryFlag);
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

function finalizePilot(entry: AvatarPilotAccumulator): AvatarPilotStats {
  const winRate = calculateWinRate(entry);
  const gamesNeeded = getGamesNeeded(entry.matches, config.avatarMinMatches);
  const meetsMatchRequirement = gamesNeeded === 0;
  const meetsWinRateRequirement = winRate >= config.avatarMinWinRate;

  return {
    ...entry,
    winRate,
    gamesNeeded,
    meetsMatchRequirement,
    meetsWinRateRequirement,
    qualified: meetsMatchRequirement && meetsWinRateRequirement
  };
}

function buildAvatarLeaderboard(
  avatar: string,
  pilotMap: Map<number, AvatarPilotAccumulator> | undefined
): AvatarLeaderboard {
  const entries = [...(pilotMap?.values() ?? [])]
    .map(finalizePilot)
    .sort(compareByWinRate);

  return {
    avatar,
    qualified: entries.filter((entry) => entry.qualified),
    notQualified: entries.filter((entry) => !entry.qualified)
  };
}

function aggregateAvatarLeaderboards(matches: MatchWithPlayers[]): AvatarLeaderboard[] {
  const avatarMaps = new Map<string, Map<number, AvatarPilotAccumulator>>();
  for (const match of matches) addMatchToAvatarMaps(avatarMaps, match);

  return AVATARS
    .filter((avatar) => avatarMaps.has(avatar))
    .map((avatar) => buildAvatarLeaderboard(avatar, avatarMaps.get(avatar)));
}

export async function getAllAvatarLeaderboards(): Promise<AvatarLeaderboard[]> {
  const matches = await findCompetitiveAvatarMatches();
  return aggregateAvatarLeaderboards(matches);
}

export async function getAvatarLeaderboard(avatar: string): Promise<AvatarLeaderboard> {
  const matches = await findCompetitiveAvatarMatches(avatar);
  const result = aggregateAvatarLeaderboards(matches).find((leaderboard) => leaderboard.avatar === avatar);
  return result ?? { avatar, qualified: [], notQualified: [] };
}

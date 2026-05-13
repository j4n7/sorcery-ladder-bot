import { MatchStatus, NonCompetitiveReason, ResultType } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { config } from "../config.js";
import { getMadridWeekRange } from "../utils/dates.js";
import { upsertPlayer } from "./playerService.js";
import { getActiveSeason } from "./seasonService.js";

export type ReportMatchInput = {
  reporterDiscordId: string;
  reporterName: string;
  opponentDiscordId: string;
  opponentName: string;
  reporterAvatar: string;
  opponentAvatar: string;
  reporterResult: "win" | "loss" | "draw";
};

export async function reportMatch(input: ReportMatchInput) {
  const season = await getActiveSeason();
  const reporter = await upsertPlayer(input.reporterDiscordId, input.reporterName);
  const opponent = await upsertPlayer(input.opponentDiscordId, input.opponentName);

  const resultType = input.reporterResult === "win"
    ? ResultType.PLAYER_1_WIN
    : input.reporterResult === "loss"
      ? ResultType.PLAYER_2_WIN
      : ResultType.DRAW;

  return prisma.match.create({
    data: {
      seasonId: season.id,
      player1Id: reporter.id,
      player2Id: opponent.id,
      player1Avatar: input.reporterAvatar,
      player2Avatar: input.opponentAvatar,
      reportedById: reporter.id,
      resultType,
      status: MatchStatus.PENDING
    },
    include: { player1: true, player2: true }
  });
}

async function getWeeklyCompetitiveCounts(player1Id: number, player2Id: number, confirmedAt: Date) {
  const { start, end } = getMadridWeekRange(confirmedAt);

  const player1WeeklyCount = await prisma.match.count({
    where: {
      status: MatchStatus.CONFIRMED,
      competitive: true,
      confirmedAt: { gte: start, lt: end },
      OR: [{ player1Id }, { player2Id: player1Id }]
    }
  });

  const player2WeeklyCount = await prisma.match.count({
    where: {
      status: MatchStatus.CONFIRMED,
      competitive: true,
      confirmedAt: { gte: start, lt: end },
      OR: [{ player1Id: player2Id }, { player2Id }]
    }
  });

  const opponentWeeklyCount = await prisma.match.count({
    where: {
      status: MatchStatus.CONFIRMED,
      competitive: true,
      confirmedAt: { gte: start, lt: end },
      OR: [
        { player1Id, player2Id },
        { player1Id: player2Id, player2Id: player1Id }
      ]
    }
  });

  return { player1WeeklyCount, player2WeeklyCount, opponentWeeklyCount };
}

export async function confirmMatch(matchId: number, confirmerDiscordId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { player1: true, player2: true }
  });

  if (!match) throw new Error(`Match #${matchId} was not found.`);
  if (match.status !== MatchStatus.PENDING) throw new Error(`Match #${matchId} is not pending.`);
  if (match.player2.discordId !== confirmerDiscordId) {
    throw new Error(`Only ${match.player2.displayName} can confirm match #${matchId}.`);
  }

  const confirmedAt = new Date();
  const counts = await getWeeklyCompetitiveCounts(match.player1Id, match.player2Id, confirmedAt);

  let competitive = true;
  let nonCompetitiveReason: NonCompetitiveReason | null = null;

  if (counts.player1WeeklyCount >= config.weeklyMatchLimit || counts.player2WeeklyCount >= config.weeklyMatchLimit) {
    competitive = false;
    nonCompetitiveReason = NonCompetitiveReason.WEEKLY_PLAYER_LIMIT;
  } else if (counts.opponentWeeklyCount >= config.weeklyOpponentLimit) {
    competitive = false;
    nonCompetitiveReason = NonCompetitiveReason.WEEKLY_OPPONENT_LIMIT;
  }

  return prisma.match.update({
    where: { id: matchId },
    data: {
      status: MatchStatus.CONFIRMED,
      confirmedAt,
      competitive,
      nonCompetitiveReason
    },
    include: { player1: true, player2: true }
  });
}

export async function rejectMatch(matchId: number, rejecterDiscordId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { player2: true }
  });

  if (!match) throw new Error(`Match #${matchId} was not found.`);
  if (match.status !== MatchStatus.PENDING) throw new Error(`Match #${matchId} is not pending.`);
  if (match.player2.discordId !== rejecterDiscordId) {
    throw new Error(`Only ${match.player2.displayName} can reject match #${matchId}.`);
  }

  return prisma.match.update({
    where: { id: matchId },
    data: { status: MatchStatus.REJECTED, rejectedAt: new Date(), competitive: false },
    include: { player1: true, player2: true }
  });
}

export async function cancelMatch(matchId: number) {
  return prisma.match.update({
    where: { id: matchId },
    data: {
      status: MatchStatus.CANCELLED,
      cancelledAt: new Date(),
      competitive: false,
      nonCompetitiveReason: NonCompetitiveReason.CANCELLED
    }
  });
}

export async function setCompetitive(matchId: number, value: boolean) {
  return prisma.match.update({
    where: { id: matchId },
    data: {
      competitive: value,
      nonCompetitiveReason: value ? null : NonCompetitiveReason.ADMIN_OVERRIDE
    }
  });
}

export async function listMatches(limit: number) {
  return prisma.match.findMany({
    take: limit,
    orderBy: { id: "desc" },
    include: { player1: true, player2: true }
  });
}

import { Client } from "discord.js";
import { MatchStatus } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { config } from "../config.js";
import { findActiveSeason } from "./seasonService.js";
import { getCompetitiveLeaderboard, PlayerStats } from "./leaderboardService.js";
import { getActivityLeaderboard } from "./activityService.js";
import { getAvatarLeaderboard } from "./avatarService.js";
import { AVATARS } from "../utils/avatarList.js";

const LEADERBOARD_MESSAGE_ID_KEY = "leaderboardMessageId";
const MAX_COMPETITIVE_ROWS = 10;
const MAX_ACTIVITY_ROWS = 10;
const PLAYER_COLUMN_WIDTH = 16;
const AVATAR_COLUMN_WIDTH = 16;
const PILOT_COLUMN_WIDTH = 16;

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
}

function pad(value: string | number, width: number): string {
  return String(value).padEnd(width, " ");
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatRecord(stats: { wins: number; draws: number; losses: number }): string {
  return `${stats.wins}-${stats.draws}-${stats.losses}`;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: config.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatCompetitiveRows(rows: PlayerStats[]): string[] {
  if (rows.length === 0) return ["No competitive matches confirmed yet."];

  const header = `${pad("#", 3)} ${pad("Player", PLAYER_COLUMN_WIDTH)} ${pad("Pts", 5)} ${pad("W-D-L", 8)} ${pad("WR", 6)} ${pad("Games", 5)}`;
  const body = rows.slice(0, MAX_COMPETITIVE_ROWS).map((row, index) => {
    const winrate = row.matches === 0 ? 0 : row.wins / row.matches;
    return [
      pad(index + 1, 3),
      pad(truncate(row.displayName, PLAYER_COLUMN_WIDTH), PLAYER_COLUMN_WIDTH),
      pad(row.points, 5),
      pad(formatRecord(row), 8),
      pad(formatPercent(winrate), 6),
      pad(row.matches, 5)
    ].join(" ");
  });

  return [header, ...body];
}

function formatActivityRows(rows: Array<{ displayName: string; matches: number }>): string[] {
  if (rows.length === 0) return ["No confirmed matches yet."];

  const header = `${pad("#", 3)} ${pad("Player", PLAYER_COLUMN_WIDTH)} ${pad("Games", 5)}`;
  const body = rows.slice(0, MAX_ACTIVITY_ROWS).map((row, index) => {
    return [
      pad(index + 1, 3),
      pad(truncate(row.displayName, PLAYER_COLUMN_WIDTH), PLAYER_COLUMN_WIDTH),
      pad(row.matches, 5)
    ].join(" ");
  });

  return [header, ...body];
}

type AvatarLeaderRow = {
  avatar: string;
  displayName: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  matches: number;
};

function formatAvatarLeaderRows(rows: AvatarLeaderRow[]): string[] {
  if (rows.length === 0) return ["No avatar data yet."];

  const header = `${pad("Avatar", AVATAR_COLUMN_WIDTH)} ${pad("Best Pilot", PILOT_COLUMN_WIDTH)} ${pad("Pts", 5)} ${pad("W-D-L", 8)} ${pad("Games", 5)}`;
  const body = rows.map((row) => {
    return [
      pad(truncate(row.avatar, AVATAR_COLUMN_WIDTH), AVATAR_COLUMN_WIDTH),
      pad(truncate(row.displayName, PILOT_COLUMN_WIDTH), PILOT_COLUMN_WIDTH),
      pad(row.points, 5),
      pad(formatRecord(row), 8),
      pad(row.matches, 5)
    ].join(" ");
  });

  return [header, ...body];
}

async function getAvatarLeaderRows(): Promise<AvatarLeaderRow[]> {
  const rows: AvatarLeaderRow[] = [];

  for (const avatar of AVATARS) {
    const leaderboard = await getAvatarLeaderboard(avatar);
    const leader = leaderboard.qualified[0];
    if (!leader) continue;

    rows.push({
      avatar,
      displayName: leader.displayName,
      points: leader.points,
      wins: leader.wins,
      draws: leader.draws,
      losses: leader.losses,
      matches: leader.matches
    });
  }

  return rows;
}

async function getLastConfirmedMatchId(seasonId: number): Promise<number | null> {
  const match = await prisma.match.findFirst({
    where: { seasonId, status: MatchStatus.CONFIRMED },
    orderBy: { confirmedAt: "desc" },
    select: { id: true }
  });

  return match?.id ?? null;
}

export async function buildLeaderboardMessageContent(): Promise<string> {
  const season = await findActiveSeason();
  const lastUpdate = formatDateTime(new Date());

  if (!season) {
    return [
      "```text",
      `🏆 ${config.leagueName}`,
      "Season: none",
      `Last update: ${lastUpdate}`,
      "Last confirmed match: none",
      "",
      "COMPETITIVE LEADERBOARD",
      "No active season.",
      "",
      "ACTIVITY LEADERBOARD",
      "No active season.",
      "",
      "AVATAR LEADERS",
      "No active season.",
      "```"
    ].join("\n");
  }

  const [competitiveRows, activityRows, avatarRows, lastConfirmedMatchId] = await Promise.all([
    getCompetitiveLeaderboard(),
    getActivityLeaderboard(),
    getAvatarLeaderRows(),
    getLastConfirmedMatchId(season.id)
  ]);

  return [
    "```text",
    `🏆 ${config.leagueName}`,
    `Season: ${season.name}`,
    `Last update: ${lastUpdate}`,
    `Last confirmed match: ${lastConfirmedMatchId ? `#${lastConfirmedMatchId}` : "none"}`,
    "",
    "COMPETITIVE LEADERBOARD",
    ...formatCompetitiveRows(competitiveRows),
    "",
    "ACTIVITY LEADERBOARD",
    ...formatActivityRows(activityRows),
    "",
    "AVATAR LEADERS",
    ...formatAvatarLeaderRows(avatarRows),
    "```"
  ].join("\n");
}

async function getStoredLeaderboardMessageId(): Promise<string | null> {
  const setting = await prisma.botSetting.findUnique({ where: { key: LEADERBOARD_MESSAGE_ID_KEY } });
  return setting?.value ?? null;
}

async function setStoredLeaderboardMessageId(messageId: string): Promise<void> {
  await prisma.botSetting.upsert({
    where: { key: LEADERBOARD_MESSAGE_ID_KEY },
    create: { key: LEADERBOARD_MESSAGE_ID_KEY, value: messageId },
    update: { value: messageId }
  });
}

export async function refreshLeaderboardMessage(client: Client): Promise<string> {
  if (!config.leaderboardChannelId) {
    throw new Error("LEADERBOARD_CHANNEL_ID is not configured.");
  }

  const channel = await client.channels.fetch(config.leaderboardChannelId);
  if (!channel || !channel.isTextBased() || !("send" in channel)) {
    throw new Error("Configured leaderboard channel is not a text channel.");
  }

  const content = await buildLeaderboardMessageContent();
  const storedMessageId = await getStoredLeaderboardMessageId();

  if (storedMessageId && "messages" in channel) {
    try {
      const message = await channel.messages.fetch(storedMessageId);
      await message.edit(content);
      return storedMessageId;
    } catch {
      // The stored message may have been deleted. A new one will be created below.
    }
  }

  const message = await channel.send(content);
  await setStoredLeaderboardMessageId(message.id);
  return message.id;
}

export async function tryRefreshLeaderboardMessage(client: Client): Promise<void> {
  if (!config.leaderboardChannelId) return;

  try {
    await refreshLeaderboardMessage(client);
  } catch (error) {
    console.error("Failed to refresh leaderboard message:", error);
  }
}

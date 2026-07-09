import { MatchStatus } from "@prisma/client";
import { Client } from "discord.js";
import { config } from "../config.js";
import { prisma } from "../db/prisma.js";
import { formatPercent, formatRecord, truncateText } from "../utils/formatting.js";
import { getActivityLeaderboard } from "./activityService.js";
import { AvatarPilotStats, getAllAvatarLeaderboards } from "./avatarService.js";
import { getCompetitiveLeaderboard, RankedPlayerStats } from "./leaderboardService.js";
import { findActiveSeason } from "./seasonService.js";

const LEADERBOARD_MESSAGE_ID_KEY = "leaderboardMessageId";
const DISCORD_MESSAGE_LIMIT = 2000;
const PLAYER_COLUMN_WIDTH = 16;
const AVATAR_COLUMN_WIDTH = 16;
const PILOT_COLUMN_WIDTH = 16;
const STATUS_COLUMN_WIDTH = 22;

type ActivityRow = {
  displayName: string;
  countryFlag: string | null;
  matches: number;
};

type AvatarLeaderRow = {
  avatar: string;
  pilot: AvatarPilotStats;
};

type DisplayData = {
  qualified: RankedPlayerStats[];
  notQualified: RankedPlayerStats[];
  activity: ActivityRow[];
  bestPilots: AvatarLeaderRow[];
  noBestPilot: AvatarLeaderRow[];
};

type OmittedCounts = Record<keyof DisplayData, number>;

function pad(value: string | number, width: number): string {
  return String(value).padEnd(width, " ");
}

function formatCountryCell(flag?: string | null): string {
  return flag ?? "";
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

function formatQualifiedRows(rows: RankedPlayerStats[], omitted: number): string[] {
  const header = `${pad("#", 3)} ${pad("Player", PLAYER_COLUMN_WIDTH)} ${pad("WR", 6)} ${pad("W-D-L", 8)} ${pad("Games", 5)} Country`;
  const body = rows.map((row, index) => [
    pad(index + 1, 3),
    pad(truncateText(row.displayName, PLAYER_COLUMN_WIDTH), PLAYER_COLUMN_WIDTH),
    pad(formatPercent(row.winRate), 6),
    pad(formatRecord(row.wins, row.draws, row.losses), 8),
    pad(row.matches, 5),
    formatCountryCell(row.countryFlag)
  ].join(" "));

  if (body.length === 0 && omitted === 0) body.push("No qualified players yet.");
  if (omitted > 0) body.push(`... ${omitted} more qualified ${omitted === 1 ? "player" : "players"}`);
  return [header, ...body];
}

function formatNotQualifiedRows(rows: RankedPlayerStats[], omitted: number): string[] {
  const header = `${pad("#", 3)} ${pad("Player", PLAYER_COLUMN_WIDTH)} ${pad("WR", 6)} ${pad("W-D-L", 8)} ${pad("Games", 5)} ${pad("Needed", 6)} Country`;
  const body = rows.map((row) => [
    pad("-", 3),
    pad(truncateText(row.displayName, PLAYER_COLUMN_WIDTH), PLAYER_COLUMN_WIDTH),
    pad(formatPercent(row.winRate), 6),
    pad(formatRecord(row.wins, row.draws, row.losses), 8),
    pad(row.matches, 5),
    pad(`+${row.gamesNeeded}`, 6),
    formatCountryCell(row.countryFlag)
  ].join(" "));

  if (body.length === 0 && omitted === 0) body.push("None.");
  if (omitted > 0) body.push(`... ${omitted} more unqualified ${omitted === 1 ? "player" : "players"}`);
  return [header, ...body];
}

function formatActivityRows(rows: ActivityRow[], omitted: number): string[] {
  const header = `${pad("#", 3)} ${pad("Player", PLAYER_COLUMN_WIDTH)} ${pad("Games", 5)} Country`;
  const body = rows.map((row, index) => [
    pad(index + 1, 3),
    pad(truncateText(row.displayName, PLAYER_COLUMN_WIDTH), PLAYER_COLUMN_WIDTH),
    pad(row.matches, 5),
    formatCountryCell(row.countryFlag)
  ].join(" "));

  if (body.length === 0 && omitted === 0) body.push("No confirmed matches yet.");
  if (omitted > 0) body.push(`... ${omitted} more active ${omitted === 1 ? "player" : "players"}`);
  return [header, ...body];
}

function formatBestPilotRows(rows: AvatarLeaderRow[], omitted: number): string[] {
  const header = `${pad("Avatar", AVATAR_COLUMN_WIDTH)} ${pad("Best Pilot", PILOT_COLUMN_WIDTH)} ${pad("WR", 6)} ${pad("W-D-L", 8)} ${pad("Games", 5)} Country`;
  const body = rows.map(({ avatar, pilot }) => [
    pad(truncateText(avatar, AVATAR_COLUMN_WIDTH), AVATAR_COLUMN_WIDTH),
    pad(truncateText(pilot.displayName, PILOT_COLUMN_WIDTH), PILOT_COLUMN_WIDTH),
    pad(formatPercent(pilot.winRate), 6),
    pad(formatRecord(pilot.wins, pilot.draws, pilot.losses), 8),
    pad(pilot.matches, 5),
    formatCountryCell(pilot.countryFlag)
  ].join(" "));

  if (body.length === 0 && omitted === 0) body.push("No Best Pilots yet.");
  if (omitted > 0) body.push(`... ${omitted} more qualified ${omitted === 1 ? "avatar" : "avatars"}`);
  return [header, ...body];
}

function formatPilotStatus(pilot: AvatarPilotStats): string {
  const reasons: string[] = [];
  if (pilot.gamesNeeded > 0) {
    reasons.push(`+${pilot.gamesNeeded} ${pilot.gamesNeeded === 1 ? "game" : "games"}`);
  }
  if (!pilot.meetsWinRateRequirement) {
    reasons.push(`WR below ${formatPercent(config.avatarMinWinRate)}`);
  }
  return reasons.join(", ");
}

function formatNoBestPilotRows(rows: AvatarLeaderRow[], omitted: number): string[] {
  const header = `${pad("Avatar", AVATAR_COLUMN_WIDTH)} ${pad("Leading Player", PILOT_COLUMN_WIDTH)} ${pad("WR", 6)} ${pad("W-D-L", 8)} ${pad("Games", 5)} ${pad("Status", STATUS_COLUMN_WIDTH)} Country`;
  const body = rows.map(({ avatar, pilot }) => [
    pad(truncateText(avatar, AVATAR_COLUMN_WIDTH), AVATAR_COLUMN_WIDTH),
    pad(truncateText(pilot.displayName, PILOT_COLUMN_WIDTH), PILOT_COLUMN_WIDTH),
    pad(formatPercent(pilot.winRate), 6),
    pad(formatRecord(pilot.wins, pilot.draws, pilot.losses), 8),
    pad(pilot.matches, 5),
    pad(truncateText(formatPilotStatus(pilot), STATUS_COLUMN_WIDTH), STATUS_COLUMN_WIDTH),
    formatCountryCell(pilot.countryFlag)
  ].join(" "));

  if (body.length === 0 && omitted === 0) body.push("None.");
  if (omitted > 0) body.push(`... ${omitted} more provisional ${omitted === 1 ? "avatar" : "avatars"}`);
  return [header, ...body];
}

function buildMessage(
  seasonName: string,
  lastUpdate: string,
  lastConfirmedMatchId: number | null,
  data: DisplayData,
  omitted: OmittedCounts
): string {
  return [
    "```text",
    `🏆 ${config.leagueName}`,
    `Season: ${seasonName}`,
    `Last update: ${lastUpdate}`,
    `Last confirmed match: ${lastConfirmedMatchId ? `#${lastConfirmedMatchId}` : "none"}`,
    "",
    "COMPETITIVE LEADERBOARD",
    "Ranking: Win Rate",
    `Minimum to qualify: ${config.leaderboardMinMatches} competitive games`,
    "",
    "QUALIFIED PLAYERS",
    ...formatQualifiedRows(data.qualified, omitted.qualified),
    "",
    "UNQUALIFIED PLAYERS",
    ...formatNotQualifiedRows(data.notQualified, omitted.notQualified),
    "",
    "ACTIVITY LEADERBOARD",
    ...formatActivityRows(data.activity, omitted.activity),
    "",
    "AVATAR STANDINGS",
    "Ranking: Win Rate",
    `Best Pilot: ${config.avatarMinMatches} games and ${formatPercent(config.avatarMinWinRate)} WR`,
    "",
    "BEST PILOTS",
    ...formatBestPilotRows(data.bestPilots, omitted.bestPilots),
    "",
    "NO BEST PILOT YET",
    ...formatNoBestPilotRows(data.noBestPilot, omitted.noBestPilot),
    "```"
  ].join("\n");
}

function fitMessageToDiscordLimit(
  seasonName: string,
  lastUpdate: string,
  lastConfirmedMatchId: number | null,
  sourceData: DisplayData
): string {
  const data: DisplayData = {
    qualified: [...sourceData.qualified],
    notQualified: [...sourceData.notQualified],
    activity: [...sourceData.activity],
    bestPilots: [...sourceData.bestPilots],
    noBestPilot: [...sourceData.noBestPilot]
  };
  const omitted: OmittedCounts = {
    qualified: 0,
    notQualified: 0,
    activity: 0,
    bestPilots: 0,
    noBestPilot: 0
  };

  const removeLast = (key: keyof DisplayData, minimumRows: number): boolean => {
    if (data[key].length <= minimumRows) return false;
    data[key].pop();
    omitted[key] += 1;
    return true;
  };

  let content = buildMessage(seasonName, lastUpdate, lastConfirmedMatchId, data, omitted);
  while (content.length > DISCORD_MESSAGE_LIMIT) {
    const removed =
      removeLast("noBestPilot", 0) ||
      removeLast("notQualified", 0) ||
      removeLast("activity", 5) ||
      removeLast("bestPilots", 1) ||
      removeLast("qualified", 3) ||
      removeLast("activity", 0) ||
      removeLast("qualified", 1);

    if (!removed) {
      throw new Error("Leaderboard message cannot fit within Discord's 2,000-character limit.");
    }
    content = buildMessage(seasonName, lastUpdate, lastConfirmedMatchId, data, omitted);
  }

  return content;
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
      "AVATAR STANDINGS",
      "No active season.",
      "```"
    ].join("\n");
  }

  const [competitive, activity, avatarLeaderboards, lastConfirmedMatchId] = await Promise.all([
    getCompetitiveLeaderboard(),
    getActivityLeaderboard(),
    getAllAvatarLeaderboards(),
    getLastConfirmedMatchId(season.id)
  ]);

  const bestPilots: AvatarLeaderRow[] = [];
  const noBestPilot: AvatarLeaderRow[] = [];

  for (const leaderboard of avatarLeaderboards) {
    const bestPilot = leaderboard.qualified[0];
    if (bestPilot) {
      bestPilots.push({ avatar: leaderboard.avatar, pilot: bestPilot });
      continue;
    }

    const leadingPlayer = leaderboard.notQualified[0];
    if (leadingPlayer) noBestPilot.push({ avatar: leaderboard.avatar, pilot: leadingPlayer });
  }

  return fitMessageToDiscordLimit(season.name, lastUpdate, lastConfirmedMatchId, {
    qualified: competitive.qualified,
    notQualified: competitive.notQualified,
    activity,
    bestPilots,
    noBestPilot
  });
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

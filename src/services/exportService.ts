import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../db/prisma.js";
import { getActivityLeaderboard } from "./activityService.js";
import { getCompetitiveLeaderboard } from "./leaderboardService.js";

function csvEscape(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(raw)) return `"${raw.replaceAll('"', '""')}"`;
  return raw;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  }
  return lines.join("\n");
}

export async function exportCsvFiles() {
  const exportDir = path.resolve("exports");
  await fs.mkdir(exportDir, { recursive: true });

  const players = await prisma.player.findMany({ orderBy: { id: "asc" } });
  const matches = await prisma.match.findMany({ orderBy: { id: "asc" } });
  const leaderboard = await getCompetitiveLeaderboard();
  const activity = await getActivityLeaderboard();

  const leaderboardRows = [
    ...leaderboard.qualified.map((entry, index) => ({
      rank: index + 1,
      qualified: true,
      countryFlag: entry.countryFlag,
      displayName: entry.displayName,
      winRate: entry.winRate,
      wins: entry.wins,
      draws: entry.draws,
      losses: entry.losses,
      matches: entry.matches,
      gamesNeeded: entry.gamesNeeded,
      opponents: entry.opponents.size,
      legacyPoints: entry.points
    })),
    ...leaderboard.notQualified.map((entry) => ({
      rank: "",
      qualified: false,
      countryFlag: entry.countryFlag,
      displayName: entry.displayName,
      winRate: entry.winRate,
      wins: entry.wins,
      draws: entry.draws,
      losses: entry.losses,
      matches: entry.matches,
      gamesNeeded: entry.gamesNeeded,
      opponents: entry.opponents.size,
      legacyPoints: entry.points
    }))
  ];

  const files = [
    { name: "players.csv", rows: players },
    { name: "matches.csv", rows: matches },
    { name: "leaderboard.csv", rows: leaderboardRows },
    {
      name: "activity.csv",
      rows: activity.map((entry, index) => ({
        rank: index + 1,
        countryFlag: entry.countryFlag,
        displayName: entry.displayName,
        matches: entry.matches
      }))
    }
  ];

  const writtenFiles: string[] = [];
  for (const file of files) {
    const fullPath = path.join(exportDir, file.name);
    await fs.writeFile(fullPath, toCsv(file.rows as Record<string, unknown>[]), "utf8");
    writtenFiles.push(fullPath);
  }

  return writtenFiles;
}

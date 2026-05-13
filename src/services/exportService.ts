import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../db/prisma.js";
import { getCompetitiveLeaderboard } from "./leaderboardService.js";
import { getActivityLeaderboard } from "./activityService.js";

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

  const files = [
    { name: "players.csv", rows: players },
    { name: "matches.csv", rows: matches },
    { name: "leaderboard.csv", rows: leaderboard.map((entry, index) => ({ rank: index + 1, displayName: entry.displayName, points: entry.points, wins: entry.wins, losses: entry.losses, draws: entry.draws, matches: entry.matches, opponents: entry.opponents.size })) },
    { name: "activity.csv", rows: activity.map((entry, index) => ({ rank: index + 1, displayName: entry.displayName, matches: entry.matches })) }
  ];

  const writtenFiles: string[] = [];
  for (const file of files) {
    const fullPath = path.join(exportDir, file.name);
    await fs.writeFile(fullPath, toCsv(file.rows as Record<string, unknown>[]), "utf8");
    writtenFiles.push(fullPath);
  }

  return writtenFiles;
}

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { config } from "../config.js";
import { getCompetitiveLeaderboard } from "../services/leaderboardService.js";
import { displayPlayerName } from "../utils/display.js";
import { formatPercent, formatRecord } from "../utils/formatting.js";

export const leaderboardCommand = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Show the competitive leaderboard.");

export async function handleLeaderboard(interaction: ChatInputCommandInteraction) {
  const leaderboard = await getCompetitiveLeaderboard();
  if (leaderboard.qualified.length === 0 && leaderboard.notQualified.length === 0) {
    await interaction.reply("No competitive matches have been confirmed yet.");
    return;
  }

  const qualifiedLines = leaderboard.qualified.slice(0, 20).map((entry, index) => {
    return `${index + 1}. ${displayPlayerName(entry.displayName, entry.countryFlag)}, ${formatPercent(entry.winRate)}, ${formatRecord(entry.wins, entry.draws, entry.losses)}, ${entry.matches} games`;
  });

  const notQualifiedLines = leaderboard.notQualified.slice(0, 20).map((entry) => {
    const gameLabel = entry.gamesNeeded === 1 ? "game" : "games";
    return `- ${displayPlayerName(entry.displayName, entry.countryFlag)}, ${formatPercent(entry.winRate)}, ${formatRecord(entry.wins, entry.draws, entry.losses)}, ${entry.matches} games, needs ${entry.gamesNeeded} more ${gameLabel}`;
  });

  await interaction.reply([
    "Competitive leaderboard",
    `Ranking: Win Rate | Minimum to qualify: ${config.leaderboardMinMatches} games`,
    "",
    "Qualified players:",
    ...(qualifiedLines.length > 0 ? qualifiedLines : ["No qualified players yet."]),
    "",
    "Unqualified players:",
    ...(notQualifiedLines.length > 0 ? notQualifiedLines : ["None."])
  ].join("\n"));
}

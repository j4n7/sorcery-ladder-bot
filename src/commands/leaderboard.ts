import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getCompetitiveLeaderboard } from "../services/leaderboardService.js";
import { formatRecord } from "../utils/formatting.js";
import { displayPlayerName } from "../utils/display.js";

export const leaderboardCommand = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Show the competitive leaderboard.");

export async function handleLeaderboard(interaction: ChatInputCommandInteraction) {
  const rows = await getCompetitiveLeaderboard();
  if (rows.length === 0) {
    await interaction.reply("No competitive matches have been confirmed yet.");
    return;
  }

  const lines = rows.slice(0, 20).map((entry, index) => {
    return `${index + 1}. ${displayPlayerName(entry.displayName, entry.countryFlag)}, ${entry.points} pts, ${formatRecord(entry.wins, entry.losses, entry.draws)}, ${entry.matches} matches`;
  });

  await interaction.reply(["Competitive leaderboard", "", ...lines].join("\n"));
}

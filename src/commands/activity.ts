import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getActivityLeaderboard } from "../services/activityService.js";

export const activityCommand = new SlashCommandBuilder()
  .setName("activity")
  .setDescription("Show the activity ranking.");

export async function handleActivity(interaction: ChatInputCommandInteraction) {
  const rows = await getActivityLeaderboard();
  if (rows.length === 0) {
    await interaction.reply("No confirmed matches yet.");
    return;
  }

  const lines = rows.slice(0, 20).map((entry, index) => `${index + 1}. ${entry.displayName}, ${entry.matches} matches`);
  await interaction.reply(["Activity ranking", "", ...lines].join("\n"));
}

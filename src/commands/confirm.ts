import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { confirmMatch, rejectMatch } from "../services/matchService.js";

export const confirmCommand = new SlashCommandBuilder()
  .setName("confirm")
  .setDescription("Confirm a pending match by ID.")
  .addIntegerOption((option) => option.setName("match_id").setDescription("Match ID.").setRequired(true));

export const rejectCommand = new SlashCommandBuilder()
  .setName("reject")
  .setDescription("Reject a pending match by ID.")
  .addIntegerOption((option) => option.setName("match_id").setDescription("Match ID.").setRequired(true));

export async function handleConfirm(interaction: ChatInputCommandInteraction) {
  const matchId = interaction.options.getInteger("match_id", true);
  try {
    const match = await confirmMatch(matchId, interaction.user.id);
    const competitiveText = match.competitive
      ? "This match counts for the competitive leaderboard."
      : `This match only counts for activity. Reason: ${match.nonCompetitiveReason}.`;

    await interaction.reply([
      `Match #${match.id} confirmed.`,
      "",
      `${match.player1.displayName}, ${match.player1Avatar}`,
      "vs",
      `${match.player2.displayName}, ${match.player2Avatar}`,
      "",
      competitiveText
    ].join("\n"));
  } catch (error) {
    await interaction.reply({ content: error instanceof Error ? error.message : "Unknown error.", ephemeral: true });
  }
}

export async function handleReject(interaction: ChatInputCommandInteraction) {
  const matchId = interaction.options.getInteger("match_id", true);
  try {
    const match = await rejectMatch(matchId, interaction.user.id);
    await interaction.reply(`Match #${match.id} rejected by ${match.player2.displayName}. It will not count for the league.`);
  } catch (error) {
    await interaction.reply({ content: error instanceof Error ? error.message : "Unknown error.", ephemeral: true });
  }
}

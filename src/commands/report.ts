import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { AVATARS } from "../utils/avatarList.js";
import { reportMatch } from "../services/matchService.js";

export const reportCommand = new SlashCommandBuilder()
  .setName("report")
  .setDescription("Report a league match.")
  .addUserOption((option) => option.setName("opponent").setDescription("The opponent.").setRequired(true))
  .addStringOption((option) => option.setName("my_avatar").setDescription("Your avatar.").setRequired(true).addChoices(...AVATARS.map((avatar) => ({ name: avatar, value: avatar }))))
  .addStringOption((option) => option.setName("opponent_avatar").setDescription("Opponent avatar.").setRequired(true).addChoices(...AVATARS.map((avatar) => ({ name: avatar, value: avatar }))))
  .addStringOption((option) => option.setName("result").setDescription("Your result.").setRequired(true).addChoices(
    { name: "Win", value: "win" },
    { name: "Loss", value: "loss" },
    { name: "Draw", value: "draw" }
  ));

export async function handleReport(interaction: ChatInputCommandInteraction) {
  const opponent = interaction.options.getUser("opponent", true);
  if (opponent.bot) {
    await interaction.reply({ content: "You cannot report a match against a bot.", ephemeral: true });
    return;
  }
  if (opponent.id === interaction.user.id) {
    await interaction.reply({ content: "You cannot report a match against yourself.", ephemeral: true });
    return;
  }

  const match = await reportMatch({
    reporterDiscordId: interaction.user.id,
    reporterName: interaction.user.displayName,
    opponentDiscordId: opponent.id,
    opponentName: opponent.displayName,
    reporterAvatar: interaction.options.getString("my_avatar", true),
    opponentAvatar: interaction.options.getString("opponent_avatar", true),
    reporterResult: interaction.options.getString("result", true) as "win" | "loss" | "draw"
  });

  const winnerText = match.resultType === "DRAW"
    ? "Draw"
    : match.resultType === "PLAYER_1_WIN"
      ? `${match.player1.displayName} wins`
      : `${match.player2.displayName} wins`;

  await interaction.reply([
    `Match #${match.id} reported.`,
    "",
    `${match.player1.displayName}, ${match.player1Avatar}`,
    "vs",
    `${match.player2.displayName}, ${match.player2Avatar}`,
    "",
    `Reported result: ${winnerText}.`,
    `Status: pending confirmation by <@${match.player2.discordId}>.`,
    `They must use /confirm match_id:${match.id} or /reject match_id:${match.id}.`
  ].join("\n"));
}

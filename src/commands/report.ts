import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { reportMatch } from "../services/matchService.js";
import { config } from "../config.js";

export const reportCommand = new SlashCommandBuilder()
  .setName("report")
  .setDescription("Report a league match.")
  .addUserOption((option) =>
    option
      .setName("opponent")
      .setDescription("The opponent.")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("my_avatar")
      .setDescription("Your avatar.")
      .setRequired(true)
      .setAutocomplete(true)
  )
  .addStringOption((option) =>
    option
      .setName("opponent_avatar")
      .setDescription("Opponent avatar.")
      .setRequired(true)
      .setAutocomplete(true)
  )
  .addStringOption((option) =>
    option
      .setName("result")
      .setDescription("Your result.")
      .setRequired(true)
      .addChoices(
        { name: "Win", value: "win" },
        { name: "Loss", value: "loss" },
        { name: "Draw", value: "draw" }
      )
  );

const REPORT_PLAYER_COLUMN_WIDTH = 16;

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
}

function pad(value: string, width: number): string {
  return value.padEnd(width, " ");
}

function formatReportPlayerLine(displayName: string, avatar: string): string {
  return `${pad(truncate(displayName, REPORT_PLAYER_COLUMN_WIDTH), REPORT_PLAYER_COLUMN_WIDTH)} ${avatar}`;
}

export async function handleReport(interaction: ChatInputCommandInteraction) {
  if (config.reportsChannelId && interaction.channelId !== config.reportsChannelId) {
    await interaction.reply({
      content: `Please use <#${config.reportsChannelId}> to report league matches.`,
      ephemeral: true
    });
    return;
  }

  const opponent = interaction.options.getUser("opponent", true);

  if (opponent.bot) {
    await interaction.reply({ content: "You cannot report a match against a bot.", ephemeral: true });
    return;
  }

  if (opponent.id === interaction.user.id) {
    await interaction.reply({ content: "You cannot report a match against yourself.", ephemeral: true });
    return;
  }

  const reporterMember = interaction.guild
    ? await interaction.guild.members.fetch(interaction.user.id).catch(() => null)
    : null;

  const opponentMember = interaction.guild
    ? await interaction.guild.members.fetch(opponent.id).catch(() => null)
    : null;

  const reporterDisplayName = reporterMember?.displayName ?? interaction.user.displayName;
  const opponentDisplayName = opponentMember?.displayName ?? opponent.displayName;

  const match = await reportMatch({
    reporterDiscordId: interaction.user.id,
    reporterName: reporterDisplayName,
    opponentDiscordId: opponent.id,
    opponentName: opponentDisplayName,
    reporterAvatar: interaction.options.getString("my_avatar", true),
    opponentAvatar: interaction.options.getString("opponent_avatar", true),
    reporterResult: interaction.options.getString("result", true) as "win" | "loss" | "draw"
  });

  const winnerText =
    match.resultType === "DRAW"
      ? "Draw"
      : match.resultType === "PLAYER_1_WIN"
        ? match.player1.displayName
        : match.player2.displayName;

  const resultLine =
    match.resultType === "DRAW"
      ? "🤝 Result: Draw"
      : `🏆 Winner: ${winnerText}`;

  await interaction.reply([
    "```",
    `📜 Match #${match.id} reported`,
    "",
    `${match.player1.displayName} ⚔️ ${match.player2.displayName}`,
    "",
    formatReportPlayerLine(match.player1.displayName, match.player1Avatar),
    formatReportPlayerLine(match.player2.displayName, match.player2Avatar),
    "",
    resultLine,
    `⏳ Pending confirmation by ${match.player2.displayName}`,
    "```",
    `<@${match.player2.discordId}>, use \`/confirm match_id:${match.id}\` or \`/reject match_id:${match.id}\`.`
  ].join("\n"));
}
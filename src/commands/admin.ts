import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { cancelMatch, listMatches, setCompetitive } from "../services/matchService.js";
import { isAdminInteraction } from "../utils/permissions.js";
import { exportCsvFiles } from "../services/exportService.js";

export const adminMatchesCommand = new SlashCommandBuilder()
  .setName("admin-matches")
  .setDescription("Admin: show recent matches.")
  .addIntegerOption((option) => option.setName("limit").setDescription("Number of matches.").setRequired(false));

export const adminCancelMatchCommand = new SlashCommandBuilder()
  .setName("admin-cancel-match")
  .setDescription("Admin: cancel a match.")
  .addIntegerOption((option) => option.setName("match_id").setDescription("Match ID.").setRequired(true));

export const adminSetCompetitiveCommand = new SlashCommandBuilder()
  .setName("admin-set-competitive")
  .setDescription("Admin: mark a match as competitive or non-competitive.")
  .addIntegerOption((option) => option.setName("match_id").setDescription("Match ID.").setRequired(true))
  .addBooleanOption((option) => option.setName("value").setDescription("Competitive value.").setRequired(true));

export const adminExportCsvCommand = new SlashCommandBuilder()
  .setName("admin-export-csv")
  .setDescription("Admin: export CSV files.");

async function requireAdmin(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (!isAdminInteraction(interaction)) {
    await interaction.reply({ content: "Only server managers can use this command.", ephemeral: true });
    return false;
  }
  return true;
}

export async function handleAdminMatches(interaction: ChatInputCommandInteraction) {
  if (!(await requireAdmin(interaction))) return;
  const limit = interaction.options.getInteger("limit") ?? 10;
  const matches = await listMatches(Math.min(limit, 25));

  if (matches.length === 0) {
    await interaction.reply("No matches found.");
    return;
  }

  const lines = matches.map((match) => {
    return `#${match.id} ${match.player1.displayName} (${match.player1Avatar}) vs ${match.player2.displayName} (${match.player2Avatar}) | ${match.status} | competitive=${match.competitive}`;
  });

  await interaction.reply(["Recent matches", "", ...lines].join("\n"));
}

export async function handleAdminCancelMatch(interaction: ChatInputCommandInteraction) {
  if (!(await requireAdmin(interaction))) return;
  const matchId = interaction.options.getInteger("match_id", true);
  await cancelMatch(matchId);
  await interaction.reply(`Match #${matchId} cancelled.`);
}

export async function handleAdminSetCompetitive(interaction: ChatInputCommandInteraction) {
  if (!(await requireAdmin(interaction))) return;
  const matchId = interaction.options.getInteger("match_id", true);
  const value = interaction.options.getBoolean("value", true);
  await setCompetitive(matchId, value);
  await interaction.reply(`Match #${matchId} competitive value set to ${value}.`);
}

export async function handleAdminExportCsv(interaction: ChatInputCommandInteraction) {
  if (!(await requireAdmin(interaction))) return;
  const files = await exportCsvFiles();
  await interaction.reply(["CSV export completed:", ...files.map((file) => `- ${file}`)].join("\n"));
}

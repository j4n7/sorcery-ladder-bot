import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { cancelMatch, listMatches, setCompetitive } from "../services/matchService.js";
import { isAdminInteraction } from "../utils/permissions.js";
import { exportCsvFiles } from "../services/exportService.js";
import {
  activateSeason,
  closeActiveSeason,
  createAndActivateSeason,
  findActiveSeason,
  listSeasons,
  parseSeasonDate
} from "../services/seasonService.js";
import { config } from "../config.js";

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

export const adminSeasonsCommand = new SlashCommandBuilder()
  .setName("admin-seasons")
  .setDescription("Admin: list league seasons.");

export const adminNewSeasonCommand = new SlashCommandBuilder()
  .setName("admin-new-season")
  .setDescription("Admin: create and activate a new season.")
  .addStringOption((option) => option.setName("name").setDescription("Season name, for example: June 2026.").setRequired(true))
  .addStringOption((option) => option.setName("start_date").setDescription("Start date in YYYY-MM-DD format.").setRequired(true))
  .addStringOption((option) => option.setName("end_date").setDescription("End date in YYYY-MM-DD format.").setRequired(true));

export const adminActivateSeasonCommand = new SlashCommandBuilder()
  .setName("admin-activate-season")
  .setDescription("Admin: activate an existing season.")
  .addIntegerOption((option) => option.setName("season_id").setDescription("Season ID.").setRequired(true));

export const adminCloseSeasonCommand = new SlashCommandBuilder()
  .setName("admin-close-season")
  .setDescription("Admin: close the currently active season.");

export const adminSetupStatusCommand = new SlashCommandBuilder()
  .setName("admin-setup-status")
  .setDescription("Admin: show bot setup status.");

async function requireAdmin(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (!isAdminInteraction(interaction)) {
    await interaction.reply({ content: "You are not allowed to use this admin command.", ephemeral: true });
    return false;
  }
  return true;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatChannelStatus(channelId: string | undefined): string {
  return channelId ? `<#${channelId}> (${channelId})` : "not configured";
}

export async function handleAdminMatches(interaction: ChatInputCommandInteraction) {
  if (!(await requireAdmin(interaction))) return;
  const limit = interaction.options.getInteger("limit") ?? 10;
  const matches = await listMatches(Math.min(limit, 25));

  if (matches.length === 0) {
    await interaction.reply("No matches found.");
    return;
  }

  const lines = matches.map((match: any) => {
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

export async function handleAdminSeasons(interaction: ChatInputCommandInteraction) {
  if (!(await requireAdmin(interaction))) return;
  const seasons = await listSeasons();

  if (seasons.length === 0) {
    await interaction.reply("No seasons found. Use /admin-new-season to create one.");
    return;
  }

  const lines = seasons.map((season: any) => {
    const status = season.isActive ? "active" : "inactive";
    return `#${season.id} ${season.name} | ${status} | ${formatDate(season.startsAt)} to ${formatDate(season.endsAt)}`;
  });

  await interaction.reply(["Seasons", "", ...lines].join("\n"));
}

export async function handleAdminNewSeason(interaction: ChatInputCommandInteraction) {
  if (!(await requireAdmin(interaction))) return;
  const name = interaction.options.getString("name", true);
  const startsAt = parseSeasonDate(interaction.options.getString("start_date", true), "start_date");
  const endsAt = parseSeasonDate(interaction.options.getString("end_date", true), "end_date");

  const season = await createAndActivateSeason({ name, startsAt, endsAt });
  await interaction.reply(`Season #${season.id} created and activated: ${season.name}. New matches will now be assigned to this season.`);
}

export async function handleAdminActivateSeason(interaction: ChatInputCommandInteraction) {
  if (!(await requireAdmin(interaction))) return;
  const seasonId = interaction.options.getInteger("season_id", true);
  const season = await activateSeason(seasonId);
  await interaction.reply(`Season #${season.id} activated: ${season.name}. New matches will now be assigned to this season.`);
}

export async function handleAdminCloseSeason(interaction: ChatInputCommandInteraction) {
  if (!(await requireAdmin(interaction))) return;
  const season = await closeActiveSeason();
  await interaction.reply(`Season #${season.id} closed: ${season.name}. New matches cannot be reported until another season is activated.`);
}

export async function handleAdminSetupStatus(interaction: ChatInputCommandInteraction) {
  if (!(await requireAdmin(interaction))) return;
  const activeSeason = await findActiveSeason();

  await interaction.reply([
    "Setup status",
    "",
    `Active season: ${activeSeason ? `#${activeSeason.id} ${activeSeason.name}` : "none"}`,
    `Info channel: ${formatChannelStatus(config.infoChannelId)}`,
    `Reports channel: ${formatChannelStatus(config.reportsChannelId)}`,
    `Leaderboard channel: ${formatChannelStatus(config.leaderboardChannelId)}`,
    `Errors channel: ${formatChannelStatus(config.errorsChannelId)}`,
    `Admin user IDs: ${config.adminUserIds.length > 0 ? config.adminUserIds.join(", ") : "not configured, falling back to Manage Server permission"}`,
    `Timezone: ${config.timezone}`,
    `Weekly match limit: ${config.weeklyMatchLimit}`,
    `Weekly opponent limit: ${config.weeklyOpponentLimit}`,
    `Avatar minimum matches: ${config.avatarMinMatches}`
  ].join("\n"));
}

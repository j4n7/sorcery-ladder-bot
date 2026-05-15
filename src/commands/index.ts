import { ChatInputCommandInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { reportCommand, handleReport } from "./report.js";
import { confirmCommand, rejectCommand, handleConfirm, handleReject } from "./confirm.js";
import { leaderboardCommand, handleLeaderboard } from "./leaderboard.js";
import { activityCommand, handleActivity } from "./activity.js";
import { avatarCommand, handleAvatar } from "./avatar.js";
import { profileCommand, handleProfile } from "./profile.js";
import { setCountryCommand, removeCountryCommand, handleSetCountry, handleRemoveCountry } from "./country.js";
import {
  adminMatchesCommand,
  adminCancelMatchCommand,
  adminSetCompetitiveCommand,
  adminExportCsvCommand,
  adminSeasonsCommand,
  adminNewSeasonCommand,
  adminActivateSeasonCommand,
  adminCloseSeasonCommand,
  adminSetupStatusCommand,
  adminRefreshLeaderboardCommand,
  handleAdminMatches,
  handleAdminCancelMatch,
  handleAdminSetCompetitive,
  handleAdminExportCsv,
  handleAdminSeasons,
  handleAdminNewSeason,
  handleAdminActivateSeason,
  handleAdminCloseSeason,
  handleAdminSetupStatus,
  handleAdminRefreshLeaderboard
} from "./admin.js";

export const commands = [
  reportCommand,
  confirmCommand,
  rejectCommand,
  leaderboardCommand,
  activityCommand,
  avatarCommand,
  profileCommand,
  setCountryCommand,
  removeCountryCommand,
  adminMatchesCommand,
  adminCancelMatchCommand,
  adminSetCompetitiveCommand,
  adminExportCsvCommand,
  adminSeasonsCommand,
  adminNewSeasonCommand,
  adminActivateSeasonCommand,
  adminCloseSeasonCommand,
  adminSetupStatusCommand,
  adminRefreshLeaderboardCommand
];

export const commandData: RESTPostAPIChatInputApplicationCommandsJSONBody[] = commands.map((command) => command.toJSON());

export async function handleCommand(interaction: ChatInputCommandInteraction) {
  switch (interaction.commandName) {
    case "report":
      await handleReport(interaction);
      break;
    case "confirm":
      await handleConfirm(interaction);
      break;
    case "reject":
      await handleReject(interaction);
      break;
    case "leaderboard":
      await handleLeaderboard(interaction);
      break;
    case "activity":
      await handleActivity(interaction);
      break;
    case "avatar":
      await handleAvatar(interaction);
      break;
    case "profile":
      await handleProfile(interaction);
      break;
    case "set-country":
      await handleSetCountry(interaction);
      break;
    case "remove-country":
      await handleRemoveCountry(interaction);
      break;
    case "admin-matches":
      await handleAdminMatches(interaction);
      break;
    case "admin-cancel-match":
      await handleAdminCancelMatch(interaction);
      break;
    case "admin-set-competitive":
      await handleAdminSetCompetitive(interaction);
      break;
    case "admin-export-csv":
      await handleAdminExportCsv(interaction);
      break;
    case "admin-seasons":
      await handleAdminSeasons(interaction);
      break;
    case "admin-new-season":
      await handleAdminNewSeason(interaction);
      break;
    case "admin-activate-season":
      await handleAdminActivateSeason(interaction);
      break;
    case "admin-close-season":
      await handleAdminCloseSeason(interaction);
      break;
    case "admin-setup-status":
      await handleAdminSetupStatus(interaction);
      break;
    case "admin-refresh-leaderboard":
      await handleAdminRefreshLeaderboard(interaction);
      break;
    default:
      await interaction.reply({ content: "Unknown command.", ephemeral: true });
  }
}

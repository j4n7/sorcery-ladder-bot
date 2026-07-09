import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { config } from "../config.js";
import { getAvatarLeaderboard } from "../services/avatarService.js";
import { displayPlayerName } from "../utils/display.js";
import { formatPercent, formatRecord } from "../utils/formatting.js";

export const avatarCommand = new SlashCommandBuilder()
  .setName("avatar")
  .setDescription("Show the leaderboard for one avatar.")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("Avatar name.")
      .setRequired(true)
      .setAutocomplete(true)
  );

function formatQualificationStatus(entry: {
  gamesNeeded: number;
  meetsWinRateRequirement: boolean;
}): string {
  const reasons: string[] = [];
  if (entry.gamesNeeded > 0) {
    reasons.push(`needs ${entry.gamesNeeded} more ${entry.gamesNeeded === 1 ? "game" : "games"}`);
  }
  if (!entry.meetsWinRateRequirement) {
    reasons.push(`WR below ${formatPercent(config.avatarMinWinRate)}`);
  }
  return reasons.join(", ");
}

export async function handleAvatar(interaction: ChatInputCommandInteraction) {
  const avatar = interaction.options.getString("name", true);
  const result = await getAvatarLeaderboard(avatar);

  const qualified = result.qualified.map((entry, index) => {
    return `${index + 1}. ${displayPlayerName(entry.displayName, entry.countryFlag)}, ${formatPercent(entry.winRate)}, ${formatRecord(entry.wins, entry.draws, entry.losses)}, ${entry.matches} games`;
  });

  const notQualified = result.notQualified.map((entry) => {
    return `- ${displayPlayerName(entry.displayName, entry.countryFlag)}, ${formatPercent(entry.winRate)}, ${formatRecord(entry.wins, entry.draws, entry.losses)}, ${entry.matches} games, ${formatQualificationStatus(entry)}`;
  });

  await interaction.reply([
    `${avatar} leaderboard`,
    `Best Pilot requirements: ${config.avatarMinMatches} games and ${formatPercent(config.avatarMinWinRate)} WR`,
    "",
    "Qualified pilots:",
    ...(qualified.length > 0 ? qualified : ["No Best Pilot yet."]),
    "",
    "Not qualified:",
    ...(notQualified.length > 0 ? notQualified : ["None."])
  ].join("\n"));
}

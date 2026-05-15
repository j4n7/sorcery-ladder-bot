import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { AVATARS } from "../utils/avatarList.js";
import { getAvatarLeaderboard } from "../services/avatarService.js";
import { formatPercent, formatRecord } from "../utils/formatting.js";
import { displayPlayerName } from "../utils/display.js";

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

export async function handleAvatar(interaction: ChatInputCommandInteraction) {
  const avatar = interaction.options.getString("name", true);
  const result = await getAvatarLeaderboard(avatar);

  const qualified = result.qualified.map((entry, index) => {
    const winrate = entry.matches === 0 ? 0 : entry.wins / entry.matches;
    return `${index + 1}. ${displayPlayerName(entry.displayName, entry.countryFlag)}, ${entry.points} pts, ${formatRecord(entry.wins, entry.losses, entry.draws)}, ${formatPercent(winrate)}`;
  });

  const notQualified = result.notQualified.map((entry) => `- ${displayPlayerName(entry.displayName, entry.countryFlag)}, ${entry.points} pts, ${formatRecord(entry.wins, entry.losses, entry.draws)}`);

  await interaction.reply([
    `${avatar} leaderboard`,
    "",
    "Qualified:",
    ...(qualified.length > 0 ? qualified : ["No qualified players yet."]),
    "",
    "Not qualified:",
    ...(notQualified.length > 0 ? notQualified : ["None."])
  ].join("\n"));
}

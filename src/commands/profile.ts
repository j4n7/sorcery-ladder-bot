import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getProfile } from "../services/profileService.js";
import { displayPlayerName } from "../utils/display.js";
import { formatPercent, formatRecord } from "../utils/formatting.js";

export const profileCommand = new SlashCommandBuilder()
  .setName("profile")
  .setDescription("Show a player profile.")
  .addUserOption((option) => option.setName("player").setDescription("Player.").setRequired(false));

export async function handleProfile(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("player") ?? interaction.user;
  const profile = await getProfile(user.id);
  if (!profile) {
    await interaction.reply(`${user.displayName} has no league profile yet.`);
    return;
  }

  const avatarLines = profile.avatarStats.map((entry) => {
    return `- ${entry.avatar}: ${formatRecord(entry.wins, entry.draws, entry.losses)}, ${formatPercent(entry.winRate)}, ${entry.competitiveMatches} competitive games`;
  });

  const qualificationStatus = profile.qualified
    ? "Qualified"
    : `Not qualified, needs ${profile.gamesNeeded} more ${profile.gamesNeeded === 1 ? "game" : "games"}`;

  await interaction.reply([
    `${displayPlayerName(profile.player.displayName, profile.player.countryFlag)}`,
    "",
    `Competitive record: ${formatRecord(profile.wins, profile.draws, profile.losses)}`,
    `Win rate: ${formatPercent(profile.winRate)}`,
    `Competitive matches: ${profile.competitiveMatches}`,
    `Qualification: ${qualificationStatus}`,
    `Total matches: ${profile.totalMatches}`,
    `Country: ${profile.player.countryFlag ? `${profile.player.countryFlag} ${profile.player.countryName} (${profile.player.countryCode})` : "not set"}`,
    `Main avatar: ${profile.mainAvatar}`,
    "",
    "Avatars:",
    ...(avatarLines.length > 0 ? avatarLines : ["No avatars yet."])
  ].join("\n"));
}

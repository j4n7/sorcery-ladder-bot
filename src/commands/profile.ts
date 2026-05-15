import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getProfile } from "../services/profileService.js";
import { formatRecord } from "../utils/formatting.js";
import { displayPlayerName } from "../utils/display.js";

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

  const avatarLines = profile.avatarStats.map((entry) => `- ${entry.avatar}: ${formatRecord(entry.wins, entry.losses, entry.draws)}, ${entry.points} pts`);

  await interaction.reply([
    `${displayPlayerName(profile.player.displayName, profile.player.countryFlag)}`,
    "",
    `Points: ${profile.points}`,
    `Competitive record: ${formatRecord(profile.wins, profile.losses, profile.draws)}`,
    `Competitive matches: ${profile.competitiveMatches}`,
    `Total matches: ${profile.totalMatches}`,
    `Country: ${profile.player.countryFlag ? `${profile.player.countryFlag} ${profile.player.countryName} (${profile.player.countryCode})` : "not set"}`,
    `Main avatar: ${profile.mainAvatar}`,
    "",
    "Avatars:",
    ...(avatarLines.length > 0 ? avatarLines : ["No avatars yet."])
  ].join("\n"));
}

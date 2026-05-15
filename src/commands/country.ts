import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { parseCountryCode, formatNicknameWithCountry, stripLeadingFlag } from "../utils/country.js";
import { removePlayerCountry, setPlayerCountry } from "../services/playerService.js";
import { tryRefreshLeaderboardMessage } from "../services/leaderboardMessageService.js";

export const setCountryCommand = new SlashCommandBuilder()
  .setName("set-country")
  .setDescription("Set your country flag for the league and add it to your server nickname.")
  .addStringOption((option) => option.setName("code").setDescription("Two-letter country code, for example ES, AR, MX, CL.").setRequired(true));

export const removeCountryCommand = new SlashCommandBuilder()
  .setName("remove-country")
  .setDescription("Remove your country flag from the league and from your server nickname.");

async function getMember(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return null;
  return interaction.guild.members.fetch(interaction.user.id);
}

export async function handleSetCountry(interaction: ChatInputCommandInteraction) {
  const countryCode = interaction.options.getString("code", true);
  const country = parseCountryCode(countryCode);

  if (!country) {
    await interaction.reply({ content: "Invalid country code. Please use a valid two-letter country code, for example ES, AR, MX or CL.", ephemeral: true });
    return;
  }

  const member = await getMember(interaction);
  const currentDisplayName = member?.displayName ?? interaction.user.displayName;
  const cleanDisplayName = stripLeadingFlag(currentDisplayName) || interaction.user.username;

  await setPlayerCountry(interaction.user.id, cleanDisplayName, country);

  let nicknameMessage = "Your league country has been saved.";
  if (member) {
    const nextNickname = formatNicknameWithCountry(currentDisplayName, country.flag);
    try {
      await member.setNickname(nextNickname, "League country flag updated");
      nicknameMessage = `Your server nickname has been updated to: ${nextNickname}`;
    } catch {
      nicknameMessage = "Your league country has been saved, but I could not update your server nickname. Please check my Manage Nicknames permission and role position.";
    }
  }

  await interaction.reply([
    `Country set to ${country.flag} ${country.name} (${country.code}).`,
    nicknameMessage
  ].join("\n"));
  await tryRefreshLeaderboardMessage(interaction.client);
}

export async function handleRemoveCountry(interaction: ChatInputCommandInteraction) {
  const member = await getMember(interaction);
  const currentDisplayName = member?.displayName ?? interaction.user.displayName;
  const cleanDisplayName = stripLeadingFlag(currentDisplayName) || interaction.user.username;

  await removePlayerCountry(interaction.user.id, cleanDisplayName);

  let nicknameMessage = "Your league country has been removed.";
  if (member) {
    try {
      await member.setNickname(cleanDisplayName, "League country flag removed");
      nicknameMessage = `Your server nickname has been updated to: ${cleanDisplayName}`;
    } catch {
      nicknameMessage = "Your league country has been removed, but I could not update your server nickname. Please check my Manage Nicknames permission and role position.";
    }
  }

  await interaction.reply([
    "Country removed.",
    nicknameMessage
  ].join("\n"));
  await tryRefreshLeaderboardMessage(interaction.client);
}

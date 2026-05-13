import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";

export function isAdminInteraction(interaction: ChatInputCommandInteraction): boolean {
  if (!interaction.inCachedGuild()) return false;
  return interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
}

import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { config } from "../config.js";

export function isAdminInteraction(interaction: ChatInputCommandInteraction): boolean {
  if (config.adminUserIds.length > 0) {
    return config.adminUserIds.includes(interaction.user.id);
  }

  if (!interaction.inCachedGuild()) return false;
  return interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
}

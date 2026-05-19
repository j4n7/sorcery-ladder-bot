import { AutocompleteInteraction } from "discord.js";
import { AVATARS } from "../utils/avatarList.js";

const AVATAR_OPTION_NAMES = new Set<string>(["name", "my_avatar", "opponent_avatar"]);

export async function handleAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const focusedOption = interaction.options.getFocused(true);

  if (!AVATAR_OPTION_NAMES.has(focusedOption.name)) {
    await interaction.respond([]);
    return;
  }

  const focusedValue = String(focusedOption.value ?? "").toLowerCase();

  const choices = AVATARS
    .filter((avatar: string) => avatar.toLowerCase().includes(focusedValue))
    .slice(0, 25)
    .map((avatar: string) => ({
      name: avatar,
      value: avatar
    }));

  await interaction.respond(choices);
}
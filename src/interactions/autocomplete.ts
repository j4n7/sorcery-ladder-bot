import { AutocompleteInteraction } from "discord.js";
import { AVATARS } from "../utils/avatarList";

const AVATAR_OPTION_NAMES = new Set(["name", "my_avatar", "opponent_avatar"]);

export async function handleAutocomplete(interaction: AutocompleteInteraction) {
  const focusedOption = interaction.options.getFocused(true);

  if (!AVATAR_OPTION_NAMES.has(focusedOption.name)) {
    await interaction.respond([]);
    return;
  }

  const focusedValue = String(focusedOption.value ?? "").toLowerCase();

  const choices = AVATARS
    .filter((avatar) => avatar.toLowerCase().includes(focusedValue))
    .slice(0, 25)
    .map((avatar) => ({
      name: avatar,
      value: avatar
    }));

  await interaction.respond(choices);
}
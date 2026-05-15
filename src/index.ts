import { Client, GatewayIntentBits } from "discord.js";
import { config } from "./config.js";
import { handleCommand } from "./commands/index.js";
import { handleAutocomplete } from "./interactions/autocomplete.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag ?? "unknown bot"}.`);
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isAutocomplete()) {
      await handleAutocomplete(interaction);
      return;
    }

    if (!interaction.isChatInputCommand()) {
      return;
    }

    await handleCommand(interaction);
  } catch (error) {
    console.error(error);

    const message = error instanceof Error ? error.message : "Unknown error.";

    if (interaction.isAutocomplete()) {
      return;
    }

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: message, ephemeral: true });
    } else {
      await interaction.reply({ content: message, ephemeral: true });
    }
  }
});

await client.login(config.discordToken);
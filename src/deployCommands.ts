import { REST, Routes } from "discord.js";
import { config } from "./config.js";
import { commandData } from "./commands/index.js";

const rest = new REST({ version: "10" }).setToken(config.discordToken);

await rest.put(
  Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId),
  { body: commandData }
);

console.log(`Registered ${commandData.length} commands.`);

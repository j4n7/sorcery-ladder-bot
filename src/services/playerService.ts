import { prisma } from "../db/prisma.js";

export async function upsertPlayer(discordId: string, displayName: string) {
  return prisma.player.upsert({
    where: { discordId },
    update: { displayName },
    create: { discordId, displayName }
  });
}

export async function getPlayerByDiscordId(discordId: string) {
  return prisma.player.findUnique({ where: { discordId } });
}

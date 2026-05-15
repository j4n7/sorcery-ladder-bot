import { prisma } from "../db/prisma.js";
import { stripLeadingFlag } from "../utils/country.js";

export async function upsertPlayer(discordId: string, displayName: string) {
  const cleanDisplayName = stripLeadingFlag(displayName);

  return prisma.player.upsert({
    where: { discordId },
    update: { displayName: cleanDisplayName },
    create: { discordId, displayName: cleanDisplayName }
  });
}

export async function getPlayerByDiscordId(discordId: string) {
  return prisma.player.findUnique({ where: { discordId } });
}

export async function setPlayerCountry(discordId: string, displayName: string, country: { code: string; flag: string; name: string }) {
  const cleanDisplayName = stripLeadingFlag(displayName);

  return prisma.player.upsert({
    where: { discordId },
    update: {
      displayName: cleanDisplayName,
      countryCode: country.code,
      countryFlag: country.flag,
      countryName: country.name
    },
    create: {
      discordId,
      displayName: cleanDisplayName,
      countryCode: country.code,
      countryFlag: country.flag,
      countryName: country.name
    }
  });
}

export async function removePlayerCountry(discordId: string, displayName: string) {
  const cleanDisplayName = stripLeadingFlag(displayName);

  return prisma.player.upsert({
    where: { discordId },
    update: {
      displayName: cleanDisplayName,
      countryCode: null,
      countryFlag: null,
      countryName: null
    },
    create: {
      discordId,
      displayName: cleanDisplayName,
      countryCode: null,
      countryFlag: null,
      countryName: null
    }
  });
}

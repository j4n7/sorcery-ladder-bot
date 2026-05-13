import { prisma } from "../db/prisma.js";

export async function getActiveSeason() {
  let season = await prisma.season.findFirst({ where: { isActive: true } });
  if (season) return season;

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  season = await prisma.season.create({
    data: {
      name: `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`,
      startsAt: start,
      endsAt: end,
      isActive: true
    }
  });

  return season;
}

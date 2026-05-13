import { prisma } from "../db/prisma.js";

export type CreateSeasonInput = {
  name: string;
  startsAt: Date;
  endsAt: Date;
};

export function parseSeasonDate(value: string, fieldName: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${fieldName} must use YYYY-MM-DD format.`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} is not a valid date.`);
  }

  return date;
}

export async function getActiveSeason() {
  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) {
    throw new Error("No active season found. An admin must create or activate a season first.");
  }
  return season;
}

export async function findActiveSeason() {
  return prisma.season.findFirst({ where: { isActive: true } });
}

export async function listSeasons(limit = 20) {
  return prisma.season.findMany({
    take: limit,
    orderBy: { id: "desc" }
  });
}

export async function createAndActivateSeason(input: CreateSeasonInput) {
  if (input.endsAt <= input.startsAt) {
    throw new Error("Season end date must be after start date.");
  }

  return prisma.$transaction(async (transaction: any) => {
    await transaction.season.updateMany({ data: { isActive: false } });
    return transaction.season.create({
      data: {
        name: input.name,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        isActive: true
      }
    });
  });
}

export async function activateSeason(seasonId: number) {
  const existingSeason = await prisma.season.findUnique({ where: { id: seasonId } });
  if (!existingSeason) {
    throw new Error(`Season #${seasonId} was not found.`);
  }

  return prisma.$transaction(async (transaction: any) => {
    await transaction.season.updateMany({ data: { isActive: false } });
    return transaction.season.update({
      where: { id: seasonId },
      data: { isActive: true }
    });
  });
}

export async function closeActiveSeason() {
  const activeSeason = await findActiveSeason();
  if (!activeSeason) {
    throw new Error("No active season found.");
  }

  return prisma.season.update({
    where: { id: activeSeason.id },
    data: { isActive: false }
  });
}

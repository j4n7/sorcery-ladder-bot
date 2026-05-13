import "dotenv/config";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptionalNumberEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable: ${name}`);
  }
  return parsed;
}

export const config = {
  discordToken: getRequiredEnv("DISCORD_TOKEN"),
  discordClientId: getRequiredEnv("DISCORD_CLIENT_ID"),
  discordGuildId: getRequiredEnv("DISCORD_GUILD_ID"),
  timezone: process.env.TIMEZONE ?? "Europe/Madrid",
  weeklyMatchLimit: getOptionalNumberEnv("WEEKLY_MATCH_LIMIT", 5),
  weeklyOpponentLimit: getOptionalNumberEnv("WEEKLY_OPPONENT_LIMIT", 2),
  avatarMinMatches: getOptionalNumberEnv("AVATAR_MIN_MATCHES", 3)
};

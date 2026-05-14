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

function getOptionalCsvEnv(name: string): string[] {
  const value = process.env[name];
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export const config = {
  discordToken: getRequiredEnv("DISCORD_TOKEN"),
  discordClientId: getRequiredEnv("DISCORD_CLIENT_ID"),
  discordGuildId: getRequiredEnv("DISCORD_GUILD_ID"),
  leagueName: process.env.LEAGUE_NAME?.trim() || "Sorcery Ladder",
  timezone: process.env.TIMEZONE ?? "Europe/Madrid",
  weeklyMatchLimit: getOptionalNumberEnv("WEEKLY_MATCH_LIMIT", 5),
  weeklyOpponentLimit: getOptionalNumberEnv("WEEKLY_OPPONENT_LIMIT", 2),
  avatarMinMatches: getOptionalNumberEnv("AVATAR_MIN_MATCHES", 3),
  adminUserIds: getOptionalCsvEnv("ADMIN_USER_IDS"),
  infoChannelId: getOptionalEnv("INFO_CHANNEL_ID"),
  reportsChannelId: getOptionalEnv("REPORTS_CHANNEL_ID"),
  leaderboardChannelId: getOptionalEnv("LEADERBOARD_CHANNEL_ID"),
  errorsChannelId: getOptionalEnv("ERRORS_CHANNEL_ID")
};

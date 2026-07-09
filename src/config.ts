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

function getOptionalPositiveIntegerEnv(name: string, fallback: number): number {
  const value = getOptionalNumberEnv(name, fallback);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}

function getOptionalPercentageEnv(name: string, fallback: number): number {
  const value = getOptionalNumberEnv(name, fallback);
  if (value < 0 || value > 100) {
    throw new Error(`${name} must be between 0 and 100.`);
  }
  return value / 100;
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
  leagueName: process.env.LEAGUE_NAME?.trim() || "Sorcery Hispanic Ladder",
  timezone: process.env.TIMEZONE ?? "Europe/Madrid",
  weeklyMatchLimit: getOptionalPositiveIntegerEnv("WEEKLY_MATCH_LIMIT", 5),
  weeklyOpponentLimit: getOptionalPositiveIntegerEnv("WEEKLY_OPPONENT_LIMIT", 2),
  leaderboardMinMatches: getOptionalPositiveIntegerEnv("LEADERBOARD_MIN_MATCHES", 5),
  avatarMinMatches: getOptionalPositiveIntegerEnv("AVATAR_MIN_MATCHES", 5),
  avatarMinWinRate: getOptionalPercentageEnv("AVATAR_MIN_WIN_RATE", 50),
  adminUserIds: getOptionalCsvEnv("ADMIN_USER_IDS"),
  infoChannelId: getOptionalEnv("INFO_CHANNEL_ID"),
  reportsChannelId: getOptionalEnv("REPORTS_CHANNEL_ID"),
  leaderboardChannelId: getOptionalEnv("LEADERBOARD_CHANNEL_ID"),
  errorsChannelId: getOptionalEnv("ERRORS_CHANNEL_ID")
};

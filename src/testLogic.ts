import { prisma } from "./db/prisma.js";
import { reportMatch, confirmMatch } from "./services/matchService.js";
import { getCompetitiveLeaderboard } from "./services/leaderboardService.js";
import { getActivityLeaderboard } from "./services/activityService.js";

async function main() {
  console.log("Creating sample matches...");

  const match1 = await reportMatch({
    reporterDiscordId: "1001",
    reporterName: "Alejandro",
    opponentDiscordId: "1002",
    opponentName: "Fruno",
    reporterAvatar: "Elementalist",
    opponentAvatar: "Seer",
    reporterResult: "win"
  });

  await confirmMatch(match1.id, "1002");

  const match2 = await reportMatch({
    reporterDiscordId: "1002",
    reporterName: "Fruno",
    opponentDiscordId: "1003",
    opponentName: "Marta",
    reporterAvatar: "Seer",
    opponentAvatar: "Battlemage",
    reporterResult: "loss"
  });

  await confirmMatch(match2.id, "1003");

  const leaderboard = await getCompetitiveLeaderboard();
  const activity = await getActivityLeaderboard();

  console.log("Competitive leaderboard:");
  console.table(leaderboard.map((entry) => ({ name: entry.displayName, points: entry.points, wins: entry.wins, losses: entry.losses, matches: entry.matches })));

  console.log("Activity leaderboard:");
  console.table(activity);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

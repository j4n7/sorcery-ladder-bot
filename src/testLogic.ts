import assert from "node:assert/strict";
import { calculateWinRate, compareByWinRate, getGamesNeeded, RankingStats } from "./utils/ranking.js";

function createStats(displayName: string, wins: number, losses: number, draws = 0): RankingStats {
  const matches = wins + losses + draws;
  return {
    displayName,
    wins,
    losses,
    draws,
    matches,
    opponents: new Set(Array.from({ length: matches }, (_, index) => index + 1))
  };
}

function main() {
  const players = [
    createStats("L1BRA", 6, 8),
    createStats("Fruno", 8, 1),
    createStats("Menjasopes", 5, 4),
    createStats("ryutras", 5, 1),
    createStats("rata", 2, 8)
  ].sort(compareByWinRate);

  assert.deepEqual(
    players.map((player) => player.displayName),
    ["Fruno", "ryutras", "Menjasopes", "L1BRA", "rata"]
  );

  assert.equal(calculateWinRate(createStats("Fruno", 8, 1)), 8 / 9);
  assert.equal(getGamesNeeded(4, 5), 1);
  assert.equal(getGamesNeeded(5, 5), 0);
  assert.equal(getGamesNeeded(9, 5), 0);

  const exactThreshold = createStats("Threshold", 3, 3);
  assert.equal(calculateWinRate(exactThreshold), 0.5);
  assert.ok(calculateWinRate(exactThreshold) >= 0.5);

  const belowThreshold = createStats("Below", 2, 5);
  assert.ok(calculateWinRate(belowThreshold) < 0.5);

  console.log("Ranking logic tests passed.");
}

main();

export const AVATARS = [
  "Avatar of Air",
  "Avatar of Earth",
  "Avatar of Fire",
  "Avatar of Water",
  "Battlemage",
  "Elementalist",
  "Geomancer",
  "Pathfinder",
  "Seer",
  "Sorcerer"
] as const;

export function isValidAvatar(value: string): boolean {
  return AVATARS.includes(value as (typeof AVATARS)[number]);
}

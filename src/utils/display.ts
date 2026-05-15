export function displayPlayerName(displayName: string, countryFlag?: string | null): string {
  return countryFlag ? `${countryFlag} ${displayName}` : displayName;
}

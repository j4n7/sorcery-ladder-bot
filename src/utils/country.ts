const FLAG_REGEX = /^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u;
const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/;

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export type CountryInfo = {
  code: string;
  flag: string;
  name: string;
};

function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

export function stripLeadingFlag(value: string): string {
  return value.replace(FLAG_REGEX, "").trimStart();
}

export function parseCountryCode(value: string): CountryInfo | null {
  const code = value.trim().toUpperCase();
  if (!COUNTRY_CODE_REGEX.test(code)) return null;

  const name = regionNames.of(code);
  if (!name || name === code) return null;

  return {
    code,
    flag: countryCodeToFlag(code),
    name
  };
}

export function formatNicknameWithCountry(currentNickname: string, flag: string): string {
  const cleanNickname = stripLeadingFlag(currentNickname);
  return `${flag} ${cleanNickname}`;
}

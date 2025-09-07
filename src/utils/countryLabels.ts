const countryLabels: Record<string, string> = {
  AT: "Austria",
  BE: "Belgium",
  BG: "Bulgaria",
  CH: "Switzerland",
  CY: "Cyprus",
  CZ: "Czech Republic",
  DE: "Germany",
  DK: "Denmark",
  EE: "Estonia",
  ES: "Spain",
  FI: "Finland",
  FR: "France",
  GB: "UK",
  GR: "Greece",
  HR: "Croatia",
  HU: "Hungary",
  IE: "Ireland",
  IT: "Italy",
  LT: "Lithuania",
  LU: "Luxembourg",
  LV: "Latvia",
  MT: "Malta",
  NL: "Netherlands",
  NO: "Norway",
  PL: "Poland",
  PT: "Portugal",
  RO: "Romania",
  SE: "Sweden",
  SI: "Slovenia",
  SK: "Slovakia",
};

const countryKeys: Record<string, string> = {
  uk: "GB",
  "united kingdom": "GB",
  austria: "AT",
  belgium: "BE",
  bulgaria: "BG",
  croatia: "HR",
  cyprus: "CY",
  "czech republic": "CZ",
  czechia: "CZ",
  denmark: "DK",
  estonia: "EE",
  finland: "FI",
  france: "FR",
  germany: "DE",
  greece: "GR",
  hungary: "HU",
  ireland: "IE",
  italy: "IT",
  lithuania: "LT",
  luxembourg: "LU",
  latvia: "LV",
  malta: "MT",
  netherlands: "NL",
  norway: "NO",
  poland: "PL",
  portugal: "PT",
  romania: "RO",
  slovenia: "SI",
  slovakia: "SK",
  spain: "ES",
  sweden: "SE",
  switzerland: "CH",
};

export function getCountryLabel(countryKey: string): string | undefined {
  const upperCaseCountryKey = countryKey.toUpperCase();

  return countryLabels[upperCaseCountryKey];
}

export function getCountryCode(countryName: string): string {
  const normalizedCountryName = countryName.toLowerCase();

  return countryKeys[normalizedCountryName] ?? countryName;
}

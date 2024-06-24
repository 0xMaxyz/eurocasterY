export type CountryCode =
  | "ALB"
  | "AUT"
  | "BEL"
  | "DEN"
  | "ENG"
  | "FRA"
  | "GER"
  | "HUN"
  | "ITA"
  | "NED"
  | "POL"
  | "POR"
  | "ROU"
  | "SCO"
  | "ESP"
  | "SUI"
  | "TUR"
  | "SRB"
  | "CRO"
  | "GEO"
  | "SVN"
  | "UKR"
  | "SVK"
  | "CZE";
const countryFlags: { [key: string]: string } = {
  ALB: "\u{1F1E6}\u{1F1F1}",
  AUT: "\u{1F1E6}\u{1F1F9}",
  BEL: "\u{1F1E7}\u{1F1EA}",
  DEN: "\u{1F1E9}\u{1F1F0}",
  ENG: "\u{1F1EC}\u{1F1E7}",
  FRA: "\u{1F1EB}\u{1F1F7}",
  GER: "\u{1F1E9}\u{1F1EA}",
  HUN: "\u{1F1ED}\u{1F1FA}",
  ITA: "\u{1F1EE}\u{1F1F9}",
  NED: "\u{1F1F3}\u{1F1F1}",
  POL: "\u{1F1F5}\u{1F1F1}",
  POR: "\u{1F1F5}\u{1F1F9}",
  ROU: "\u{1F1F7}\u{1F1F4}",
  SCO: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E007F}",
  ESP: "\u{1F1EA}\u{1F1F8}",
  SUI: "\u{1F1E8}\u{1F1ED}",
  TUR: "\u{1F1F9}\u{1F1F7}",
  SRB: "\u{1F1F7}\u{1F1F8}",
  CRO: "\u{1F1ED}\u{1F1F7}",
  GEO: "\u{1F1EC}\u{1F1EA}",
  SVN: "\u{1F1F8}\u{1F1EE}",
  UKR: "\u{1F1FA}\u{1F1E6}",
  SVK: "\u{1F1F8}\u{1F1F0}",
  CZE: "\u{1F1E8}\u{1F1FF}",
};

const countryMap: Record<CountryCode, string> = {
  ALB: "ALBANIA",
  AUT: "AUSTRIA",
  BEL: "BELGIUM",
  DEN: "DENMARK",
  ENG: "ENGLAND",
  FRA: "FRANCE",
  GER: "GERMANY",
  HUN: "HUNGARY",
  ITA: "ITALY",
  NED: "NETHERLANDS",
  POL: "POLAND",
  POR: "PORTUGAL",
  ROU: "ROMANIA",
  SCO: "SCOTLAND",
  ESP: "SPAIN",
  SUI: "SWITZERLAND",
  TUR: "TURKEY",
  SRB: "SERBIA",
  CRO: "CROATIA",
  GEO: "GEORGIA",
  SVN: "SLOVENIA",
  UKR: "UKRAINE",
  SVK: "SLOVAKIA",
  CZE: "CZECH REPUBLIC",
};

export const countryCodeToName = (code: CountryCode): string => {
  return countryMap[code] || "UNKNOWN";
};

export const getFlagEmoji = (countryShortCode: string): string => {
  const flag = countryFlags[countryShortCode];
  if (!flag) {
    throw new Error(
      `No flag found for country short code: ${countryShortCode}`
    );
  }
  return flag;
};

export const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
};

export const dateOptions: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "numeric",
  hour12: true,
};

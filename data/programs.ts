/**
 * Every points and miles program the app knows, with CreditDash's own
 * default valuation for each, in cents per point.
 *
 * The defaults are rounded estimates in line with the published consensus
 * (revised 30 October 2026), not any one publisher's table, and never
 * labelled as anyone else's. Users can set their own on the Points page or
 * inside a calculator.
 *
 * Programs no card in the catalog earns are still here on purpose: people
 * hold airline and hotel points from flying and staying.
 *
 * The ids are stored in browser storage and in the `point_balances` and
 * `valuations` tables, so never rename one. Four predate this list
 * (`capital-one`, `bilt`, `hilton`, `united`) and keep their short forms.
 * The tables allow any id of 1 to 32 characters.
 */

export type ProgramGroup = "transferable" | "airline" | "hotel";

export const PROGRAM_GROUP_LABELS: Record<ProgramGroup, string> = {
  transferable: "Transferable",
  airline: "Airlines",
  hotel: "Hotels",
};

export const PROGRAM_GROUPS: ProgramGroup[] = ["transferable", "airline", "hotel"];

export const PROGRAMS = [
  { id: "amex-mr", label: "Amex Membership Rewards", group: "transferable", cpp: 2.0 },
  { id: "capital-one", label: "Capital One", group: "transferable", cpp: 1.8 },
  { id: "chase-ur", label: "Chase Ultimate Rewards", group: "transferable", cpp: 2.0 },
  { id: "citi-ty", label: "Citi ThankYou", group: "transferable", cpp: 1.8 },
  { id: "wells-fargo", label: "Wells Fargo Rewards", group: "transferable", cpp: 1.6 },
  { id: "bilt", label: "Bilt", group: "transferable", cpp: 2.1 },

  { id: "aeromexico", label: "Aeromexico", group: "airline", cpp: 0.8 },
  { id: "aeroplan", label: "Air Canada Aeroplan", group: "airline", cpp: 1.5 },
  { id: "alaska-atmos", label: "Alaska Atmos Rewards", group: "airline", cpp: 1.5 },
  { id: "aadvantage", label: "American AAdvantage", group: "airline", cpp: 1.4 },
  { id: "ana", label: "ANA Mileage Club", group: "airline", cpp: 1.4 },
  { id: "lifemiles", label: "Avianca LifeMiles", group: "airline", cpp: 1.5 },
  { id: "avios", label: "Avios", group: "airline", cpp: 1.4 },
  { id: "asia-miles", label: "Cathay Asia Miles", group: "airline", cpp: 1.3 },
  { id: "delta", label: "Delta SkyMiles", group: "airline", cpp: 1.1 },
  { id: "emirates", label: "Emirates Skywards", group: "airline", cpp: 1.1 },
  { id: "etihad", label: "Etihad Guest", group: "airline", cpp: 1.1 },
  { id: "flying-blue", label: "Flying Blue", group: "airline", cpp: 1.3 },
  { id: "frontier", label: "Frontier", group: "airline", cpp: 1.1 },
  { id: "jetblue", label: "JetBlue TrueBlue", group: "airline", cpp: 1.3 },
  { id: "qantas", label: "Qantas", group: "airline", cpp: 1.2 },
  { id: "krisflyer", label: "Singapore KrisFlyer", group: "airline", cpp: 1.3 },
  { id: "southwest", label: "Southwest Rapid Rewards", group: "airline", cpp: 1.3 },
  { id: "turkish", label: "Turkish Miles&Smiles", group: "airline", cpp: 1.1 },
  { id: "united", label: "United MileagePlus", group: "airline", cpp: 1.3 },
  { id: "virgin-atlantic", label: "Virgin Atlantic Flying Club", group: "airline", cpp: 1.4 },

  { id: "accor", label: "Accor Live Limitless", group: "hotel", cpp: 2.0 },
  { id: "best-western", label: "Best Western", group: "hotel", cpp: 0.6 },
  { id: "choice", label: "Choice Privileges", group: "hotel", cpp: 0.8 },
  { id: "hilton", label: "Hilton Honors", group: "hotel", cpp: 0.5 },
  { id: "ihg", label: "IHG One Rewards", group: "hotel", cpp: 0.5 },
  { id: "marriott", label: "Marriott Bonvoy", group: "hotel", cpp: 0.8 },
  { id: "hyatt", label: "World of Hyatt", group: "hotel", cpp: 1.7 },
  { id: "wyndham", label: "Wyndham", group: "hotel", cpp: 0.6 },
] as const satisfies readonly {
  id: string;
  label: string;
  group: ProgramGroup;
  cpp: number;
}[];

export type Program = (typeof PROGRAMS)[number]["id"];

const IDS: ReadonlySet<string> = new Set(PROGRAMS.map((p) => p.id));

export function isProgram(id: unknown): id is Program {
  return typeof id === "string" && IDS.has(id);
}

export const PROGRAM_LABELS = Object.fromEntries(
  PROGRAMS.map((p) => [p.id, p.label]),
) as Record<Program, string>;

export const PROGRAM_GROUP = Object.fromEntries(
  PROGRAMS.map((p) => [p.id, p.group]),
) as Record<Program, ProgramGroup>;

/** CreditDash's default cents per point, by program. */
export const DEFAULT_CPP = Object.fromEntries(
  PROGRAMS.map((p) => [p.id, p.cpp]),
) as Record<Program, number>;

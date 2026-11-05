/**
 * Every points and miles program the app knows, with CreditDash's own
 * default valuation for each, in cents per point.
 *
 * The defaults assume a baseline of 1 cent a point (owner, 5 November
 * 2026): no default is above 1 cent, because that is roughly what points
 * fetch as cash or travel without transfer tricks. Programs usually worth
 * less (Hilton, Marriott, IHG and others) keep their lower estimate, so
 * ranking stays honest: valuing Hilton points at 1 cent would put a Hilton
 * card above the Amex Gold for groceries. Users can set their own on the
 * Points page or inside a calculator. The 30 October consensus values
 * are kept in lib/data/schema.ts for the v2 migration only.
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
  { id: "amex-mr", label: "Amex Membership Rewards", group: "transferable", cpp: 1.0 },
  { id: "capital-one", label: "Capital One", group: "transferable", cpp: 1.0 },
  { id: "chase-ur", label: "Chase Ultimate Rewards", group: "transferable", cpp: 1.0 },
  { id: "citi-ty", label: "Citi ThankYou", group: "transferable", cpp: 1.0 },
  { id: "wells-fargo", label: "Wells Fargo Rewards", group: "transferable", cpp: 1.0 },
  { id: "bilt", label: "Bilt", group: "transferable", cpp: 1.0 },

  { id: "aeromexico", label: "Aeromexico", group: "airline", cpp: 0.8 },
  { id: "aeroplan", label: "Air Canada Aeroplan", group: "airline", cpp: 1.0 },
  { id: "alaska-atmos", label: "Alaska Atmos Rewards", group: "airline", cpp: 1.0 },
  { id: "aadvantage", label: "American AAdvantage", group: "airline", cpp: 1.0 },
  { id: "ana", label: "ANA Mileage Club", group: "airline", cpp: 1.0 },
  { id: "lifemiles", label: "Avianca LifeMiles", group: "airline", cpp: 1.0 },
  { id: "avios", label: "Avios", group: "airline", cpp: 1.0 },
  { id: "asia-miles", label: "Cathay Asia Miles", group: "airline", cpp: 1.0 },
  { id: "delta", label: "Delta SkyMiles", group: "airline", cpp: 1.0 },
  { id: "emirates", label: "Emirates Skywards", group: "airline", cpp: 1.0 },
  { id: "etihad", label: "Etihad Guest", group: "airline", cpp: 1.0 },
  { id: "flying-blue", label: "Flying Blue", group: "airline", cpp: 1.0 },
  { id: "frontier", label: "Frontier", group: "airline", cpp: 1.0 },
  { id: "jetblue", label: "JetBlue TrueBlue", group: "airline", cpp: 1.0 },
  { id: "qantas", label: "Qantas", group: "airline", cpp: 1.0 },
  { id: "krisflyer", label: "Singapore KrisFlyer", group: "airline", cpp: 1.0 },
  { id: "southwest", label: "Southwest Rapid Rewards", group: "airline", cpp: 1.0 },
  { id: "turkish", label: "Turkish Miles&Smiles", group: "airline", cpp: 1.0 },
  { id: "united", label: "United MileagePlus", group: "airline", cpp: 1.0 },
  { id: "virgin-atlantic", label: "Virgin Atlantic Flying Club", group: "airline", cpp: 1.0 },

  { id: "accor", label: "Accor Live Limitless", group: "hotel", cpp: 1.0 },
  { id: "best-western", label: "Best Western", group: "hotel", cpp: 0.6 },
  { id: "choice", label: "Choice Privileges", group: "hotel", cpp: 0.8 },
  { id: "hilton", label: "Hilton Honors", group: "hotel", cpp: 0.5 },
  { id: "ihg", label: "IHG One Rewards", group: "hotel", cpp: 0.5 },
  { id: "marriott", label: "Marriott Bonvoy", group: "hotel", cpp: 0.8 },
  { id: "hyatt", label: "World of Hyatt", group: "hotel", cpp: 1.0 },
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

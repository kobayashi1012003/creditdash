import {
  CalculatorIcon,
  CardsThreeIcon,
  CoinsIcon,
  ColumnsPlusRightIcon,
  GearSixIcon,
  ListChecksIcon,
  NotepadIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

export type NavItem = {
  href: string;
  label: string;
  Icon: Icon;
  /**
   * Left out of the phone's tab bar, which has room for six. Reached there
   * from its page's own link instead (Notes: the Tracker's header).
   */
  phone?: false;
};

/** The app's destinations, in the order the sidebar and tab bar show them. */
export const NAV: NavItem[] = [
  { href: "/wallet", label: "Wallet", Icon: CardsThreeIcon },
  { href: "/points", label: "Points", Icon: CoinsIcon },
  { href: "/tracker", label: "Tracker", Icon: ListChecksIcon },
  { href: "/calculators", label: "Calculators", Icon: CalculatorIcon },
  { href: "/compare", label: "Compare", Icon: ColumnsPlusRightIcon },
  { href: "/notes", label: "Notes", Icon: NotepadIcon, phone: false },
  { href: "/settings", label: "Settings", Icon: GearSixIcon },
];

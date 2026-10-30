import {
  CalculatorIcon,
  CardsThreeIcon,
  CoinsIcon,
  ColumnsPlusRightIcon,
  GearSixIcon,
  ListChecksIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

export type NavItem = {
  href: string;
  label: string;
  Icon: Icon;
};

/** The app's six destinations, in the order the sidebar and tab bar show them. */
export const NAV: NavItem[] = [
  { href: "/wallet", label: "Wallet", Icon: CardsThreeIcon },
  { href: "/points", label: "Points", Icon: CoinsIcon },
  { href: "/tracker", label: "Tracker", Icon: ListChecksIcon },
  { href: "/calculators", label: "Calculators", Icon: CalculatorIcon },
  { href: "/compare", label: "Compare", Icon: ColumnsPlusRightIcon },
  { href: "/settings", label: "Settings", Icon: GearSixIcon },
];

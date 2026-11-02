import {
  AirplaneTiltIcon,
  BuildingsIcon,
  ForkKnifeIcon,
  GasPumpIcon,
  type IconProps,
  ShoppingCartIcon,
  TagIcon,
  TelevisionSimpleIcon,
  TrainSimpleIcon,
} from "@phosphor-icons/react";
import type { Category } from "@/lib/categories";

/**
 * One glyph per spend category, so a category reads the same at a glance
 * on every screen. Kept out of lib/categories.ts, which stays free of React
 * so its consumers can be tested with `node --test`.
 */
const ICONS: Record<Category, React.ComponentType<IconProps>> = {
  dining: ForkKnifeIcon,
  groceries: ShoppingCartIcon,
  flights: AirplaneTiltIcon,
  hotels: BuildingsIcon,
  gas: GasPumpIcon,
  transit: TrainSimpleIcon,
  streaming: TelevisionSimpleIcon,
  other: TagIcon,
};

export function CategoryIcon({
  category,
  size = 14,
  className,
}: {
  category: Category;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[category];
  return <Icon size={size} weight="regular" aria-hidden className={className} />;
}

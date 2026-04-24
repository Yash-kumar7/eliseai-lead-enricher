import type { Tier } from "@eliseai/shared";
import clsx from "clsx";

const CONFIG: Record<Tier, { chip: string; dot: string }> = {
  Hot:  { chip: "chip-hot",  dot: "bg-red-500 dark:bg-red-400" },
  Warm: { chip: "chip-warm", dot: "bg-amber-500 dark:bg-amber-400" },
  Cold: { chip: "chip-cold", dot: "bg-slate-400 dark:bg-zinc-500" },
};

export function TierChip({ tier }: { tier: Tier }) {
  const { chip, dot } = CONFIG[tier];
  return (
    <span className={clsx(chip)}>
      <span className={clsx("w-1.5 h-1.5 rounded-full inline-block", dot)} aria-hidden="true" />
      {tier}
    </span>
  );
}

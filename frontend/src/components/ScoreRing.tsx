import type { Tier } from "@eliseai/shared";

const RING_CLASSES: Record<Tier, { track: string; fg: string }> = {
  Hot:  { track: "stroke-red-100 dark:stroke-red-950",     fg: "stroke-red-500 dark:stroke-red-400" },
  Warm: { track: "stroke-amber-100 dark:stroke-amber-950", fg: "stroke-amber-500 dark:stroke-amber-400" },
  Cold: { track: "stroke-slate-200 dark:stroke-zinc-800",  fg: "stroke-slate-500 dark:stroke-zinc-500" },
};

interface Props {
  score: number;
  tier: Tier;
  /** Outer SVG size in px. Default 68. */
  size?: number;
  /** Stroke width in px. Default 6. */
  strokeWidth?: number;
}

export function ScoreRing({ score, tier, size = 68, strokeWidth = 6 }: Props) {
  const radius = (size - strokeWidth) / 2 - 1;
  const center = size / 2;
  const circ = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circ * (1 - clamped / 100);
  const { track, fg } = RING_CLASSES[tier];
  const fontSize = size <= 52 ? "text-sm" : "text-base";

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score ${score} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={strokeWidth} className={track} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className={fg}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <span className={`absolute mono ${fontSize} font-bold text-slate-900 dark:text-zinc-100`}>{score}</span>
    </div>
  );
}

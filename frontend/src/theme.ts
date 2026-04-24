/**
 * Single source of truth for design tokens used inline (via `style={...}`).
 *
 * Why inline? Tailwind JIT can miss arbitrary color classes from its build
 * when the config changes, so critical brand + semantic colors are applied
 * via inline style to guarantee they render. Everything else stays in Tailwind.
 */

export const COLOR = {
  brand: "#7638fa",
  brandHover: "#5627ba",
  ink: "#181819",

  slate: "#64748b",
  blue: "#2563eb",
  amber: "#d97706",
  emerald: "#059669",
  rose: "#e11d48",
} as const;

export type ColorKey = keyof typeof COLOR;

/**
 * 10% alpha variant of any COLOR token (for icon tile backgrounds).
 * `#rrggbb` → `#rrggbb1a` (hex alpha channel, 1a = 10.2%).
 */
export function tint(hex: string): string {
  return `${hex}1a`;
}

/**
 * 25% alpha, used for decorative step numbers.
 */
export function tintStrong(hex: string): string {
  return `${hex}40`;
}

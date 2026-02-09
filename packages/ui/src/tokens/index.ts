export { colors } from "./colors.js";
export { spacing } from "./spacing.js";
export { fontFamily, fontSize } from "./typography.js";
export { shadows } from "./shadows.js";
export { zIndex } from "./z-index.js";

export const radii = {
  none: "0",
  sm: "calc(var(--radius) - 4px)",
  md: "calc(var(--radius) - 2px)",
  lg: "var(--radius)",
  xl: "calc(var(--radius) + 4px)",
  full: "9999px",
} as const;

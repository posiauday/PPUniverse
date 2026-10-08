import type { ReactNode } from "react";

/**
 * What a component's web replica gives the page (MVP-049): the live preview,
 * the playground's controls, a way to apply a variation's settings, and a
 * small static picture for the variations gallery.
 */
export interface ReplicaApi {
  /** The working component on the preview stage. */
  stage: (dark: boolean) => ReactNode;
  /** The playground: a control for every kind of property. */
  controls: ReactNode;
  /** Applies a variation: input name -> Power Fx formula. */
  apply: (settings: Record<string, string>) => void;
  /** A non-interactive picture of the component with these settings. */
  thumbnail: (settings: Record<string, string>, dark: boolean) => ReactNode;
}

/**
 * Reads the simple Power Fx values variations use: a text literal ("Save"),
 * true or false, or a number. Anything else comes back as its source text.
 */
export function fromPowerFx(formula: string): string | number | boolean {
  const value = formula.trim().replace(/^=/, "");
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  const text = value.match(/^"((?:[^"]|"")*)"$/);
  if (text) return text[1]!.replace(/""/g, '"');
  return value;
}

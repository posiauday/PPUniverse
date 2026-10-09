import type { ReactNode } from "react";

/**
 * What a component's web replica gives its page (MVP-049; docs/final-decisions.md,
 * 2026-10-08, "One live view"): the component on a screen, behaving exactly as it
 * does in Power Apps after it's pasted, and a way to load a variation's inputs.
 */
export interface ReplicaApi {
  /** The component, plus the few screen controls the preview wires to it (a button that opens a dialog). */
  screen: ReactNode;
  /** Back to the component's defaults, as if pasted again, then these inputs (input name -> Power Fx). */
  apply: (settings: Record<string, string>) => void;
  /** True when the component's Theme input is "Dark", so the screen's Fill is dark too. */
  dark: boolean;
  /** The screen's formulas beyond the inputs: what a maker writes in Studio to try it the same way. */
  wiring: readonly Wiring[];
  /**
   * A whole-screen component (the Navigation shell): the screen shows it edge to
   * edge, as in an app, instead of centred with room around it like a button.
   */
  fill?: boolean;
}

export interface Wiring {
  control: string;
  property: string;
  formula: string;
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

/** Segoe UI, as Power Apps renders text. */
export const SEGOE = '[font-family:"Segoe_UI",system-ui,sans-serif]';

/** RGBA(15, 108, 189, 1) or ColorValue("#7C3AED") as a CSS colour; anything else gives the fallback. */
export function cssColor(formula: string, fallback: string): string {
  const rgba = formula.match(/RGBA\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i);
  if (rgba) return `rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${rgba[4]})`;
  const hex = formula.match(/ColorValue\(\s*"(#[0-9a-f]{3,8})"\s*\)/i);
  return hex ? hex[1]! : fallback;
}

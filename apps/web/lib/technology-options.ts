import { TECHNOLOGIES } from "@ppu/domain-content";

/** The admin editor's Technology choices (MVP-028), from the one registry in @ppu/domain-content. */
export const TECHNOLOGY_OPTIONS: ReadonlyArray<{ value: string; label: string }> = TECHNOLOGIES.map(
  (entry) => ({ value: entry.technology, label: entry.name }),
);

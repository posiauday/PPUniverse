import { AREAS, TECHNOLOGY_TOPICS, isValidTechnology } from "@ppu/domain-content";

/** The admin editor's Technology choices (MVP-028; Governance & admin added by
 * MVP-033), from the one registry in @ppu/domain-content. */
export const TECHNOLOGY_OPTIONS: ReadonlyArray<{ value: string; label: string }> = AREAS.map(
  (entry) => ({ value: entry.technology, label: entry.name }),
);

/** The hub sections an article in `technology` can be placed in (MVP-033);
 * none when no technology is chosen. */
export function topicOptions(technology: string): ReadonlyArray<{ value: string; label: string }> {
  if (!isValidTechnology(technology)) return [];
  return TECHNOLOGY_TOPICS[technology].map((topic) => ({ value: topic.id, label: topic.name }));
}

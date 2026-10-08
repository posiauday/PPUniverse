import {
  LESSON_SECTIONS,
  lessonSection,
  parseKnowledgeChecks,
  type KnowledgeQuestion,
} from "@ppu/domain-content";

/**
 * A lesson body as the lesson page draws it (MVP-048, the Workspace design):
 * its fixed sections in order, each with a page id for "On this page", and
 * the "Check yourself" questions parsed out so the page can draw them as an
 * interactive knowledge check instead of a quote block.
 *
 * The section ids contain an underscore, which the Markdown renderer's
 * heading slugs never do, so a heading inside a section can't collide.
 */

export type LessonSectionTitle = (typeof LESSON_SECTIONS)[number];

export interface LessonViewSection {
  id: string;
  title: LessonSectionTitle;
  /** The section's Markdown, without its "## " heading. Empty for "Check yourself". */
  markdown: string;
}

export interface LessonView {
  sections: LessonViewSection[];
  checks: KnowledgeQuestion[];
}

export const sectionId = (title: string) =>
  `lesson_${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

export function lessonView(body: string): LessonView {
  return {
    sections: LESSON_SECTIONS.map((title) => ({
      id: sectionId(title),
      title,
      markdown: title === "Check yourself" ? "" : lessonSection(body, title),
    })),
    checks: parseKnowledgeChecks(lessonSection(body, "Check yourself")),
  };
}

/** The lesson after and before `position` among a topic's published lessons. */
export function neighbours<T extends { position: number }>(
  lessons: readonly T[],
  position: number,
): { previous: T | null; next: T | null } {
  const index = lessons.findIndex((lesson) => lesson.position === position);
  return {
    previous: index > 0 ? (lessons[index - 1] ?? null) : null,
    next: index >= 0 && index < lessons.length - 1 ? (lessons[index + 1] ?? null) : null,
  };
}

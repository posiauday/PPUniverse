import { isValidArticleSlug } from "./transitions.js";
import type { ArticleStatus, Technology } from "./types.js";

/**
 * The Learn module (MVP-048; docs/final-decisions.md, 2026-10-07, "Comments
 * wording, admin panel, speed check and the Learn module" (4) and "Learn
 * module design: Workspace"; docs/plans/learn-module.md). A topic is a short
 * series of 3 to 6 lessons that explains how something works, at
 * /topics/<topic>/<lesson>. Guides answer "how do I fix this?"; lessons answer
 * "how does this actually work?".
 *
 * Every lesson has the same fixed shape so it is easy to scan: the outcomes
 * ("What you'll understand", front matter), then these sections, in order, as
 * Markdown "## " headings (LESSON_SECTIONS). "Check yourself" holds 2 or 3
 * knowledge-check questions, each with an explanation for every answer and no
 * penalty (Microsoft Learn's authoring rules: multiple choice, never "all of
 * the above"), written as:
 *
 *   > [!CHECK] Does Today() stop a filter delegating?
 *   > - [ ] Yes
 *   >   It doesn't depend on the row, so it's worked out first.
 *   > - [x] No
 *   >   Correct: it's sent to the source as a plain value.
 *
 * Same lifecycle as guides: created DRAFT, published by the product owner,
 * publishedAt set once and never rewritten, each publish an audit event. A
 * lesson is public only when it and its topic are both PUBLISHED.
 */

export type LearnStatus = ArticleStatus;

export interface TopicRecord {
  id: string;
  /** Unique, URL-safe: /topics/<slug>, and the importer's key. */
  slug: string;
  title: string;
  /** One or two sentences: what the topic explains and for whom. Plain text. */
  summary: string;
  /** The area it belongs to (one of the six technologies, or Governance & admin). */
  technology: Technology;
  /** Order among the area's topics, lowest first. */
  sortOrder: number;
  status: LearnStatus;
  publishedAt: Date | null;
  authorUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TopicInput {
  slug: string;
  title: string;
  summary: string;
  technology: Technology;
  sortOrder: number;
}

export interface TopicCreateInput extends TopicInput {
  authorUserId: string;
}

export interface LessonRecord {
  id: string;
  topicId: string;
  /** URL-safe, unique within its topic: /topics/<topic>/<slug>. */
  slug: string;
  /** 1-based place in the topic. Unique within the topic. */
  position: number;
  title: string;
  /** Reading time, in minutes. */
  minutes: number;
  /** "What you'll understand": 2 or 3 short outcomes. */
  outcomes: string[];
  /** Markdown in the fixed lesson shape. Never rendered as raw HTML. */
  body: string;
  /** When the lesson was last checked against its sources; null if never. */
  checkedOn: Date | null;
  status: LearnStatus;
  publishedAt: Date | null;
  authorUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonInput {
  slug: string;
  position: number;
  title: string;
  minutes: number;
  outcomes: string[];
  body: string;
  checkedOn: Date | null;
}

export interface LessonCreateInput extends LessonInput {
  topicId: string;
  authorUserId: string;
}

/** A topic with all its lessons, every status, in order: the admin list. */
export interface TopicWithLessons extends TopicRecord {
  lessons: LessonRecord[];
}

/** A PUBLISHED lesson as a topic's lesson list needs it. */
export interface PublishedLessonSummary {
  slug: string;
  position: number;
  title: string;
  minutes: number;
  publishedAt: Date;
}

/** A PUBLISHED topic with its PUBLISHED lessons, in order. */
export interface PublishedTopic {
  id: string;
  slug: string;
  title: string;
  summary: string;
  technology: Technology;
  sortOrder: number;
  publishedAt: Date;
  updatedAt: Date;
  lessons: PublishedLessonSummary[];
}

/** A PUBLISHED lesson, with what its page shows. */
export interface PublishedLesson {
  slug: string;
  position: number;
  title: string;
  minutes: number;
  outcomes: string[];
  body: string;
  checkedOn: Date | null;
  publishedAt: Date;
  updatedAt: Date;
}

export interface LearnRepository {
  createTopic(input: TopicCreateInput): Promise<TopicRecord>;
  /** Content-only edit: never changes status or publishedAt. */
  updateTopic(id: string, input: TopicInput): Promise<TopicRecord>;
  /** DRAFT -> PUBLISHED with an audit event, atomically. Throws if already PUBLISHED. */
  publishTopic(id: string, actorUserId: string): Promise<TopicRecord>;
  createLesson(input: LessonCreateInput): Promise<LessonRecord>;
  /** Content-only edit: never changes status, publishedAt or topic. */
  updateLesson(id: string, input: LessonInput): Promise<LessonRecord>;
  /** DRAFT -> PUBLISHED with an audit event, atomically. Throws if already PUBLISHED. */
  publishLesson(id: string, actorUserId: string): Promise<LessonRecord>;
  findTopicById(id: string): Promise<TopicRecord | null>;
  findTopicBySlug(slug: string): Promise<TopicRecord | null>;
  findLessonById(id: string): Promise<LessonRecord | null>;
  findLesson(topicId: string, slug: string): Promise<LessonRecord | null>;
  /** One topic with all its lessons, every status, in order: the admin editor. */
  findTopicWithLessons(id: string): Promise<TopicWithLessons | null>;
  /** Every topic and lesson, every status: the admin list. */
  listTopics(): Promise<TopicWithLessons[]>;
  /** PUBLISHED topics with their PUBLISHED lessons, by area order; optionally one area. */
  listPublishedTopics(options?: { technology?: Technology }): Promise<PublishedTopic[]>;
  findPublishedTopic(slug: string): Promise<PublishedTopic | null>;
  findPublishedLesson(
    topicSlug: string,
    lessonSlug: string,
  ): Promise<{ topic: PublishedTopic; lesson: PublishedLesson } | null>;
}

export const TOPIC_TITLE_MAX = 120;
export const TOPIC_SUMMARY_MAX = 300;
export const TOPIC_SORT_ORDER_MAX = 999;
export const LESSON_TITLE_MAX = 120;
export const LESSON_MINUTES_MAX = 60;
export const LESSON_POSITION_MAX = 6;
export const TOPIC_LESSONS_MIN = 3;
export const LESSON_OUTCOMES_MIN = 2;
export const LESSON_OUTCOMES_MAX = 3;
export const LESSON_OUTCOME_MAX = 140;
export const LESSON_CHECKS_MIN = 2;
export const LESSON_CHECKS_MAX = 3;

/** The fixed lesson shape: its "## " sections, in this order. */
export const LESSON_SECTIONS = [
  "The idea",
  "How it works",
  "The important things",
  "Try it",
  "Check yourself",
  "Sources",
] as const;

const blank = (value: string) => value.trim().length === 0;

export const isValidTopicSlug = isValidArticleSlug;
export const isValidLessonSlug = isValidArticleSlug;

export function isValidTopicTitle(value: string): boolean {
  return !blank(value) && value.length <= TOPIC_TITLE_MAX;
}

export function isValidTopicSummary(value: string): boolean {
  return !blank(value) && value.length <= TOPIC_SUMMARY_MAX;
}

export function isValidSortOrder(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= TOPIC_SORT_ORDER_MAX;
}

export function isValidLessonTitle(value: string): boolean {
  return !blank(value) && value.length <= LESSON_TITLE_MAX;
}

export function isValidLessonMinutes(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= LESSON_MINUTES_MAX;
}

export function isValidLessonPosition(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= LESSON_POSITION_MAX;
}

export function isValidLessonOutcomes(values: readonly string[]): boolean {
  return (
    values.length >= LESSON_OUTCOMES_MIN &&
    values.length <= LESSON_OUTCOMES_MAX &&
    values.every((value) => !blank(value) && value.length <= LESSON_OUTCOME_MAX)
  );
}

export interface KnowledgeOption {
  text: string;
  correct: boolean;
  /** Why this answer is right or wrong. Shown after answering. */
  why: string;
}

export interface KnowledgeQuestion {
  prompt: string;
  options: KnowledgeOption[];
}

const CHECK_START = /^>\s*\[!CHECK\]\s*(.*)$/;
const OPTION = /^>\s*-\s*\[( |x|X)\]\s*(.*)$/;
const EXPLANATION = /^>\s{2,}(\S.*)$/;
const CATCH_ALL = /\b(all|none) of the above\b/i;

/**
 * The knowledge-check questions in a lesson body, in order. Each is a quote
 * block opened by "> [!CHECK] <question>", with "> - [x] <answer>" (right) or
 * "> - [ ] <answer>" (wrong) options, each followed by an indented explanation
 * line. Returns the questions as written; problems are reported by
 * knowledgeCheckProblems.
 */
export function parseKnowledgeChecks(body: string): KnowledgeQuestion[] {
  const questions: KnowledgeQuestion[] = [];
  let current: KnowledgeQuestion | null = null;
  for (const raw of body.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const start = line.match(CHECK_START);
    if (start) {
      current = { prompt: (start[1] as string).trim(), options: [] };
      questions.push(current);
      continue;
    }
    if (!current) continue;
    if (!line.startsWith(">")) {
      current = null;
      continue;
    }
    const option = line.match(OPTION);
    if (option) {
      current.options.push({
        text: (option[2] as string).trim(),
        correct: option[1] !== " ",
        why: "",
      });
      continue;
    }
    const explanation = line.match(EXPLANATION);
    const last = current.options[current.options.length - 1];
    if (explanation && last) {
      last.why = last.why ? `${last.why} ${(explanation[1] as string).trim()}` : (explanation[1] as string).trim();
    }
  }
  return questions;
}

/** What is wrong with one knowledge-check question; empty when it is fine. */
export function knowledgeCheckProblems(question: KnowledgeQuestion): string[] {
  const problems: string[] = [];
  const label = question.prompt ? `"${question.prompt}"` : "a question";
  if (blank(question.prompt)) problems.push("a knowledge check has no question");
  if (question.options.length < 2 || question.options.length > 4)
    problems.push(`${label} needs 2 to 4 answers`);
  if (question.options.filter((option) => option.correct).length !== 1)
    problems.push(`${label} needs exactly one right answer, marked [x]`);
  if (question.options.some((option) => blank(option.text)))
    problems.push(`${label} has an empty answer`);
  if (question.options.some((option) => blank(option.why)))
    problems.push(`${label} needs an explanation under every answer`);
  if (question.options.some((option) => CATCH_ALL.test(option.text)))
    problems.push(`${label} uses "all/none of the above"; write a real answer instead`);
  return problems;
}

/** The "## " headings of a Markdown body, in order (fenced code is skipped). */
function sectionHeadings(body: string): { title: string; start: number; end: number }[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const found: { title: string; line: number }[] = [];
  let fenced = false;
  lines.forEach((line, index) => {
    if (/^\s*```/.test(line)) fenced = !fenced;
    const match = !fenced && line.match(/^##\s+(.+?)\s*#*\s*$/);
    if (match) found.push({ title: match[1] as string, line: index });
  });
  return found.map((heading, index) => ({
    title: heading.title,
    start: heading.line + 1,
    end: index + 1 < found.length ? (found[index + 1] as { line: number }).line : lines.length,
  }));
}

/** The text of one "## " section of a body, or "" if it has none. */
export function lessonSection(body: string, title: (typeof LESSON_SECTIONS)[number]): string {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const section = sectionHeadings(body).find((heading) => heading.title === title);
  return section ? lines.slice(section.start, section.end).join("\n").trim() : "";
}

/**
 * What stops a lesson body from following the fixed shape; empty when it is
 * fine. Checked by the importer, the content gate and the admin editor, so
 * every published lesson renders the same way.
 */
export function lessonBodyProblems(body: string): string[] {
  const problems: string[] = [];
  const titles = sectionHeadings(body).map((heading) => heading.title);
  const expected = LESSON_SECTIONS as readonly string[];
  if (titles.join("\n") !== expected.join("\n")) {
    problems.push(
      `the body's "## " sections must be exactly, in order: ${expected.join(", ")} (found: ${titles.join(", ") || "none"})`,
    );
  }
  const all = parseKnowledgeChecks(body);
  const inCheck = parseKnowledgeChecks(lessonSection(body, "Check yourself"));
  if (all.length !== inCheck.length)
    problems.push('knowledge checks belong in the "Check yourself" section only');
  if (inCheck.length < LESSON_CHECKS_MIN || inCheck.length > LESSON_CHECKS_MAX)
    problems.push(
      `"Check yourself" needs ${LESSON_CHECKS_MIN} or ${LESSON_CHECKS_MAX} knowledge-check questions`,
    );
  for (const question of all) problems.push(...knowledgeCheckProblems(question));
  if (!/\]\(https:\/\/learn\.microsoft\.com\//.test(lessonSection(body, "Sources")))
    problems.push('"Sources" needs at least one link to a learn.microsoft.com page');
  return problems;
}

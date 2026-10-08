import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LESSON_POSITION_MAX,
  TOPIC_LESSONS_MIN,
  parseLessonSource,
  parseTopicSource,
  technologyInfo,
} from "@ppu/domain-content";
import { describe, expect, it } from "vitest";

/**
 * The Learn content gate (MVP-048): every topic in content/topics must be
 * importable. A topic folder sits in its area's folder and is named after its
 * slug; its topic.md and every lesson parse and pass the admin editor's
 * validators (including the fixed lesson shape and the knowledge-check
 * rules); lessons are named <position>-<slug>.md and numbered 1, 2, 3...
 * with no gaps; a topic has 3 to 6 lessons; and topic slugs are unique.
 * Runs in CI, so a broken lesson fails the build before it can be imported.
 */

const ROOT = fileURLToPath(new URL("../../../../content/topics/", import.meta.url));
const dirs = (path: string) =>
  existsSync(path) ? readdirSync(path).filter((name) => statSync(join(path, name)).isDirectory()) : [];

function problemsIn(area: string, folder: string): string[] {
  const path = join(ROOT, area, folder);
  const problems: string[] = [];
  const topicFile = join(path, "topic.md");
  if (!existsSync(topicFile)) return [`${area}/${folder}: missing topic.md`];
  const topic = parseTopicSource(readFileSync(topicFile, "utf8"));
  if (!topic.ok) return topic.errors.map((error) => `${area}/${folder}/topic.md: ${error}`);
  if (folder !== topic.topic.slug)
    problems.push(`${area}/${folder}: the folder must be named after the slug, ${topic.topic.slug}`);
  if (area !== technologyInfo(topic.topic.technology).slug)
    problems.push(`${area}/${folder}: belongs in content/topics/${technologyInfo(topic.topic.technology).slug}`);

  const positions: number[] = [];
  const files = readdirSync(path).filter((name) => name.endsWith(".md") && name !== "topic.md");
  for (const file of files) {
    const lesson = parseLessonSource(readFileSync(join(path, file), "utf8"));
    if (!lesson.ok) {
      problems.push(...lesson.errors.map((error) => `${area}/${folder}/${file}: ${error}`));
      continue;
    }
    const expected = `${lesson.lesson.position}-${lesson.lesson.slug}.md`;
    if (file !== expected) problems.push(`${area}/${folder}/${file}: name it ${expected}`);
    positions.push(lesson.lesson.position);
  }
  const sorted = [...positions].sort((a, b) => a - b);
  if (sorted.some((position, index) => position !== index + 1))
    problems.push(`${area}/${folder}: lesson positions must be 1, 2, 3... with no gaps or repeats`);
  if (files.length < TOPIC_LESSONS_MIN || files.length > LESSON_POSITION_MAX)
    problems.push(`${area}/${folder}: a topic has ${TOPIC_LESSONS_MIN} to ${LESSON_POSITION_MAX} lessons`);
  return problems;
}

describe("content/topics", () => {
  const topics = dirs(ROOT).flatMap((area) => dirs(join(ROOT, area)).map((folder) => ({ area, folder })));

  it("every topic and lesson is valid, importable and in the right place", () => {
    const problems = topics.flatMap(({ area, folder }) => problemsIn(area, folder));
    expect(problems).toEqual([]);
  });

  it("topic slugs are unique", () => {
    const slugs = topics.map(({ folder }) => folder);
    expect(slugs.filter((slug, index) => slugs.indexOf(slug) !== index)).toEqual([]);
  });
});

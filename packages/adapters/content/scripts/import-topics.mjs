// Imports the drafted Learn topics and lessons (content/topics) as DRAFTS (MVP-048).
//
//   DATABASE_URL=... ARTICLE_AUTHOR_EMAIL=you@example.com \
//     pnpm --filter @ppu/adapter-content topics:import
//
// The same rules as content:import and updates:import:
// - Every file is validated first; if any is invalid, nothing is imported.
// - A topic whose slug already exists is skipped, never overwritten; so is a
//   lesson whose slug already exists in its topic. New lessons are added to
//   an existing topic, so a topic can grow one release at a time.
// - Everything is created as DRAFT, authored by ARTICLE_AUTHOR_EMAIL (an
//   existing ADMIN). The product owner reviews and publishes in the admin.
//
// Layout: content/topics/<area>/<topic-slug>/topic.md, plus one
// <position>-<lesson-slug>.md per lesson (see content/topics/README.md).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "@ppu/db";
import { parseLessonSource, parseTopicSource } from "@ppu/domain-content";
import { PrismaLearnRepository } from "../dist/index.js";

const root = fileURLToPath(new URL("../../../../content/topics/", import.meta.url));
const authorEmail = process.env.ARTICLE_AUTHOR_EMAIL;

const dirs = (path) => readdirSync(path).filter((name) => statSync(join(path, name)).isDirectory());

/** Every topic folder with its parsed topic.md and lesson files. */
function readTopics() {
  const topics = [];
  for (const area of dirs(root)) {
    for (const folder of dirs(join(root, area))) {
      const path = join(root, area, folder);
      const name = `${area}/${folder}`;
      const topicFile = join(path, "topic.md");
      const topic = statSync(topicFile, { throwIfNoEntry: false })
        ? parseTopicSource(readFileSync(topicFile, "utf8"))
        : { ok: false, errors: ["missing topic.md"] };
      const lessons = readdirSync(path)
        .filter((file) => file.endsWith(".md") && file !== "topic.md")
        .map((file) => ({
          name: `${name}/${file}`,
          result: parseLessonSource(readFileSync(join(path, file), "utf8")),
        }));
      topics.push({ name: `${name}/topic.md`, result: topic, lessons });
    }
  }
  return topics;
}

async function main() {
  if (!authorEmail) throw new Error("Set ARTICLE_AUTHOR_EMAIL to an existing ADMIN user's email.");
  const author = await prisma.user.findUnique({ where: { email: authorEmail } });
  if (!author || author.role !== "ADMIN")
    throw new Error(`${authorEmail} is not an existing ADMIN user.`);

  if (!statSync(root, { throwIfNoEntry: false })) {
    console.log("No content/topics folder: nothing to import.");
    return;
  }
  const topics = readTopics();
  const invalid = topics.flatMap((topic) => [topic, ...topic.lessons]).filter((entry) => !entry.result.ok);
  if (invalid.length > 0) {
    for (const entry of invalid) console.error(`${entry.name}: ${entry.result.errors.join("; ")}`);
    throw new Error(`${invalid.length} invalid topic or lesson file(s); nothing was imported.`);
  }

  const repository = new PrismaLearnRepository(prisma);
  const counts = { topics: 0, lessons: 0, skipped: 0 };
  for (const entry of topics) {
    let topic = await repository.findTopicBySlug(entry.result.topic.slug);
    if (topic) {
      console.log(`skipped topic (already exists): ${entry.name}`);
      counts.skipped += 1;
    } else {
      topic = await repository.createTopic({ ...entry.result.topic, authorUserId: author.id });
      console.log(`created draft topic: ${entry.name}`);
      counts.topics += 1;
    }
    for (const lesson of entry.lessons) {
      if (await repository.findLesson(topic.id, lesson.result.lesson.slug)) {
        console.log(`skipped lesson (already exists): ${lesson.name}`);
        counts.skipped += 1;
        continue;
      }
      await repository.createLesson({ ...lesson.result.lesson, topicId: topic.id, authorUserId: author.id });
      console.log(`created draft lesson: ${lesson.name}`);
      counts.lessons += 1;
    }
  }
  console.log(
    `Done: ${counts.topics} topic(s) and ${counts.lessons} lesson(s) created as drafts, ` +
      `${counts.skipped} skipped. Review and publish them in the admin.`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

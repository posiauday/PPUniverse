import type { PrismaClient } from "@ppu/db";
import {
  isValidArticleStatusTransition,
  type TopicProgress,
  type LearnRepository,
  type LearnStatus,
  type LessonCreateInput,
  type LessonInput,
  type LessonRecord,
  type PublishedLesson,
  type PublishedTopic,
  type Technology,
  type TopicCreateInput,
  type TopicInput,
  type TopicRecord,
  type TopicWithLessons,
} from "@ppu/domain-content";

/**
 * Learn topics and lessons (MVP-048) against Prisma. The same rules as
 * PrismaUpdateRepository: created DRAFT, content edits never touch status or
 * publishedAt, and publishing is one transaction that also appends the audit
 * event. Public reads return a lesson only when it and its topic are both
 * PUBLISHED.
 */
export class PrismaLearnRepository implements LearnRepository {
  constructor(private readonly db: PrismaClient) {}

  async createTopic(input: TopicCreateInput): Promise<TopicRecord> {
    return toTopic(await this.db.learnTopic.create({ data: { ...input } }));
  }

  async updateTopic(id: string, input: TopicInput): Promise<TopicRecord> {
    const row = await this.db.learnTopic.update({
      where: { id },
      data: {
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        technology: input.technology,
        sortOrder: input.sortOrder,
      },
    });
    return toTopic(row);
  }

  async publishTopic(id: string, actorUserId: string): Promise<TopicRecord> {
    const publishedAt = new Date();
    const row = await this.db.$transaction(async (tx) => {
      const current = await tx.learnTopic.findUnique({ where: { id } });
      if (!current) throw new Error(`Topic ${id} not found`);
      if (!isValidArticleStatusTransition(current.status as LearnStatus, "PUBLISHED")) {
        throw new Error(`Cannot publish a topic in status ${current.status}`);
      }
      const updated = await tx.learnTopic.update({
        where: { id },
        data: { status: "PUBLISHED", publishedAt },
      });
      await tx.learnPublishEvent.create({
        data: { topicId: id, lessonId: null, actorUserId, action: "PUBLISHED" },
      });
      return updated;
    });
    return toTopic(row);
  }

  async createLesson(input: LessonCreateInput): Promise<LessonRecord> {
    return toLesson(await this.db.learnLesson.create({ data: { ...input } }));
  }

  async updateLesson(id: string, input: LessonInput): Promise<LessonRecord> {
    const row = await this.db.learnLesson.update({
      where: { id },
      data: {
        slug: input.slug,
        position: input.position,
        title: input.title,
        minutes: input.minutes,
        outcomes: input.outcomes,
        body: input.body,
        checkedOn: input.checkedOn,
      },
    });
    return toLesson(row);
  }

  async publishLesson(id: string, actorUserId: string): Promise<LessonRecord> {
    const publishedAt = new Date();
    const row = await this.db.$transaction(async (tx) => {
      const current = await tx.learnLesson.findUnique({ where: { id } });
      if (!current) throw new Error(`Lesson ${id} not found`);
      if (!isValidArticleStatusTransition(current.status as LearnStatus, "PUBLISHED")) {
        throw new Error(`Cannot publish a lesson in status ${current.status}`);
      }
      const updated = await tx.learnLesson.update({
        where: { id },
        data: { status: "PUBLISHED", publishedAt },
      });
      await tx.learnPublishEvent.create({
        data: { topicId: current.topicId, lessonId: id, actorUserId, action: "PUBLISHED" },
      });
      return updated;
    });
    return toLesson(row);
  }

  async findTopicById(id: string): Promise<TopicRecord | null> {
    const row = await this.db.learnTopic.findUnique({ where: { id } });
    return row ? toTopic(row) : null;
  }

  async findTopicBySlug(slug: string): Promise<TopicRecord | null> {
    const row = await this.db.learnTopic.findUnique({ where: { slug } });
    return row ? toTopic(row) : null;
  }

  async findLessonById(id: string): Promise<LessonRecord | null> {
    const row = await this.db.learnLesson.findUnique({ where: { id } });
    return row ? toLesson(row) : null;
  }

  async findLesson(topicId: string, slug: string): Promise<LessonRecord | null> {
    const row = await this.db.learnLesson.findUnique({
      where: { topicId_slug: { topicId, slug } },
    });
    return row ? toLesson(row) : null;
  }

  async findTopicWithLessons(id: string): Promise<TopicWithLessons | null> {
    const row = await this.db.learnTopic.findUnique({
      where: { id },
      include: { lessons: { orderBy: { position: "asc" } } },
    });
    return row ? { ...toTopic(row), lessons: row.lessons.map(toLesson) } : null;
  }

  async listTopics(): Promise<TopicWithLessons[]> {
    const rows = await this.db.learnTopic.findMany({
      orderBy: [{ technology: "asc" }, { sortOrder: "asc" }, { slug: "asc" }],
      include: { lessons: { orderBy: { position: "asc" } } },
    });
    return rows.map((row) => ({ ...toTopic(row), lessons: row.lessons.map(toLesson) }));
  }

  async listPublishedTopics(options: { technology?: Technology } = {}): Promise<PublishedTopic[]> {
    const rows = await this.db.learnTopic.findMany({
      where: {
        status: "PUBLISHED",
        ...(options.technology ? { technology: options.technology } : {}),
      },
      orderBy: [{ technology: "asc" }, { sortOrder: "asc" }, { slug: "asc" }],
      include: publishedLessons,
    });
    return rows.map(toPublishedTopic);
  }

  async findPublishedTopic(slug: string): Promise<PublishedTopic | null> {
    const row = await this.db.learnTopic.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: publishedLessons,
    });
    return row ? toPublishedTopic(row) : null;
  }

  async findPublishedLesson(
    topicSlug: string,
    lessonSlug: string,
  ): Promise<{ topic: PublishedTopic; lesson: PublishedLesson } | null> {
    const topic = await this.findPublishedTopic(topicSlug);
    if (!topic) return null;
    const row = await this.db.learnLesson.findFirst({
      where: { topicId: topic.id, slug: lessonSlug, status: "PUBLISHED" },
    });
    if (!row) return null;
    return {
      topic,
      lesson: {
        slug: row.slug,
        position: row.position,
        title: row.title,
        minutes: row.minutes,
        outcomes: row.outcomes,
        body: row.body,
        checkedOn: row.checkedOn,
        // PUBLISHED rows always have publishedAt set.
        publishedAt: row.publishedAt as Date,
        updatedAt: row.updatedAt,
      },
    };
  }

  async findPublishedLessonId(topicSlug: string, lessonSlug: string): Promise<string | null> {
    const row = await this.db.learnLesson.findFirst({
      where: { slug: lessonSlug, status: "PUBLISHED", topic: { slug: topicSlug, status: "PUBLISHED" } },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async setLessonDone(userId: string, lessonId: string, done: boolean): Promise<void> {
    if (done) {
      await this.db.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        create: { userId, lessonId },
        update: {},
      });
    } else {
      await this.db.lessonProgress.deleteMany({ where: { userId, lessonId } });
    }
  }

  async listDoneLessonSlugs(userId: string, topicSlug: string): Promise<string[]> {
    const rows = await this.db.lessonProgress.findMany({
      where: { userId, lesson: { topic: { slug: topicSlug } } },
      select: { lesson: { select: { slug: true } } },
    });
    return rows.map((row) => row.lesson.slug);
  }

  async listProgress(userId: string): Promise<TopicProgress[]> {
    const rows = await this.db.learnTopic.findMany({
      where: {
        status: "PUBLISHED",
        lessons: { some: { status: "PUBLISHED", progress: { some: { userId } } } },
      },
      orderBy: [{ technology: "asc" }, { sortOrder: "asc" }, { slug: "asc" }],
      select: {
        slug: true,
        title: true,
        lessons: {
          where: { status: "PUBLISHED" },
          select: { progress: { where: { userId }, select: { id: true } } },
        },
      },
    });
    return rows.map((row) => ({
      topicSlug: row.slug,
      topicTitle: row.title,
      done: row.lessons.filter((lesson) => lesson.progress.length > 0).length,
      total: row.lessons.length,
    }));
  }

  async clearProgress(userId: string): Promise<void> {
    await this.db.lessonProgress.deleteMany({ where: { userId } });
  }
}

const publishedLessons = {
  lessons: {
    where: { status: "PUBLISHED" as const },
    orderBy: { position: "asc" as const },
    select: {
      slug: true,
      position: true,
      title: true,
      minutes: true,
      publishedAt: true,
      updatedAt: true,
    },
  },
};

interface TopicRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  technology: string;
  sortOrder: number;
  status: string;
  publishedAt: Date | null;
  authorUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

function toTopic(row: TopicRow): TopicRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    technology: row.technology as Technology,
    sortOrder: row.sortOrder,
    status: row.status as LearnStatus,
    publishedAt: row.publishedAt,
    authorUserId: row.authorUserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toPublishedTopic(
  row: TopicRow & {
    lessons: {
      slug: string;
      position: number;
      title: string;
      minutes: number;
      publishedAt: Date | null;
      updatedAt: Date;
    }[];
  },
): PublishedTopic {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    technology: row.technology as Technology,
    sortOrder: row.sortOrder,
    publishedAt: row.publishedAt as Date,
    updatedAt: row.updatedAt,
    lessons: row.lessons.map((lesson) => ({ ...lesson, publishedAt: lesson.publishedAt as Date })),
  };
}

function toLesson(row: {
  id: string;
  topicId: string;
  slug: string;
  position: number;
  title: string;
  minutes: number;
  outcomes: string[];
  body: string;
  checkedOn: Date | null;
  status: string;
  publishedAt: Date | null;
  authorUserId: string;
  createdAt: Date;
  updatedAt: Date;
}): LessonRecord {
  return {
    id: row.id,
    topicId: row.topicId,
    slug: row.slug,
    position: row.position,
    title: row.title,
    minutes: row.minutes,
    outcomes: row.outcomes,
    body: row.body,
    checkedOn: row.checkedOn,
    status: row.status as LearnStatus,
    publishedAt: row.publishedAt,
    authorUserId: row.authorUserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

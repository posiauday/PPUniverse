import { logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import { currentUserId } from "../../../../lib/comments";
import { learnEnabled } from "../../../../lib/feature-flags";
import { learnRepository } from "../../../../lib/learn";
import { withObservability } from "../../../../lib/observability";
import { noStore, readFields } from "../../../../lib/request-guards";

/**
 * A signed-in reader's Learn progress (MVP-048; docs/final-decisions.md,
 * 2026-10-08, "Learn: lessons need sign-in; progress saved to the account").
 *
 * POST { topic, lesson, done: "true" | "false" } marks a published lesson
 * done or not done for the reader. DELETE clears all of their progress (the
 * Privacy notice promises they can). Same-origin only (readFields), signed-in
 * only, and a 404 while the Learn module is off. Only ever the reader's own
 * progress: the user id comes from the session, never the request.
 */
const notFound = () => noStore(NextResponse.json({ error: "not-found" }, { status: 404 }));
const signIn = () => noStore(NextResponse.json({ error: "sign-in" }, { status: 401 }));

export const POST = withObservability("POST /api/learn/progress", async (request: Request) => {
  if (!learnEnabled()) return notFound();
  const read = await readFields(request, ["topic", "lesson", "done"], 1024);
  if ("response" in read) return noStore(read.response);
  const userId = await currentUserId();
  if (!userId) return signIn();

  const { topic = "", lesson = "", done = "" } = read.fields;
  if (done !== "true" && done !== "false")
    return noStore(NextResponse.json({ error: "invalid" }, { status: 400 }));
  const lessonId = await learnRepository.findPublishedLessonId(topic, lesson);
  if (!lessonId) return notFound();

  await learnRepository.setLessonDone(userId, lessonId, done === "true");
  logger.info("learn.progress_set", { lessonId, done: done === "true" });
  return noStore(NextResponse.json({ done: done === "true" }, { status: 200 }));
});

export const DELETE = withObservability("DELETE /api/learn/progress", async (request: Request) => {
  if (!learnEnabled()) return notFound();
  const read = await readFields(request, [], 64);
  if ("response" in read) return noStore(read.response);
  const userId = await currentUserId();
  if (!userId) return signIn();

  await learnRepository.clearProgress(userId);
  logger.info("learn.progress_cleared", {});
  return noStore(NextResponse.json({ cleared: true }, { status: 200 }));
});

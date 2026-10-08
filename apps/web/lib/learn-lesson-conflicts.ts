import type { FieldErrors } from "./learn-input";
import { learnRepository } from "./learn";

/**
 * A lesson's slug and position are each unique within its topic (MVP-048).
 * The field errors for a clash with another lesson, or null when there is
 * none. `lessonId` is the lesson being edited (null when creating).
 */
export async function lessonConflicts(
  topicId: string,
  input: { slug: string; position: number },
  lessonId: string | null,
): Promise<FieldErrors | null> {
  const topic = await learnRepository.findTopicWithLessons(topicId);
  const others = (topic?.lessons ?? []).filter((lesson) => lesson.id !== lessonId);
  const errors: FieldErrors = {};
  if (others.some((lesson) => lesson.slug === input.slug))
    errors["slug"] = ["Another lesson in this topic already uses this slug."];
  const atPosition = others.find((lesson) => lesson.position === input.position);
  if (atPosition)
    errors["position"] = [
      `Lesson ${input.position} is already "${atPosition.title}"; pick another place.`,
    ];
  return Object.keys(errors).length > 0 ? errors : null;
}

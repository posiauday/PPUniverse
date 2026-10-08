import { cleanDisplayName } from "@ppu/domain-content";
import { logger } from "@ppu/telemetry";
import { NextResponse } from "next/server";
import {
  COMMENT_LIMITS,
  commentRepository,
  currentUserId,
  secureRandom,
} from "../../../../lib/comments";
import { feedbackKey, feedbackRepository } from "../../../../lib/feedback";
import { commentsEnabled } from "../../../../lib/feature-flags";
import { withObservability } from "../../../../lib/observability";
import { noStore, readJson } from "../../../../lib/request-guards";
import { checkAvatarChoice } from "../../../../lib/avatar-seeds";
import { loadViewerSummary } from "../../../../lib/viewer";

/**
 * Changes the signed-in reader's public profile (MVP-040): `{ "displayName":
 * "…" }` sets a new name (unique in any case), `{ "avatar": "new" }` draws a
 * new avatar, and `{ "avatar": "<seed>" }` sets the one chosen from the
 * gallery; the crown only for an admin, by the role in the database
 * (docs/final-decisions.md, 2026-10-08, "Avatars: choose from a gallery; the
 * crown is for admins"). The name is never logged.
 */
export const POST = withObservability("POST /api/account/profile", async (request: Request) => {
  if (!commentsEnabled())
    return noStore(NextResponse.json({ error: "not-found" }, { status: 404 }));
  const read = await readJson(request);
  if ("response" in read) return noStore(read.response);
  const { body } = read;
  const userId = await currentUserId();
  if (!userId) return noStore(NextResponse.json({ error: "sign-in" }, { status: 401 }));

  const { profileChangesPerDay } = COMMENT_LIMITS;
  const allowed = await feedbackRepository.consumeAllowance(
    feedbackKey("profile-changes", userId),
    profileChangesPerDay.limit,
    profileChangesPerDay.windowMs,
    new Date(),
  );
  if (!allowed) return noStore(NextResponse.json({ error: "too-many" }, { status: 429 }));

  await commentRepository.getOrCreateProfile(userId, secureRandom);
  if (body["avatar"] === "new") {
    await commentRepository.setAvatarSeed(
      userId,
      Math.floor(secureRandom() * 2 ** 48).toString(36),
    );
    logger.info("profile.avatar_changed", {});
    return noStore(NextResponse.json({ ok: true }));
  }
  if (typeof body["avatar"] === "string") {
    const { isAdmin } = await loadViewerSummary(userId);
    const choice = checkAvatarChoice(body["avatar"], isAdmin);
    if (!choice.ok) {
      const status = choice.problem === "admins-only" ? 403 : 400;
      return noStore(NextResponse.json({ error: choice.problem }, { status }));
    }
    await commentRepository.setAvatarSeed(userId, choice.seed);
    logger.info("profile.avatar_chosen", {});
    return noStore(NextResponse.json({ ok: true }));
  }
  if (typeof body["displayName"] !== "string") {
    return noStore(NextResponse.json({ error: "bad-request" }, { status: 400 }));
  }
  const cleaned = cleanDisplayName(body["displayName"]);
  if (!cleaned.ok) return noStore(NextResponse.json({ error: cleaned.problem }, { status: 400 }));
  const saved = await commentRepository.setDisplayName(userId, cleaned.name);
  if (!saved) return noStore(NextResponse.json({ error: "taken" }, { status: 409 }));
  logger.info("profile.name_changed", {});
  return noStore(NextResponse.json({ ok: true, displayName: cleaned.name }));
});

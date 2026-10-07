import { createHash } from "node:crypto";
import { PrismaFeedbackRepository } from "@ppu/adapter-content";
import { prisma } from "@ppu/db";

/**
 * Guide feedback (MVP-039 votes, MVP-038 reports; docs/final-decisions.md,
 * 2026-10-07, "Votes and reports"), wired to the database.
 */
export const feedbackRepository = new PrismaFeedbackRepository(prisma);

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * Abuse limits, as hashed counters (the address is never stored as it is).
 * - One vote per guide per address per day: a repeat is quietly ignored, so
 *   the reader still sees "Thanks".
 * - At most 60 votes an hour from one address, across guides.
 * - At most 5 reports an hour from one address.
 */
export const LIMITS = {
  votePerGuide: { limit: 1, windowMs: DAY },
  votesPerAddress: { limit: 60, windowMs: HOUR },
  reportsPerAddress: { limit: 5, windowMs: HOUR },
} as const;

export function feedbackKey(...parts: string[]): string {
  return createHash("sha256").update(parts.join(":")).digest("hex");
}

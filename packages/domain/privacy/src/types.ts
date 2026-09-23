/**
 * Consent and deletion-request workflow (MVP-020, FR-004). Every record type
 * here is append-only by construction: no method on PrivacyRepository
 * updates a previously-written row. A change of mind always produces a new
 * row — see packages/db/prisma/schema/privacy.prisma for the full rationale.
 *
 * Deliberately not importing @ppu/domain-entitlements or
 * @ppu/domain-catalog's types: this package stays independent, matching the
 * established convention (packages/domain/entitlements/src/types.ts's own
 * comment on the same point).
 */

/** MVP set only (docs/final-decisions.md, "MVP-020 open questions 46, 47 and
 * 48", question 47) — analytics consent is excluded because the analytics
 * feature (FR-016) does not exist yet; adding a category later is one enum
 * value plus new rows, not a redesign. */
export type ConsentCategory = "TERMS_OF_SERVICE" | "MARKETING_EMAIL";

export type PolicyDocumentType = "TERMS_OF_SERVICE" | "PRIVACY_POLICY";

/** SUBMITTED → UNDER_REVIEW → APPROVED/DENIED → (APPROVED only) COMPLETED,
 * or WITHDRAWN from SUBMITTED/UNDER_REVIEW. COMPLETED is only ever reached
 * once some future story's erasure execution has actually run — nothing in
 * this domain package sets it on its own. */
export type DeletionRequestState =
  "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "DENIED" | "WITHDRAWN" | "COMPLETED";

export interface ConsentRecordInput {
  userId: string;
  category: ConsentCategory;
  granted: boolean;
  /** Nullable — not every category is tied to a specific legal-document
   * version the same way TERMS_OF_SERVICE acceptance is. */
  policyVersionId: string | null;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  category: ConsentCategory;
  granted: boolean;
  policyVersionId: string | null;
  recordedAt: Date;
}

export interface DeletionRequestEventRecord {
  id: string;
  deletionRequestId: string;
  toState: DeletionRequestState;
  actorUserId: string;
  reason: string | null;
  occurredAt: Date;
}

export interface DeletionRequestRecord {
  id: string;
  userId: string;
  createdAt: Date;
  /** Ordered oldest to newest. The last entry is the request's current state. */
  events: DeletionRequestEventRecord[];
}

/**
 * The persistence contract this domain package needs, implemented by
 * @ppu/adapter-privacy's PrismaPrivacyRepository — mirrors the
 * domain-defines-the-interface / adapter-implements-it-against-Prisma
 * pattern already established by @ppu/domain-entitlements.
 */
export interface PrivacyRepository {
  /** Always inserts a new row — never updates an earlier one. */
  recordConsent(input: ConsentRecordInput): Promise<ConsentRecord>;
  /** The latest row per category for this user (current consent state). */
  getCurrentConsent(userId: string): Promise<ConsentRecord[]>;
  createDeletionRequest(userId: string): Promise<DeletionRequestRecord>;
  /** Always inserts a new event — the DeletionRequest row itself is never updated. */
  appendDeletionRequestEvent(
    deletionRequestId: string,
    toState: DeletionRequestState,
    actorUserId: string,
    reason: string | null,
  ): Promise<DeletionRequestEventRecord>;
  /** The user's most recently created request, with its full event history, or null. */
  getLatestDeletionRequestForUser(userId: string): Promise<DeletionRequestRecord | null>;
  getDeletionRequestById(id: string): Promise<DeletionRequestRecord | null>;
  /** Every request with at least one active-state event, oldest first — the admin queue. */
  listActiveDeletionRequests(): Promise<DeletionRequestRecord[]>;
}

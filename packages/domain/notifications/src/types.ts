/**
 * Transactional email (MVP-018, FR-013). No marketing campaigns, no digest
 * scheduling, no broadcast sending — all explicitly out of scope
 * (docs/final-decisions.md, "MVP-018 open question 49"). Preference storage
 * is not modeled here: MVP-020's ConsentRecord (category MARKETING_EMAIL) is
 * the notification preference; this package enforces it at send time.
 *
 * Deliberately not importing @ppu/domain-privacy's types directly here —
 * this package takes a consent-lookup function as a parameter where it
 * needs one (see the adapter package), matching the established
 * independent-domain-package convention.
 */

/** SIGNIN_LINK: MVP-002's magic link, migrated onto this mechanism.
 * DELETION_REQUEST_SUBMITTED: the one deletion-request state approved to
 * send a message (docs/final-decisions.md, "MVP-018 open question 49",
 * option (a)) — every other state (UNDER_REVIEW, WITHDRAWN, APPROVED,
 * DENIED, COMPLETED) is deliberately not a value here, not even
 * reserved-but-unused. */
export type EmailMessageType = "SIGNIN_LINK" | "DELETION_REQUEST_SUBMITTED";

export type EmailSendStatus = "SENT" | "FAILED" | "SKIPPED_NO_CONSENT";

export interface EmailSendRecord {
  id: string;
  userId: string | null;
  messageType: EmailMessageType;
  status: EmailSendStatus;
  providerMessageId: string | null;
  createdAt: Date;
}

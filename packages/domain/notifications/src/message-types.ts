import type { EmailMessageType } from "./types.js";

/**
 * The transactional/optional boundary (docs/final-decisions.md, "MVP-018
 * open question 49"): a message is transactional when it is necessary for
 * the user to retain or exercise control over their own account or a
 * request they made — it must never be gated by MARKETING_EMAIL consent,
 * because gating it would block access to functionality the user is
 * otherwise entitled to.
 *
 * Both message types built by this story are transactional (sign-in access,
 * and an acknowledgement of the user's own deletion request). No optional
 * message type exists yet — nothing currently calls the optional send path
 * with a real message — but the function is total over EmailMessageType so
 * a future addition cannot silently default to the wrong side of this rule.
 */
export function isTransactionalMessageType(type: EmailMessageType): boolean {
  switch (type) {
    case "SIGNIN_LINK":
    case "DELETION_REQUEST_SUBMITTED":
      return true;
  }
}

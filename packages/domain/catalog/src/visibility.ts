import type { ProductRecord } from "./types.js";

/**
 * The core invariant this story exists to enforce (FR-001): only
 * PUBLISHED products ever appear on a public, unauthenticated page. A
 * DRAFT product exists in the database (a creator/moderation pipeline
 * will write it once MVP-011/012/013/014 exist) but is never rendered.
 */
export function isPubliclyVisible(product: Pick<ProductRecord, "status">): boolean {
  return product.status === "PUBLISHED";
}

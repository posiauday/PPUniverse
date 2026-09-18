/**
 * Bounded-page pagination for catalog-style endpoints, per the TRD quality
 * requirement ("pagination and bounded queries for all collection endpoints")
 * and docs/07-api-contracts.md ("bounded page pagination for catalog").
 */
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface BoundedPageRequest {
  page?: number;
  pageSize?: number;
}

export interface BoundedPageParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function resolveBoundedPage(request: BoundedPageRequest): BoundedPageParams {
  const page = Math.max(1, Math.trunc(request.page ?? 1));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.trunc(request.pageSize ?? DEFAULT_PAGE_SIZE)),
  );
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

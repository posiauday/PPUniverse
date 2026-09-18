/**
 * Worker process entrypoint. Job consumers (webhook processing, email,
 * scanning, indexing, media processing) are added by the stories that own
 * them (see docs/13-implementation-readiness-plan.md §1). This baseline only
 * proves the process boots.
 */
export function describeWorker(): string {
  return "worker process ready";
}

/* c8 ignore start */
if (process.env["NODE_ENV"] !== "test") {
  console.log(describeWorker());
}
/* c8 ignore stop */

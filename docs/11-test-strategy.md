# Test Strategy

## Layers
Unit tests for domain rules; integration tests for database, storage and adapters; contract tests for providers; E2E tests for critical journeys; accessibility automation plus manual keyboard/screen-reader checks; security tests; performance tests; migration and restore tests.

## Critical E2E scenarios
Browse and filter; free entitlement and download; paid checkout webhook and download; duplicate webhook; refund; expired/suspended entitlement; creator submission; malicious upload rejection; moderator approval and change request; product version release; verified review; account deletion request; admin audit lookup.

## Release blockers
Broken authorization; payment or entitlement inconsistency; critical/high exploitable vulnerability; malware scan bypass; data-loss migration; critical accessibility issue in core path; missing legal agreement acceptance; failed restore; unbounded query on public endpoints.

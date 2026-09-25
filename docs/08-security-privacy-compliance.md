# Security, Privacy and Compliance Plan

## Threat priorities
Account takeover, broken object authorization, ~~creator privilege escalation~~ (moot 2026-09-24 under first-party-only, `docs/final-decisions.md` — no creator role exists to escalate from; **admin account compromise is the corresponding, arguably more severe, threat now** — see `docs/12-devops-runbook.md`'s runbook list), malicious uploads, archive bombs, stored XSS in documentation, payment webhook forgery, entitlement bypass, signed URL leakage, scraping/abuse, supply-chain compromise, secrets exposure and admin misuse.

## Required controls
OIDC with secure session management; optional MFA through provider; server authorization policies; admin step-up authentication where supported; rate limits; schema validation; output encoding and HTML sanitization; CSP; private object storage; quarantine and malware scans; short-lived signed URLs; webhook signature verification; idempotency; secret manager; dependency and container scanning; immutable audit trail; backup encryption; deletion workflow; incident response.

## Privacy requirements
Maintain data inventory, purpose, lawful basis decision, notice, consent where needed, retention schedule, deletion/export process, subprocessors, cross-border assessment, cookie categories and breach workflow. Collect no tenant inventory, source code or connection credentials in MVP.

## Marketplace trust
~~Require creator agreement~~, ensure LowCodeStacks holds or has cleared IP rights for what it publishes (reworded 2026-09-24, `docs/final-decisions.md`, "First-party-only publishing model" — no third-party creator to require an agreement from), takedown process, prohibited content rules, support disclosure, version compatibility and vulnerability reporting channel. Never label an asset "enterprise secure" without defined evidence and review criteria.

## Security gates
Threat model before implementation; authorization matrix before API build; upload abuse tests before ~~creator beta~~ first-party publishing begins (reworded 2026-09-24, same decision); payment replay tests before paid launch; restore exercise and incident tabletop before general availability.

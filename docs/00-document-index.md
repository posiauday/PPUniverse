# Document Index and Governance

**Source-of-truth priority order**: `CLAUDE.md` → `docs/final-decisions.md` → BRD → PRD → TRD → ADRs → Backlog. Where documents conflict, the higher-priority one wins; lower documents should be brought into alignment opportunistically rather than blocking work on the update.

| Document | Purpose | Approval gate |
|---|---|---|
| Final Decisions | Binding product-owner decisions that resolve open questions or narrow/finalize a baseline choice — sits above BRD/PRD/TRD/ADRs | Product owner |
| BRD | Business outcomes, scope, stakeholders, rules | Product sponsor |
| PRD | Users, journeys, functional and non-functional requirements | Product owner |
| TRD | Architecture, integrations, quality attributes | Technical lead |
| IA | Navigation, taxonomy, URL model | Product + UX |
| UX design system | Interaction, accessibility, visual rules | UX lead |
| Data model | Entities, ownership, retention | Technical + privacy |
| API contracts | Interface behavior and errors | Technical lead |
| Security/privacy | Threat controls and data practices | Security/privacy |
| Marketplace operations | Creator, review, support, refunds | Operations/legal |
| Backlog | Build sequence and acceptance criteria | Product owner |
| Implementation readiness plan | Repository architecture, tech decisions, folder structure, DB/auth/file-security plans, issue setup, execution sequence, risks | Technical lead |

## Change control
Every material change receives an issue, impact assessment, decision owner, requirement trace, and ADR when architectural. BRD, PRD, and TRD version independently. MVP scope cannot expand without removing equivalent effort or approving a later milestone.

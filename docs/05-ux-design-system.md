# UX and Design System Specification

## Experience principles
Professional, calm, credible, fast, accessible and content-first. Avoid a generic template-marketplace look. Put preview, compatibility, documentation, license and support evidence before promotional copy.

## Foundations
Use semantic color tokens, 4/8 spacing rhythm, responsive type scale, restrained elevation, 44px target guidance for touch controls, visible focus, high-contrast states and reduced-motion support. Light theme first; dark theme only after parity.

## Core components
Header, mega navigation, command search, breadcrumbs, filter drawer, product card, collection card, ~~creator badge~~ (superseded 2026-09-24, `docs/final-decisions.md`, "First-party-only publishing model" — no third-party creator to badge; never built), price block, license disclosure, compatibility matrix, screenshot gallery, code/YAML viewer, tabs, changelog, version selector, review summary, alert, toast, modal, drawer, pagination, data table, form controls, uploader, scan status, moderation decision panel and audit timeline.

## Responsive behavior
Mobile uses single-column information hierarchy and bottom-safe actions where appropriate. Tablet preserves filters through a drawer. Desktop supports a left filter rail and sticky purchase summary without obscuring content. No horizontal scrolling except deliberate code/data regions.

## Accessibility acceptance
All functionality is keyboard reachable; modals trap and restore focus; errors are programmatically associated; status is not color-only; heading structure is logical; media has text alternatives; tables use proper headers; code blocks are navigable; animations respect reduced motion; zoom and reflow remain usable.

## Required states
Default, hover, focus, active, selected, disabled, loading, skeleton, empty, no-results, validation error, system error, offline/retry, permission denied, expired entitlement, scan pending and suspended content.

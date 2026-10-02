# UX and Design System Specification

## Experience principles
Professional, calm, credible, fast, accessible and content-first. Avoid a generic template-marketplace look. Put preview, compatibility, documentation, license and support evidence before promotional copy.

## Foundations
Use semantic color tokens, 4/8 spacing rhythm, responsive type scale, restrained elevation, 44px target guidance for touch controls, visible focus, high-contrast states and reduced-motion support. Light theme first; dark theme only after parity. **Update 2026-09-30 (MVP-027):** the dark theme is built at parity. Every page gets it through the same semantic tokens, and the accessibility gate scans every page state in dark as well as light (`docs/final-decisions.md`, "Design system (MVP-027)").

**Update 2026-10-01 (MVP-031): the visual design is "Daylight"** (`docs/final-decisions.md`, "Visual redesign: Daylight"), replacing the A + B look. Foundations as built:
- **Tokens** (`apps/web/app/globals.css`): warm paper background, near-black ink, a lime highlight, a violet accent and focus ring, a coral accent word, and one tint plus one ink colour per technology. A Daylight dark palette keeps the toggle at parity. `apps/web/lib/design-tokens.test.ts` checks every text pairing at 4.5:1 and every ring and control edge at 3:1, in both themes.
- **Type:** Bricolage Grotesque (display), Instrument Serif italic for one accent word per heading, Geist (body), Geist Mono (code and labels). All self-hosted through `next/font`.
- **Shape and motion:** large rounded panels, pill buttons and chips, glossy CSS-only 3D shapes, and live mock-ups (an app that scrolls, a flow running, bars growing). Every animation's resting state is the finished picture, and all motion stops under `prefers-reduced-motion`. Decorative mock-ups are `aria-hidden`, but their text still meets contrast.
- **Header:** a floating pill, sticky from the md breakpoint, with `scroll-padding-top` so focus and anchors are never hidden behind it (WCAG 2.4.11).
  - **From lg:** Learn, the Technologies menu, Components and KPI guides; sign-in, the theme switch and "Start learning".
  - **From xl:** a "Search guides" box. Ctrl K / ⌘K focuses it, or opens `/search` where the box isn't shown.
  - **Below lg:** the logo, a search button and a Menu disclosure. Its panel opens in the page flow, so it never covers other controls.
- **Logo:** X2 "Code stack" (`apps/web/lib/brand-mark.ts`). It is the stack symbol alone; the two-tone wordmark and the "Built to hold up" tagline are branding beside it. A simplified drawing is used at 20 px and below.
- **Footer:** link columns for the six technologies and the guide types, then one notice bar with the non-affiliation line and the trademark sentence.
- **Search** (`/search`) lists guides first, as rows with the matching words marked in lime, then components.
- **Phone layouts follow the mobile canvas:**
  - compact technology panels and tiles;
  - compact "Start here" rows;
  - a trimmed "broken version first" panel.

**Update 2026-10-02 (board fidelity pass, `docs/final-decisions.md`):** the built pages were compared side by side with the canvas at desktop and phone widths, and every drift was fixed, apart from the deliberate exceptions recorded there (truthful counts and claims, and pages that need product-owner content).

## Core components
Header, mega navigation, command search, breadcrumbs, filter drawer, product card, collection card, ~~creator badge~~ (superseded 2026-09-24, `docs/final-decisions.md`, "First-party-only publishing model" — no third-party creator to badge; never built), price block, license disclosure, compatibility matrix, screenshot gallery, code/YAML viewer, tabs, changelog, version selector, review summary, alert, toast, modal, drawer, pagination, data table, form controls, uploader, scan status, moderation decision panel and audit timeline.

## Responsive behavior
Mobile uses single-column information hierarchy and bottom-safe actions where appropriate. Tablet preserves filters through a drawer. Desktop supports a left filter rail and sticky purchase summary without obscuring content. No horizontal scrolling except deliberate code/data regions.

## Accessibility acceptance
All functionality is keyboard reachable; modals trap and restore focus; errors are programmatically associated; status is not color-only; heading structure is logical; media has text alternatives; tables use proper headers; code blocks are navigable; animations respect reduced motion; zoom and reflow remain usable.

## Required states
Default, hover, focus, active, selected, disabled, loading, skeleton, empty, no-results, validation error, system error, offline/retry, permission denied, expired entitlement, scan pending and suspended content.

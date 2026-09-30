# @ppu/e2e

Playwright + axe-core accessibility gate (MVP-023). Development and CI only: nothing here is imported by the application or shipped in its bundle.

Everything about it (what is checked, the browser and breakpoint matrices, what is **not** verified, the manual-review checklist, how to run it) is in `docs/14-accessibility-testing.md`. In short:

```bash
pnpm build
pnpm --filter @ppu/e2e browsers:install   # once
E2E_ALLOW_DATABASE_WRITES=1 pnpm test:a11y
```

- `src/`: helpers and their unit tests (`pnpm test` runs them; no browser or database needed).
- `tests/a11y/`: the Playwright specs (`pages.spec.ts` matrix, `keyboard.spec.ts`, `negative-controls.spec.ts`, `regressions/`).
- The harness only writes to a database it can positively identify as local or CI, and only rows with the reserved prefix `zz-e2e-a11y-`.

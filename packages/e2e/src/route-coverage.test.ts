import { readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ACKNOWLEDGED_SPECIAL_FILES, GATED_ROUTES } from "./page-routes.js";
import {
  METADATA_FILES,
  discoverPageRoutes,
  handlersOutsideApi,
  specialUiFiles,
  staleGatedRoutes,
  unacknowledgedSpecialFiles,
  ungatedRoutes,
} from "./route-coverage.js";

/**
 * Route-coverage guard: the accessibility gate must not silently skip a page. The
 * first block scans the application's real routing tree; the second proves the same
 * logic fails on trees that contain something new.
 */

const APP_DIR = fileURLToPath(new URL("../../../apps/web/app/", import.meta.url));

/** Every file under apps/web/app, as forward-slash paths relative to it. */
function listFiles(dir: string, prefix = ""): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? listFiles(join(dir, entry.name), relative) : [relative];
  });
}

const FILES = listFiles(APP_DIR).filter((file) => !/\.test\.tsx?$/.test(file));

describe("route coverage against the real routing tree", () => {
  it("gates exactly the page routes that exist in apps/web/app", () => {
    expect(ungatedRoutes(FILES, GATED_ROUTES), "page routes the gate does not cover").toEqual([]);
    expect(staleGatedRoutes(FILES, GATED_ROUTES), "gated routes that no longer exist").toEqual([]);
  });

  it("knows /account is not a page (only /account/sessions is), so it is covered as a 404", () => {
    const routes = discoverPageRoutes(FILES);
    expect(routes).not.toContain("/account");
    expect(routes).toContain("/account/sessions");
  });

  it("finds no special UI file the gate does not exercise", () => {
    expect(
      unacknowledgedSpecialFiles(FILES, ACKNOWLEDGED_SPECIAL_FILES),
      "add states that exercise these to src/pages.ts and list them in src/page-routes.ts",
    ).toEqual([]);
    expect(specialUiFiles(FILES).map((file) => basename(file))).toContain("not-found.tsx");
  });

  it("finds route handlers only under /api, plus the known metadata files", () => {
    expect(handlersOutsideApi(FILES), "route handlers outside /api could render pages").toEqual([]);
    const metadata = FILES.filter((file) => METADATA_FILES.includes(file));
    expect([...metadata].sort()).toEqual([...METADATA_FILES].sort());
  });

  it("scans a non-trivial tree, so a wrong path cannot make the guard pass vacuously", () => {
    expect(FILES.length).toBeGreaterThan(10);
    expect(FILES).toContain("layout.tsx");
    expect(FILES).toContain("page.tsx");
  });
});

describe("route coverage: negative controls (the guard can fail)", () => {
  const base = ["layout.tsx", "page.tsx", "search/page.tsx", "categories/[slug]/page.tsx"];
  const gated = ["/", "/search", "/categories/[slug]"];

  it("passes a tree where every page is gated", () => {
    expect(ungatedRoutes(base, gated)).toEqual([]);
    expect(staleGatedRoutes(base, gated)).toEqual([]);
  });

  it("flags a new page that is not gated, including /account becoming a real page", () => {
    expect(ungatedRoutes([...base, "account/page.tsx"], gated)).toEqual(["/account"]);
    expect(ungatedRoutes([...base, "(marketing)/pricing/page.tsx"], gated)).toEqual(["/pricing"]);
    expect(ungatedRoutes([...base, "creators/[handle]/page.tsx"], gated)).toEqual([
      "/creators/[handle]",
    ]);
  });

  it("flags a gated route whose page was removed", () => {
    expect(staleGatedRoutes(["layout.tsx", "page.tsx"], gated)).toEqual([
      "/search",
      "/categories/[slug]",
    ]);
  });

  it("flags a new special UI file that no state exercises", () => {
    expect(unacknowledgedSpecialFiles([...base, "loading.tsx"], ["not-found.tsx"])).toEqual([
      "loading.tsx",
    ]);
    expect(unacknowledgedSpecialFiles([...base, "search/error.tsx"], ["not-found.tsx"])).toEqual([
      "search/error.tsx",
    ]);
    expect(unacknowledgedSpecialFiles([...base, "not-found.tsx"], ["not-found.tsx"])).toEqual([]);
  });

  it("flags a route handler outside /api", () => {
    expect(handlersOutsideApi([...base, "api/health/route.ts", "widgets/route.ts"])).toEqual([
      "widgets/route.ts",
    ]);
  });
});

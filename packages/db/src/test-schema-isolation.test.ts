import { describe, expect, it } from "vitest";
import { applyTestSchemaIsolation, deriveTestSchemaName } from "./test-schema-isolation.js";

describe("deriveTestSchemaName", () => {
  it("derives a pkg_ schema name for one of the 7 known adapter packages", () => {
    expect(deriveTestSchemaName("catalog")).toBe("pkg_catalog");
    expect(deriveTestSchemaName("entitlements")).toBe("pkg_entitlements");
  });

  it("throws for a package name outside the known 7", () => {
    expect(() => deriveTestSchemaName("web")).toThrow(/is not one of the 7 adapter packages/);
    expect(() => deriveTestSchemaName("")).toThrow(/is not one of the 7 adapter packages/);
  });
});

describe("applyTestSchemaIsolation", () => {
  it("does nothing when DATABASE_URL is not set (local parity — no forced DB requirement)", () => {
    const env: NodeJS.ProcessEnv = {};
    applyTestSchemaIsolation("catalog", env);
    expect(env["DATABASE_URL"]).toBeUndefined();
  });

  it("rewrites DATABASE_URL's schema query param to the derived per-package schema", () => {
    const env: NodeJS.ProcessEnv = {
      DATABASE_URL: "postgresql://ppuniverse:ppuniverse@localhost:5432/ppuniverse?schema=public",
    };
    applyTestSchemaIsolation("entitlements", env);
    expect(env["DATABASE_URL"]).toBe(
      "postgresql://ppuniverse:ppuniverse@localhost:5432/ppuniverse?schema=pkg_entitlements",
    );
  });

  it("adds a schema query param when DATABASE_URL has none", () => {
    const env: NodeJS.ProcessEnv = {
      DATABASE_URL: "postgresql://ppuniverse:ppuniverse@localhost:5432/ppuniverse",
    };
    applyTestSchemaIsolation("files", env);
    expect(env["DATABASE_URL"]).toBe(
      "postgresql://ppuniverse:ppuniverse@localhost:5432/ppuniverse?schema=pkg_files",
    );
  });

  it("throws (fails loudly) when DATABASE_URL is set but the package name is not recognized", () => {
    const env: NodeJS.ProcessEnv = {
      DATABASE_URL: "postgresql://ppuniverse:ppuniverse@localhost:5432/ppuniverse?schema=public",
    };
    expect(() => applyTestSchemaIsolation("not-a-real-package", env)).toThrow(
      /is not one of the 7 adapter packages/,
    );
  });
});

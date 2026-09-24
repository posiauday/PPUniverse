import { describe, expect, it } from "vitest";
import { applyTestSchemaIsolation, deriveTestSchemaName } from "./test-schema-isolation.js";

describe("deriveTestSchemaName", () => {
  it("derives a pkg_ schema name from an @ppu/adapter-* package name", () => {
    expect(deriveTestSchemaName("@ppu/adapter-catalog")).toBe("pkg_catalog");
    expect(deriveTestSchemaName("@ppu/adapter-entitlements")).toBe("pkg_entitlements");
  });

  it("throws for an undefined package name", () => {
    expect(() => deriveTestSchemaName(undefined)).toThrow(/cannot derive a test schema/);
  });

  it("throws for a package name outside the @ppu/adapter-* pattern", () => {
    expect(() => deriveTestSchemaName("@ppu/db")).toThrow(/cannot derive a test schema/);
    expect(() => deriveTestSchemaName("some-other-package")).toThrow(/cannot derive a test schema/);
  });
});

describe("applyTestSchemaIsolation", () => {
  it("does nothing when DATABASE_URL is not set (local parity — no forced DB requirement)", () => {
    const env: NodeJS.ProcessEnv = { npm_package_name: "@ppu/adapter-catalog" };
    applyTestSchemaIsolation(env);
    expect(env["DATABASE_URL"]).toBeUndefined();
  });

  it("rewrites DATABASE_URL's schema query param to the derived per-package schema", () => {
    const env: NodeJS.ProcessEnv = {
      DATABASE_URL: "postgresql://ppuniverse:ppuniverse@localhost:5432/ppuniverse?schema=public",
      npm_package_name: "@ppu/adapter-entitlements",
    };
    applyTestSchemaIsolation(env);
    expect(env["DATABASE_URL"]).toBe(
      "postgresql://ppuniverse:ppuniverse@localhost:5432/ppuniverse?schema=pkg_entitlements",
    );
  });

  it("adds a schema query param when DATABASE_URL has none", () => {
    const env: NodeJS.ProcessEnv = {
      DATABASE_URL: "postgresql://ppuniverse:ppuniverse@localhost:5432/ppuniverse",
      npm_package_name: "@ppu/adapter-files",
    };
    applyTestSchemaIsolation(env);
    expect(env["DATABASE_URL"]).toBe(
      "postgresql://ppuniverse:ppuniverse@localhost:5432/ppuniverse?schema=pkg_files",
    );
  });

  it("throws (fails loudly) when DATABASE_URL is set but npm_package_name is missing or unrecognized", () => {
    const env: NodeJS.ProcessEnv = {
      DATABASE_URL: "postgresql://ppuniverse:ppuniverse@localhost:5432/ppuniverse?schema=public",
    };
    expect(() => applyTestSchemaIsolation(env)).toThrow(/cannot derive a test schema/);
  });
});

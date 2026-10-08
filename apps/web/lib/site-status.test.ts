import { afterEach, describe, expect, it, vi } from "vitest";
import { siteSwitches } from "./site-status";

afterEach(() => vi.unstubAllEnvs());

describe("siteSwitches (MVP-047)", () => {
  it("says what's on, and never shows a secret's value", () => {
    vi.stubEnv("FEATURE_COMMENTS", "on");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://lowcodestacks.example");
    const env = {
      GOOGLE_CLIENT_ID: "client-id-value",
      GOOGLE_CLIENT_SECRET: "client-secret-value",
      RESEND_API_KEY: "resend-key-value",
      EMAIL_FROM: "no-reply@lowcodestacks.example",
      INDEXNOW_KEY: "test-key-only",
      SENTRY_DSN: "dsn-value",
    };
    const switches = siteSwitches(env);
    const on = Object.fromEntries(switches.map((s) => [s.name, s.on]));
    expect(on).toMatchObject({
      Comments: true,
      "Components catalog": false,
      "Google sign-in": true,
      "Sending email": true,
      IndexNow: true,
      "Error monitoring": true,
    });
    const text = JSON.stringify(switches);
    for (const secret of [
      "client-secret-value",
      "resend-key-value",
      "test-key-only",
      "dsn-value",
    ]) {
      expect(text).not.toContain(secret);
    }
  });

  it("reads everything as off when nothing is set", () => {
    const switches = siteSwitches({});
    for (const name of [
      "Comments",
      "Google sign-in",
      "Sending email",
      "IndexNow",
      "Error monitoring",
    ]) {
      expect(switches.find((s) => s.name === name)?.on).toBe(false);
    }
  });
});

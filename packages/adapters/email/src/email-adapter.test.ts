import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ConsoleEmailAdapter,
  selectEmailAdapter,
  UnconfiguredEmailAdapter,
} from "./email-adapter.js";

describe("ConsoleEmailAdapter", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("logs the recipient, subject, and body instead of sending", async () => {
    const adapter = new ConsoleEmailAdapter();
    await adapter.send({
      to: "person@example.com",
      subject: "Sign in",
      text: "Click here: https://example.com/verify",
    });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("person@example.com"));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Sign in"));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("https://example.com/verify"));
  });
});

describe("selectEmailAdapter (BUG-019)", () => {
  const provider = { send: vi.fn() };

  it("uses the provider whenever one is configured", () => {
    expect(selectEmailAdapter({ provider, production: true, logTransport: false })).toBe(provider);
  });

  it("logs outside production, so local sign-in links still work", () => {
    expect(
      selectEmailAdapter({ provider: null, production: false, logTransport: false }),
    ).toBeInstanceOf(ConsoleEmailAdapter);
  });

  it("logs in a production build only when a test harness opts in", () => {
    expect(
      selectEmailAdapter({ provider: null, production: true, logTransport: true }),
    ).toBeInstanceOf(ConsoleEmailAdapter);
  });

  it("fails closed in production without a provider", () => {
    expect(
      selectEmailAdapter({ provider: null, production: true, logTransport: false }),
    ).toBeInstanceOf(UnconfiguredEmailAdapter);
  });
});

describe("UnconfiguredEmailAdapter (BUG-019)", () => {
  it("rejects every send and logs nothing about the message", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const adapter = new UnconfiguredEmailAdapter();

    await expect(
      adapter.send({
        to: "person@example.com",
        subject: "Sign in",
        text: "https://example.com/api/auth/callback/email?token=secret-token",
      }),
    ).rejects.toThrow("RESEND_API_KEY");
    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});

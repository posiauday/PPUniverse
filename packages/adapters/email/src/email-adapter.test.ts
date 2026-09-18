import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConsoleEmailAdapter } from "./email-adapter.js";

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

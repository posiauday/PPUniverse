import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { PWNED_RANGE_URL, PwnedPasswordsChecker } from "./pwned-passwords.js";

const PASSWORD = "green flows run on monday";
const SHA1 = createHash("sha1").update(PASSWORD).digest("hex").toUpperCase();

function fakeFetch(body: string, ok = true) {
  const calls: { url: string; headers: Record<string, string> }[] = [];
  const impl = (url: string, init: { headers: Record<string, string> }) => {
    calls.push({ url, headers: init.headers });
    return Promise.resolve({ ok, text: () => Promise.resolve(body) });
  };
  return { impl, calls };
}

describe("PwnedPasswordsChecker", () => {
  it("sends only the 5-character prefix, with padding, and finds a real match", async () => {
    const fake = fakeFetch(`0000000000000000000000000000000000A:0\r\n${SHA1.slice(5)}:42\r\n`);
    expect(await new PwnedPasswordsChecker(fake.impl).isBreached(PASSWORD)).toBe(true);
    expect(fake.calls).toEqual([
      {
        url: PWNED_RANGE_URL + SHA1.slice(0, 5),
        headers: expect.objectContaining({ "Add-Padding": "true" }),
      },
    ]);
    expect(fake.calls[0]!.url).not.toContain(SHA1.slice(5));
  });

  it("ignores padding lines with a count of 0", async () => {
    const fake = fakeFetch(`${SHA1.slice(5)}:0\r\n`);
    expect(await new PwnedPasswordsChecker(fake.impl).isBreached(PASSWORD)).toBe(false);
  });

  it("returns null (unknown) when the service fails or times out", async () => {
    expect(
      await new PwnedPasswordsChecker(fakeFetch("", false).impl).isBreached(PASSWORD),
    ).toBeNull();
    const hang = () =>
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5));
    expect(await new PwnedPasswordsChecker(hang, 1).isBreached(PASSWORD)).toBeNull();
  });
});

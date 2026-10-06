import { createHash } from "node:crypto";
import type { BreachChecker } from "@ppu/domain-identity";

/**
 * Have I Been Pwned's Pwned Passwords range API (MVP-036; docs/final-decisions.md,
 * 2026-10-06). Free, no API key, no attribution requirement. k-anonymity: only
 * the first 5 hex characters of the password's SHA-1 leave the server; the
 * service returns every suffix sharing that prefix and the match is checked
 * here. "Add-Padding" makes every response 800–1,000 lines, so its size reveals
 * nothing either. Padding lines have a count of 0 and are ignored.
 */
export const PWNED_RANGE_URL = "https://api.pwnedpasswords.com/range/";

type Fetch = (
  url: string,
  init: { headers: Record<string, string>; signal: AbortSignal },
) => Promise<{
  ok: boolean;
  text(): Promise<string>;
}>;

export class PwnedPasswordsChecker implements BreachChecker {
  constructor(
    private readonly fetchImpl: Fetch = fetch as unknown as Fetch,
    private readonly timeoutMs = 2000,
  ) {}

  async isBreached(password: string): Promise<boolean | null> {
    const sha1 = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    try {
      const response = await this.fetchImpl(PWNED_RANGE_URL + prefix, {
        headers: { "Add-Padding": "true", "User-Agent": "LowCodeStacks password check" },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) return null;
      const body = await response.text();
      for (const line of body.split("\n")) {
        const [lineSuffix, count] = line.trim().split(":");
        if (lineSuffix === suffix && Number(count) > 0) return true;
      }
      return false;
    } catch {
      return null;
    }
  }
}

import { test as base, expect } from "@playwright/test";
import { createFixtures, type FixtureSet } from "./seed.js";

/**
 * The name of next-auth's session cookie over plain http, which is what the
 * harness's local server uses. Signing in is done through the REAL server-enforced
 * path: the row lives in the database and the server looks it up like any other
 * session. There is no test-only route, flag or relaxed check in the application
 * (decision Q40).
 */
const SESSION_COOKIE = "next-auth.session-token";

interface TestFixtures {
  /** Signs the default browser context in as the worker's fixture user. */
  signedIn: void;
}

interface WorkerFixtures {
  /** This worker's temporary rows; created on first use and deleted when the worker ends. */
  seed: FixtureSet;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  seed: [
    // Playwright requires the destructuring pattern here even though no fixture is used.
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, workerInfo) => {
      const set = await createFixtures(workerInfo.workerIndex);
      try {
        await use(set);
      } finally {
        await set.cleanup();
      }
    },
    { scope: "worker" },
  ],

  signedIn: [
    async ({ context, seed, baseURL }, use) => {
      await context.addCookies([
        {
          name: SESSION_COOKIE,
          value: seed.currentSession.token,
          url: baseURL ?? "http://localhost:3100",
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);
      await use();
      await context.clearCookies();
    },
    { auto: false },
  ],
});

export { expect };

import { describe, expect, it } from "vitest";
import { ClamavScanAdapter } from "./clamav-scan-adapter.js";
import { EICAR_TEST_STRING } from "./fake-scan-adapter.js";

/**
 * Runs only when CLAMAV_HOST is set (a real clamd — locally/in CI via
 * docker-compose.yml / .github/workflows/ci.yml). clamd can take a while to
 * finish loading virus definitions after container start.
 */
const host = process.env["CLAMAV_HOST"];
const hasClamav = Boolean(host);

describe.skipIf(!hasClamav)("ClamavScanAdapter (integration)", () => {
  const adapter = new ClamavScanAdapter({
    host: host ?? "localhost",
    port: Number(process.env["CLAMAV_PORT"] ?? 3310),
    connectTimeoutMs: 30_000,
  });

  it("flags the real EICAR test file as infected", async () => {
    const result = await adapter.scan(Buffer.from(EICAR_TEST_STRING, "utf8"));
    expect(result.verdict).toBe("infected");
  });

  it("clears an ordinary text file as clean", async () => {
    const result = await adapter.scan(
      Buffer.from("just an ordinary file, nothing malicious", "utf8"),
    );
    expect(result).toEqual({ verdict: "clean" });
  });
});

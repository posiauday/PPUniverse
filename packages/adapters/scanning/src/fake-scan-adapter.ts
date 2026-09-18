import type { ScanAdapter, ScanResult } from "./scan-adapter.js";

/**
 * The industry-standard EICAR test string: every real antivirus engine
 * (including ClamAV) recognizes it as "infected" by convention, without it
 * being real malware. Used here so the fake adapter's behavior matches a
 * real scan engine's behavior on the same well-known input.
 */
export const EICAR_TEST_STRING =
  "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";

/** Test double — no network. Not for production use. */
export class FakeScanAdapter implements ScanAdapter {
  async scan(bytes: Uint8Array): Promise<ScanResult> {
    const text = Buffer.from(bytes).toString("utf8");
    if (text.includes(EICAR_TEST_STRING)) {
      return { verdict: "infected", signature: "Eicar-Test-Signature" };
    }
    return { verdict: "clean" };
  }
}

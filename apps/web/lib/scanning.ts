import { ClamavScanAdapter, type ScanAdapter } from "@ppu/adapter-scanning";

/**
 * ClamAV locally/CI (docker-compose.yml, .github/workflows/ci.yml). Final
 * production vendor is still open (docs/open-questions.md item 9).
 */
export const scanAdapter: ScanAdapter = new ClamavScanAdapter({
  host: process.env["CLAMAV_HOST"] ?? "localhost",
  port: Number(process.env["CLAMAV_PORT"] ?? 3310),
});

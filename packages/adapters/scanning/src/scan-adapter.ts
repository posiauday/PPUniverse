export type ScanResult =
  | { verdict: "clean" }
  | { verdict: "infected"; signature: string }
  | { verdict: "error"; message: string };

export interface ScanAdapter {
  scan(bytes: Uint8Array): Promise<ScanResult>;
}

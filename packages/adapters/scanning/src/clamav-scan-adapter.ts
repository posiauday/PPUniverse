import { Socket } from "node:net";
import type { ScanAdapter, ScanResult } from "./scan-adapter.js";

export interface ClamavScanAdapterConfig {
  host: string;
  port: number;
  /** Chunk size for the INSTREAM protocol; clamd's default StreamMaxLength is well above this. */
  chunkSizeBytes?: number;
  connectTimeoutMs?: number;
}

const DEFAULT_CHUNK_SIZE = 64 * 1024;

/**
 * Talks to clamd's INSTREAM command directly over TCP (no client library —
 * the protocol is small and well-documented: a null-terminated "zINSTREAM"
 * command, then length-prefixed chunks, then a zero-length chunk to end,
 * then read the verdict line). Vendor for production is still open
 * (docs/open-questions.md item 9); ClamAV is open-source and self-hostable,
 * used here as the concrete implementation of the ScanAdapter port.
 */
export class ClamavScanAdapter implements ScanAdapter {
  constructor(private readonly config: ClamavScanAdapterConfig) {}

  async scan(bytes: Uint8Array): Promise<ScanResult> {
    return new Promise<ScanResult>((resolve) => {
      const socket = new Socket();
      const chunks: Buffer[] = [];
      let settled = false;

      const finish = (result: ScanResult) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        resolve(result);
      };

      socket.setTimeout(this.config.connectTimeoutMs ?? 10_000);
      socket.on("timeout", () =>
        finish({ verdict: "error", message: "clamd connection timed out" }),
      );
      socket.on("error", (error) => finish({ verdict: "error", message: error.message }));

      socket.on("connect", () => {
        socket.write("zINSTREAM\0");
        const chunkSize = this.config.chunkSizeBytes ?? DEFAULT_CHUNK_SIZE;
        for (let offset = 0; offset < bytes.length; offset += chunkSize) {
          const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
          const header = Buffer.alloc(4);
          header.writeUInt32BE(chunk.length, 0);
          socket.write(header);
          socket.write(Buffer.from(chunk));
        }
        const terminator = Buffer.alloc(4); // zero-length chunk signals end of stream
        socket.write(terminator);
      });

      socket.on("data", (data) => chunks.push(data));

      socket.on("end", () => {
        const response = Buffer.concat(chunks).toString("utf8").replace(/\0/g, "").trim();
        finish(parseClamdResponse(response));
      });

      socket.connect(this.config.port, this.config.host);
    });
  }
}

export function parseClamdResponse(response: string): ScanResult {
  if (/\bOK$/.test(response)) {
    return { verdict: "clean" };
  }
  const foundMatch = /:\s*(.+?)\s+FOUND$/.exec(response);
  if (foundMatch?.[1]) {
    return { verdict: "infected", signature: foundMatch[1] };
  }
  return { verdict: "error", message: response || "empty response from clamd" };
}

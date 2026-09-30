import { normalizeDisplayText } from "./text.js";
import type { SupportStatus } from "./types.js";

/** The four statuses every product declares (docs/09-marketplace-operations.md "Support model"). */
export const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  CREATOR_SUPPORTED: "Creator-supported",
  PLATFORM_SUPPORTED: "Platform-supported",
  COMMUNITY_SUPPORTED: "Community-supported",
  UNSUPPORTED: "Unsupported",
};

/**
 * The support channel is creator-supplied. It becomes a link only if it
 * parses as a plain http(s) URL with no embedded credentials — anything else
 * (javascript:, data:, mailto:, an email address, free text) is shown as
 * text, never as a link, so a hostile value can't become a clickable script.
 */
export function safeSupportChannelHref(channel: string | null | undefined): string | null {
  const text = normalizeDisplayText(channel);
  if (text === null) {
    return null;
  }
  try {
    const url = new URL(text);
    const isWeb = url.protocol === "https:" || url.protocol === "http:";
    return isWeb && url.username === "" && url.password === "" ? url.toString() : null;
  } catch {
    return null;
  }
}

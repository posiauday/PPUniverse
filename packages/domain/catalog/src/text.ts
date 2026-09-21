/**
 * Creator- and moderator-supplied text (compatibility notes, evidence
 * summaries, support channel) is untrusted. React escapes it on render, so
 * HTML can't be injected; this additionally normalizes it to a single line
 * and strips characters that can hide or spoof content — control characters,
 * zero-width characters, and bidirectional overrides/isolates.
 */
function isStrippedCodePoint(code: number): boolean {
  return (
    code < 0x20 ||
    (code >= 0x7f && code <= 0x9f) ||
    (code >= 0x200b && code <= 0x200f) ||
    (code >= 0x202a && code <= 0x202e) ||
    (code >= 0x2060 && code <= 0x2064) ||
    (code >= 0x2066 && code <= 0x2069)
  );
}

/** Returns the cleaned text, or null when nothing meaningful is left. */
export function normalizeDisplayText(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  let stripped = "";
  for (const character of raw.replace(/\s+/g, " ")) {
    if (!isStrippedCodePoint(character.codePointAt(0) ?? 0)) {
      stripped += character;
    }
  }
  const cleaned = stripped.replace(/ {2,}/g, " ").trim();
  return cleaned === "" ? null : cleaned;
}

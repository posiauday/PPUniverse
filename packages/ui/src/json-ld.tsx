/**
 * JSON-LD structured data (MVP-021, FR-017).
 *
 * This file contains the ONLY `dangerouslySetInnerHTML` in the codebase (a
 * source-scan test in apps/web enforces that). It is safe because of two
 * constraints, both tested:
 *   1. It accepts a typed object, never a string, so nothing is concatenated
 *      into script markup — creator-supplied text can only ever be a JSON
 *      string value.
 *   2. The serialized JSON is escaped so it cannot close the script element or
 *      open another element: every "<" (and ">", "&", U+2028, U+2029) becomes a
 *      JSON unicode escape, which JSON.parse turns back into the same text.
 *
 * The escape sequences are built from character codes rather than written as
 * literals so the intent stays visible and no editor or tool can normalize them.
 */

/** A JSON value the structured-data builders may emit. There is deliberately no `null`/`undefined`: unavailable properties are omitted, never emitted empty. */
export type JsonLdValue = string | number | boolean | JsonLdObject | readonly JsonLdValue[];

export interface JsonLdObject {
  readonly [key: string]: JsonLdValue;
}

const BACKSLASH = String.fromCharCode(0x5c);
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

/** Characters that could end a <script> element, start an HTML comment, or break older JavaScript parsers. */
const UNSAFE_CHARACTERS = new RegExp(`[<>&${LINE_SEPARATOR}${PARAGRAPH_SEPARATOR}]`, "g");

function toUnicodeEscape(character: string): string {
  return `${BACKSLASH}u${character.charCodeAt(0).toString(16).padStart(4, "0")}`;
}

/** `JSON.stringify`, then escape every character that is unsafe inside a script element. The result parses back to the original value. */
export function serializeJsonLd(data: JsonLdObject): string {
  return JSON.stringify(data).replace(UNSAFE_CHARACTERS, toUnicodeEscape);
}

export interface JsonLdProps {
  data: JsonLdObject;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

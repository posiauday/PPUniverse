/**
 * The visible text of rendered markup, for tests that assert on what a reader
 * sees. It keeps only the characters outside tags, one character at a time,
 * so no part of a tag can survive (a regex replace of "<...>" can leave one
 * behind, which CodeQL rightly flags). Test-only: never use it to clean
 * untrusted input; real pages render text through React, which escapes it.
 */
export function textOf(html: string): string {
  let text = "";
  let inTag = false;
  for (const char of html) {
    if (char === "<") inTag = true;
    else if (char === ">") inTag = false;
    else if (!inTag) text += char;
  }
  return text;
}

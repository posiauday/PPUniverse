export interface HeadingInfo {
  level: number;
  text: string;
}

/**
 * Checks a page's heading outline in document order: exactly one h1, first
 * heading is the h1, and no level is skipped when going deeper (h1 then h3 is a
 * skip; going back up, h3 then h2, is fine). Returns human-readable problems;
 * an empty array means the outline is well-formed.
 */
export function headingOrderProblems(headings: readonly HeadingInfo[]): string[] {
  const problems: string[] = [];
  const h1Count = headings.filter((h) => h.level === 1).length;

  if (headings.length === 0) return ["the page has no headings"];
  if (h1Count !== 1) problems.push(`expected exactly one h1, found ${h1Count}`);

  const first = headings[0];
  if (first && first.level !== 1) {
    problems.push(`the first heading is an h${first.level} ("${first.text}"), not the h1`);
  }

  for (let i = 1; i < headings.length; i++) {
    const previous = headings[i - 1];
    const current = headings[i];
    if (previous && current && current.level > previous.level + 1) {
      problems.push(
        `h${previous.level} ("${previous.text}") is followed by h${current.level} ("${current.text}"), skipping a level`,
      );
    }
  }
  return problems;
}

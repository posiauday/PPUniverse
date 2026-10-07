/**
 * What a guide's header shows about how it was checked, read from its own
 * Markdown (MVP-038 part, slice 1 of docs/plans/guide-and-hub-redesign.md).
 * No database field: the guide states it, so the header can't claim more
 * than the guide does.
 *
 * - **Checked on:** a note block starting "Checked against Microsoft Learn
 *   on 6 October 2026." gives the trust strip its date. A note that says only
 *   that leaves the body (it would say the same thing twice). A guide
 *   without one shows no date: the site never claims a check it can't
 *   point to.
 * - **Sources:** the number of list items under the "Sources" heading.
 * - **Quick answer:** an optional `> [!ANSWER] Title` block, a short numbered
 *   list, shown as the header's card and left out of the body.
 */

export interface GuideTrust {
  /** The date the guide says it was checked against Microsoft Learn, or null. */
  checkedOn: Date | null;
  /** How many sources the guide lists under "Sources". */
  sourceCount: number;
  /** The quick-answer card, if the guide has one. */
  quickAnswer: { title: string; markdown: string } | null;
  /** The body with the checked-on note and the quick answer taken out. */
  body: string;
}

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

/** "Checked against Microsoft Learn on 6 October 2026." and anything the note adds after it. */
const CHECKED_LINE = /^checked against microsoft learn on (\d{1,2}) ([a-z]+) (\d{4})\.?(.*)$/i;

/** A blockquote's lines, with their "> " markers removed. */
function quoteLines(lines: readonly string[]): string[] {
  return lines.map((line) => line.replace(/^>\s?/, ""));
}

/** Splits Markdown into blocks: runs of lines separated by blank lines. */
function blocks(markdown: string): string[][] {
  const out: string[][] = [];
  let current: string[] = [];
  for (const line of markdown.replace(/\r\n/g, "\n").split("\n")) {
    if (line.trim() === "") {
      if (current.length) out.push(current);
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length) out.push(current);
  return out;
}

function parseDate(day: string, month: string, year: string): Date | null {
  const index = MONTHS.indexOf(month.toLowerCase());
  if (index < 0) return null;
  const date = new Date(Date.UTC(Number(year), index, Number(day)));
  // Rejects 31 September and the like, which Date would roll over.
  return date.getUTCMonth() === index && date.getUTCDate() === Number(day) ? date : null;
}

export function readGuideTrust(markdown: string): GuideTrust {
  let checkedOn: Date | null = null;
  let quickAnswer: GuideTrust["quickAnswer"] = null;
  const kept: string[][] = [];

  for (const block of blocks(markdown)) {
    const isQuote = block.every((line) => line.startsWith(">"));
    if (isQuote) {
      const lines = quoteLines(block);
      const marker = lines[0]?.trim() ?? "";
      if (/^\[!NOTE\]$/i.test(marker) && lines.length >= 2 && !checkedOn) {
        const match = CHECKED_LINE.exec(lines[1]!.trim());
        const date = match ? parseDate(match[1]!, match[2]!, match[3]!) : null;
        if (date) {
          checkedOn = date;
          // A note that says only the date leaves the body; one that adds
          // more ("Microsoft's licensing guide is the final word…") stays.
          if (lines.length === 2 && !match![4]!.trim()) continue;
        }
      }
      const answer = /^\[!ANSWER\]\s*(.*)$/i.exec(marker);
      if (answer && !quickAnswer) {
        quickAnswer = {
          title: answer[1]?.trim() || "Quick answer",
          markdown: lines.slice(1).join("\n").trim(),
        };
        continue;
      }
    }
    kept.push(block);
  }

  return {
    checkedOn,
    sourceCount: countSources(markdown),
    quickAnswer,
    body: kept.map((block) => block.join("\n")).join("\n\n"),
  };
}

/** List items under a "## Sources" heading, up to the next heading. */
function countSources(markdown: string): number {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const start = lines.findIndex((line) => /^#{2,3}\s+sources\s*$/i.test(line.trim()));
  if (start < 0) return 0;
  let count = 0;
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,6}\s/.test(line)) break;
    if (/^\s{0,3}(?:[-*+]|\d+[.)])\s+\S/.test(line)) count += 1;
  }
  return count;
}

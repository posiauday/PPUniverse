import { commentRepository } from "./comments";
import { componentRepository } from "./components";
import { contentRepository } from "./content";
import { feedbackRepository } from "./feedback";
import { commentsEnabled } from "./feature-flags";
import { updateRepository } from "./updates";

/** How many of each kind the Inbox shows; the kind's own page has the rest. */
export const INBOX_PER_KIND = 5;

export type InboxGroup = "community" | "content";

/**
 * One thing waiting for the admin, in the Overview's Inbox (docs/final-decisions.md,
 * 2026-10-10, "Admin centre: concept A with B's Inbox"). Each kind is acted on
 * with the same controls and routes as its own page.
 */
export type InboxItem =
  | {
      kind: "comment";
      group: "community";
      id: string;
      text: string;
      on: { kind: "guide" | "component"; slug: string; title: string };
      reports: number;
      at: Date;
    }
  | {
      kind: "report";
      group: "community";
      id: string;
      text: string;
      guide: { slug: string; title: string };
      at: Date;
    }
  | { kind: "guide-draft"; group: "content"; id: string; title: string; at: Date }
  | { kind: "update-draft"; group: "content"; id: string; title: string; at: Date }
  | { kind: "test"; group: "content"; id: string; title: string; version: string; at: Date }
  | {
      kind: "scheduled";
      group: "content";
      id: string;
      title: string;
      what: "guide" | "update";
      at: Date;
    };

const newestFirst = <T extends { at: Date }>(items: T[]) =>
  [...items].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, INBOX_PER_KIND);

/**
 * Everything waiting, community first (people are waiting on those), then
 * content: drafts, paste-tests and what's scheduled. Each kind is read
 * separately; one that can't be read is left out rather than failing the page.
 */
export async function loadInbox(): Promise<InboxItem[]> {
  const safe = <T>(read: Promise<T>, fallback: T) => read.catch(() => fallback);
  const [comments, reports, articles, updates, components] = await Promise.all([
    commentsEnabled()
      ? safe(commentRepository.listForAdmin("reported", INBOX_PER_KIND), [])
      : Promise.resolve([]),
    safe(feedbackRepository.listOpenReports(INBOX_PER_KIND), []),
    safe(contentRepository.listArticles(), []),
    safe(updateRepository.listUpdates(), []),
    safe(componentRepository.listForAdmin(), []),
  ]);

  const drafts = articles.filter((a) => a.status === "DRAFT");
  const updateDrafts = updates.filter((u) => u.status === "DRAFT");
  return [
    ...comments.map((c): InboxItem => ({
      kind: "comment",
      group: "community",
      id: c.id,
      text: c.body,
      on: c.on,
      reports: c.reportCount,
      at: c.createdAt,
    })),
    ...reports.map((r): InboxItem => ({
      kind: "report",
      group: "community",
      id: r.id,
      text: r.message,
      guide: { slug: r.articleSlug, title: r.articleTitle },
      at: r.createdAt,
    })),
    ...newestFirst(
      drafts
        .filter((a) => !a.scheduledFor)
        .map((a) => ({
          kind: "guide-draft" as const,
          group: "content" as const,
          id: a.id,
          title: a.title,
          at: a.updatedAt,
        })),
    ),
    ...newestFirst(
      updateDrafts
        .filter((u) => !u.scheduledFor)
        .map((u) => ({
          kind: "update-draft" as const,
          group: "content" as const,
          id: u.id,
          title: u.title,
          at: u.updatedAt,
        })),
    ),
    ...newestFirst(
      components
        .filter((c) => c.status === "DRAFT" && !c.hidden && !c.testedAt)
        .map((c) => ({
          kind: "test" as const,
          group: "content" as const,
          id: c.id,
          title: c.title,
          version: c.version,
          at: c.updatedAt,
        })),
    ),
    ...[
      ...drafts.flatMap((a) =>
        a.scheduledFor
          ? [
              {
                kind: "scheduled" as const,
                group: "content" as const,
                id: a.id,
                title: a.title,
                what: "guide" as const,
                at: a.scheduledFor,
              },
            ]
          : [],
      ),
      ...updateDrafts.flatMap((u) =>
        u.scheduledFor
          ? [
              {
                kind: "scheduled" as const,
                group: "content" as const,
                id: u.id,
                title: u.title,
                what: "update" as const,
                at: u.scheduledFor,
              },
            ]
          : [],
      ),
    ]
      // Soonest first: the next thing to go live leads.
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .slice(0, INBOX_PER_KIND),
  ];
}

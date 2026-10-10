import {
  commentLinks,
  commentParts,
  type GuideComment,
  type PublicProfile,
} from "@ppu/domain-content";
import Link from "next/link";
import { Avatar } from "../Avatar";
import { CommentActions } from "./CommentActions";
import { CommentForm } from "./CommentForm";

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Plain text with its line breaks, and any http(s) address as a link marked
 * rel="ugc nofollow" (Google's advice for links in user content). React
 * escapes everything else, so a comment can't add HTML.
 */
function TextWithLinks({ text }: { text: string }) {
  const links = commentLinks(text);
  if (links.length === 0) return <>{text}</>;
  const nodes: React.ReactNode[] = [];
  let rest = text;
  links.forEach((url, index) => {
    const at = rest.indexOf(url);
    nodes.push(rest.slice(0, at));
    nodes.push(
      <a
        key={index}
        href={url}
        rel="ugc nofollow noopener"
        className="break-all underline underline-offset-4"
      >
        {url}
      </a>,
    );
    rest = rest.slice(at + url.length);
  });
  nodes.push(rest);
  return <>{nodes}</>;
}

function CommentBody({ body }: { body: string }) {
  return (
    <div className="mt-2 flex flex-col gap-3 text-[1.0625rem] leading-relaxed">
      {commentParts(body).map((part, index) =>
        part.kind === "code" ? (
          <pre
            key={index}
            tabIndex={0}
            aria-label="Code, scrollable"
            className="overflow-x-auto rounded-2xl bg-muted p-3.5 font-mono text-sm"
          >
            <code>{part.text}</code>
          </pre>
        ) : (
          <p key={index} className="whitespace-pre-line [overflow-wrap:anywhere]">
            <TextWithLinks text={part.text} />
          </p>
        ),
      )}
    </div>
  );
}

/** What the section says on a guide (MVP-040) and on a component's page (MVP-051). */
const WORDS = {
  guide: {
    heading: "Comments",
    empty: "No comments yet. Share what worked for you.",
    accepted: "Accepted fix",
    signIn: "Sign in to comment",
    path: "guides",
  },
  component: {
    heading: "Questions and discussion",
    empty: "No questions yet. Ask one, or share how you used it.",
    accepted: "Accepted answer",
    signIn: "Sign in to ask or answer",
    path: "components",
  },
} as const;

/**
 * Comments under a guide (MVP-040) or a component (MVP-051): shown at once,
 * under each reader's display name and generated avatar, never their email.
 * An admin's accepted fix or answer comes first. Signed-in readers get the
 * form; others a sign-in link.
 */
export function GuideComments({
  slug,
  comments,
  viewer,
  kind = "guide",
}: {
  kind?: "guide" | "component";
  slug: string;
  comments: readonly GuideComment[];
  /** The signed-in reader's profile, or null for a guest. */
  viewer: PublicProfile | null;
}) {
  // Underscored ids, like the rest of the guide page's own: heading slugs
  // never contain one, so a "## Comments" heading in a guide can't clash.
  const headingId = "reader_comments_heading";
  const words = WORDS[kind];
  return (
    <section
      aria-labelledby={headingId}
      id="reader_comments"
      className="mt-14 flex scroll-mt-28 flex-col gap-5"
    >
      <h2 id={headingId} className="font-display text-2xl font-bold">
        {words.heading}
        {comments.length > 0 ? ` (${comments.length})` : ""}
      </h2>

      {comments.length === 0 ? (
        <p className="text-muted-foreground">{words.empty}</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className={`rounded-[1.5rem] border p-5 ${
                comment.accepted ? "border-primary bg-highlight/40" : "border-border bg-card"
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Avatar seed={comment.avatarSeed} name={comment.displayName} size={40} />
                <span className="font-semibold">{comment.displayName}</span>
                <time
                  dateTime={comment.createdAt.toISOString()}
                  className="text-sm text-muted-foreground"
                >
                  {DATE_FORMAT.format(comment.createdAt)}
                </time>
                {comment.accepted ? (
                  <span className="rounded-full bg-highlight px-2.5 py-0.5 text-sm font-semibold text-highlight-foreground">
                    {words.accepted}
                  </span>
                ) : null}
              </div>
              <CommentBody body={comment.body} />
              <CommentActions id={comment.id} mine={comment.mine} author={comment.displayName} />
            </li>
          ))}
        </ol>
      )}

      {viewer ? (
        <CommentForm slug={slug} viewer={viewer} kind={kind} />
      ) : (
        <p>
          <Link
            href={`/signin?callbackUrl=${encodeURIComponent(`/${words.path}/${slug}#reader_comments`)}`}
            className="font-semibold underline underline-offset-4"
          >
            {words.signIn}
          </Link>
          . Comments show under a display name you choose, never your email.
        </p>
      )}
    </section>
  );
}

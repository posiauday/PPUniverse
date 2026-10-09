import Link from "next/link";
import { LocalTime } from "../admin/LocalTime";

/**
 * The strip above an admin's preview of a draft (MVP-050): says it's a
 * preview, when (if ever) it is scheduled, and leads back to the editor.
 */
export function PreviewBanner({
  noun,
  scheduledFor,
  editHref,
}: {
  noun: string;
  scheduledFor: Date | null;
  editHref: string;
}) {
  return (
    <div className="mx-auto mt-4 flex max-w-[77.5rem] flex-wrap items-center justify-between gap-3 rounded-[1.5rem] bg-highlight px-6 py-4 text-highlight-foreground">
      <p>
        <strong>Preview.</strong> This {noun} is a draft
        {scheduledFor ? (
          <>
            , scheduled for <LocalTime iso={scheduledFor.toISOString()} />
          </>
        ) : (
          ", not scheduled"
        )}
        . Only admins can see this page.
      </p>
      <Link
        href={editHref}
        className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
      >
        Back to editing
      </Link>
    </div>
  );
}

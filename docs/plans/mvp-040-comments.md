# MVP-040: comments on guides

**Status:** built behind `FEATURE_COMMENTS` (off). **Waiting on the product owner:** approval of the Terms and Privacy wording below, then switch the flag on in Netlify.

**Decisions it implements** (`docs/final-decisions.md`): "Hub framing, reference pages, trust signals and community solutions" (2026-10-06) and "Top bar names, AI search readiness, and comments" (2026-10-07):
- signed-in readers only;
- comments show at once, and an admin removes them after reports;
- a random, Power Platform-flavoured display name and avatar for every signed-in reader, which they can change;
- plain text and code only; links get `rel="ugc nofollow"`;
- an admin can mark one comment as the accepted fix.

Defaults applied where nothing was decided: open questions 70 to 75.

## What's built

| Part | Where |
| --- | --- |
| Data | Migration `20261010000000_add_comments_and_profiles`: `users.displayName`, `displayNameKey` (unique, lowercased), `avatarSeed`; tables `article_comments` and `comment_reports`. Additive; rollback in the file |
| Rules | `packages/domain/content/src/comments.ts`: text cleaning, link cap, paragraphs and code, name generation and validation, avatar from seed |
| Storage | `packages/adapters/content/src/comment-repository.ts` (integration-tested on Postgres) |
| Routes | `POST /api/guides/[slug]/comments`, `/api/comments/[id]/report`, `/api/comments/[id]/delete`, `/api/account/profile`, `/api/admin/comments/[id]/[action]` (remove, restore, accept, unaccept) |
| Pages | The guide's Comments section; `/account/profile`; `/admin/comments` (linked from the admin home when on) |
| Gate | Comments on in the gate's server; states for the guest and member views, a too-short comment, the profile and its error, the admin page and its 404 |

**Privacy by design:** a comment is shown only with the display name and avatar. The email address and the name a sign-in provider (Google) gives are never selected for it. Reports keep nothing about the reporter; limits use the existing hashed counters, deleted after a day. The comment text is never logged.

## Proposed Terms wording (for approval)

A new section, "Comments", after "Your account":

> **Comments.** If you're signed in, you can comment on guides. Comments are public, under your display name and avatar, and appear straight away.
>
> - **Be useful and kind.** No spam or advertising, nothing unlawful, hateful or harassing, and no one else's personal details. Don't pretend to be someone else, or to speak for LowCodeStacks or Microsoft.
> - **What you post stays yours.** You give us a non-exclusive, worldwide, royalty-free licence to show, store and format it on lowcodestacks.com, for as long as it's there. Code you share in a comment may be reused by others under the [MIT License](#mit-license), like ours.
> - **We may remove comments** that break these rules, or that readers report and we agree with, and suspend accounts used to break them. You can delete your own comments at any time.

## Proposed Privacy wording (for approval)

A new section, "Comments and your profile", after "Feedback on guides":

> If you're signed in, we give you a **display name** and an **avatar** at random, which you can change on your profile page. When you comment, we store the comment, the guide it's on, when you posted it, and your account. Your comment is public, shown with your display name and avatar, **never your email address**.
>
> - You can delete your comments at any time; they're gone straight away.
> - If we remove a comment that breaks the Terms, we keep it, hidden, so a mistake can be undone. It's deleted with your account.
> - Anyone can report a comment. We keep only that it was reported and when, nothing about who reported it. To limit abuse we keep a scrambled (hashed) counter for each address for a day.

Both pages then get new versions and effective dates (a migration like `20261009000000_add_policy_versions_2026_10_09`), as each promises.

## Later: account erasure

`article_comments.userId` is `ON DELETE RESTRICT`, like every other table that points at a user, so a user row can't be deleted while it has comments. Account erasure isn't built yet (open question 46). When it is, it must delete the reader's comments (and with them their reports) first. The Privacy wording above already says comments are deleted with the account.

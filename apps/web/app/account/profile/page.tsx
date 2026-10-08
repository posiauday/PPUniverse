import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { commentRepository, currentUserId, secureRandom } from "../../../lib/comments";
import { commentsEnabled, learnEnabled } from "../../../lib/feature-flags";
import { learnRepository } from "../../../lib/learn";
import { SITE_NAME } from "../../../lib/seo/site";
import { Avatar } from "../../Avatar";
import { ClearProgressButton } from "../../topics/ProgressControls";
import { ProfileForm } from "./ProfileForm";

// Authenticated, self-service account content: not indexed, like every other
// /account page (the root layout's default noindex is inherited).
export const metadata: Metadata = { title: `Your profile | ${SITE_NAME}` };

export const dynamic = "force-dynamic";

/**
 * The reader's public profile (MVP-040): the display name and generated
 * avatar their comments show. Both were given at random; either can be
 * changed. The email address is never shown on the site.
 */
export default async function AccountProfilePage() {
  if (!commentsEnabled()) notFound();
  const userId = await currentUserId();
  if (!userId) redirect("/signin?callbackUrl=%2Faccount%2Fprofile");
  const profile = await commentRepository.getOrCreateProfile(userId, secureRandom);
  // MVP-048: the reader's Learn progress, which only they see and can clear.
  const progress = learnEnabled() ? await learnRepository.listProgress(userId) : null;

  return (
    <main className="mx-auto max-w-[46rem] px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Your profile</h1>
      <p className="mt-3">
        Your comments show this name and avatar. They were picked at random; change them whenever
        you like. Your email address is never shown.
      </p>
      <div className="mt-6 flex items-center gap-4">
        <Avatar seed={profile.avatarSeed} size={64} />
        <p className="font-display text-2xl font-bold">{profile.displayName}</p>
      </div>
      <ProfileForm displayName={profile.displayName} />
      {progress ? (
        <section aria-labelledby="learn_progress" className="mt-10">
          <h2 id="learn_progress" className="font-display text-2xl font-bold">
            Learn progress
          </h2>
          {progress.length === 0 ? (
            <p className="mt-2">
              No lessons marked done yet.{" "}
              <Link href="/topics" className="underline underline-offset-4">
                Browse the topics
              </Link>
              .
            </p>
          ) : (
            <>
              <ul className="mt-3 flex flex-col gap-2">
                {progress.map((topic) => (
                  <li key={topic.topicSlug} className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/topics/${encodeURIComponent(topic.topicSlug)}`}
                      className="font-semibold underline underline-offset-4"
                    >
                      {topic.topicTitle}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {topic.done} of {topic.total} lessons done
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">Only you can see this.</p>
              <ClearProgressButton />
            </>
          )}
        </section>
      ) : null}
      <p className="mt-8">
        <Link href="/account/sessions" className="underline underline-offset-4">
          Your sign-in sessions
        </Link>{" "}
        ·{" "}
        <Link href="/account/privacy" className="underline underline-offset-4">
          Privacy and your data
        </Link>
      </p>
    </main>
  );
}

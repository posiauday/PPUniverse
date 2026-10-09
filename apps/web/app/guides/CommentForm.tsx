"use client";

import type { PublicProfile } from "@ppu/domain-content";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { postJson } from "../../lib/post-json";
import { Avatar } from "../Avatar";

const MAX = 2000;

type State =
  "idle" | "busy" | "posted" | "too-short" | "too-long" | "too-many-links" | "too-many" | "error";

const MESSAGE: Partial<Record<State, string>> = {
  posted: "Thanks. Your comment is up.",
  "too-short": "Please write at least 10 characters.",
  "too-long": `Please keep it to ${MAX} characters.`,
  "too-many-links": "Please include at most 2 links.",
  "too-many": "You've posted a few comments already. Please try again later.",
  error: "Something went wrong posting that. Please try again.",
};

/** The comment box under a guide, for a signed-in reader (MVP-040). */
export function CommentForm({ slug, viewer }: { slug: string; viewer: PublicProfile }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [state, setState] = useState<State>("idle");
  const fieldId = useId();
  const hintId = useId();
  const statusId = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "busy") return;
    setState("busy");
    const answer = await postJson(`/api/guides/${encodeURIComponent(slug)}/comments`, {
      body: text,
    });
    if (answer.status === 200) {
      setText("");
      setState("posted");
      router.refresh();
      return;
    }
    const known = ["too-short", "too-long", "too-many-links", "too-many"] as const;
    const problem = known.find((code) => code === answer.error);
    setState(problem ?? "error");
    fieldRef.current?.focus();
  }

  const invalid = state === "too-short" || state === "too-long" || state === "too-many-links";
  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-2.5 rounded-[1.5rem] border border-border bg-card p-5"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <Avatar seed={viewer.avatarSeed} name={viewer.displayName} size={32} />
        <label htmlFor={fieldId} className="font-semibold">
          Add a comment
        </label>
        <span className="text-sm text-muted-foreground">
          as {viewer.displayName} ·{" "}
          <Link href="/account/profile" className="underline underline-offset-4">
            change
          </Link>
        </span>
      </div>
      <p id={hintId} className="text-sm text-muted-foreground">
        Plain text, shown publicly under your display name. Put code between two lines of three
        backticks (```). Up to 2 links. Please don&rsquo;t share personal details.
      </p>
      <textarea
        ref={fieldRef}
        id={fieldId}
        value={text}
        maxLength={MAX}
        rows={5}
        onChange={(event) => setText(event.target.value)}
        aria-describedby={`${hintId} ${statusId}`}
        aria-invalid={invalid}
        className="w-full rounded-2xl border-[1.5px] border-muted-foreground bg-card p-3 text-base text-foreground"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          aria-disabled={state === "busy"}
          className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground"
        >
          {state === "busy" ? "Posting…" : "Post comment"}
        </button>
        <span className="text-sm text-muted-foreground" aria-hidden="true">
          {[...text].length}/{MAX}
        </span>
      </div>
      <p id={statusId} role="status" className="font-medium empty:hidden">
        {MESSAGE[state] ?? ""}
      </p>
    </form>
  );
}

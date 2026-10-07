"use client";

import { useEffect, useId, useRef, useState } from "react";
import { postJson as post } from "../../lib/post-json";

const REPORT_MAX = 500;

type Vote = "yes" | "no";
type ReportState = "idle" | "busy" | "sent" | "too-short" | "too-long" | "too-many" | "error";

const REPORT_MESSAGE: Partial<Record<ReportState, string>> = {
  sent: "Thanks. We'll re-check this guide.",
  "too-short": "Please write at least 10 characters.",
  "too-long": `Please keep it to ${REPORT_MAX} characters.`,
  "too-many": "You've sent a few reports already. Please try again in an hour.",
  error: "Something went wrong sending that. Please try again.",
};

/**
 * The end of every guide (the G1 board; MVP-039 votes, MVP-038 reports):
 * "Did this fix it?" on fix guides ("Was this helpful?" on the rest), and
 * "Something here changed?", a short anonymous note. Nothing about the
 * reader is stored; the Privacy notice says what is. Choosing "Not yet"
 * opens the note, so the reader can say what was missing.
 */
export function GuideFeedback({ slug, isFix }: { slug: string; isFix: boolean }) {
  const [vote, setVote] = useState<Vote | null>(null);
  const [voting, setVoting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [report, setReport] = useState<ReportState>("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // The vote buttons go away once used, so focus moves to the thanks.
  const thanksRef = useRef<HTMLParagraphElement>(null);
  // Where focus goes next. Moved in an effect, after React has rendered: the
  // thanks is hidden while empty, and a hidden element can't take focus
  // (BUG-028: an animation-frame focus sometimes ran before the render).
  const [focusNext, setFocusNext] = useState<"thanks" | "note" | null>(null);
  useEffect(() => {
    if (focusNext === "thanks") thanksRef.current?.focus();
    if (focusNext === "note") textareaRef.current?.focus();
    if (focusNext) setFocusNext(null);
  }, [focusNext]);
  const headingId = useId();
  const fieldId = useId();
  const hintId = useId();
  const reportStatusId = useId();
  const base = `/api/guides/${encodeURIComponent(slug)}`;

  async function sendVote(choice: Vote) {
    if (voting || vote) return;
    setVoting(true);
    await post(`${base}/vote`, { helpful: choice });
    // Thanked either way: a vote that couldn't be counted isn't the reader's problem.
    setVote(choice);
    setVoting(false);
    if (choice === "no") {
      setReportOpen(true);
      setFocusNext("note");
    } else {
      setFocusNext("thanks");
    }
  }

  async function sendReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (report === "busy" || report === "sent") return;
    if ([...message.trim()].length < 10) {
      setReport("too-short");
      textareaRef.current?.focus();
      return;
    }
    setReport("busy");
    const answer = await post(`${base}/report`, { message });
    if (answer.status === 200) setReport("sent");
    else if (
      answer.error === "too-short" ||
      answer.error === "too-long" ||
      answer.error === "too-many"
    )
      setReport(answer.error);
    else setReport("error");
  }

  const invalid = report === "too-short" || report === "too-long";
  return (
    <section
      aria-labelledby={headingId}
      className="mt-14 flex flex-col gap-4 rounded-[1.625rem] bg-tech-apps p-6 text-foreground md:p-7"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 id={headingId} className="mr-auto font-display text-2xl font-bold">
          {isFix ? "Did this fix it?" : "Was this helpful?"}
        </h2>
        {vote ? null : (
          <>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-foreground bg-card px-[18px] font-semibold"
              aria-disabled={voting}
              onClick={() => void sendVote("yes")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                aria-hidden="true"
              >
                <path d="M5 12l5 5 9-10" />
              </svg>
              {isFix ? "Yes, fixed" : "Yes"}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-foreground bg-card px-[18px] font-semibold"
              aria-disabled={voting}
              onClick={() => void sendVote("no")}
            >
              {isFix ? "Not yet" : "Not really"}
            </button>
          </>
        )}
      </div>
      <p ref={thanksRef} tabIndex={-1} role="status" className="font-medium empty:hidden">
        {vote === "yes" ? "Thanks! Glad it helped." : null}
        {vote === "no" ? "Thanks for telling us. What was missing or wrong? Tell us below." : null}
      </p>

      {reportOpen ? (
        <form onSubmit={sendReport} noValidate className="flex flex-col gap-2.5">
          <label htmlFor={fieldId} className="font-semibold">
            What changed, or what&rsquo;s wrong?
          </label>
          <p id={hintId} className="text-sm text-muted-foreground">
            10 to {REPORT_MAX} characters. Please don&rsquo;t include personal details: we
            can&rsquo;t reply, and the note is deleted once we&rsquo;ve checked it.
          </p>
          <textarea
            ref={textareaRef}
            id={fieldId}
            value={message}
            maxLength={REPORT_MAX}
            rows={4}
            onChange={(event) => setMessage(event.target.value)}
            aria-describedby={`${hintId} ${reportStatusId}`}
            aria-invalid={invalid}
            disabled={report === "sent"}
            className="w-full rounded-2xl border-[1.5px] border-muted-foreground bg-card p-3 text-base text-foreground"
          />
          <div className="flex flex-wrap items-center gap-3">
            {report === "sent" ? null : (
              <button
                type="submit"
                className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground"
                aria-disabled={report === "busy"}
              >
                {report === "busy" ? "Sending…" : "Send"}
              </button>
            )}
            <span className="text-sm text-muted-foreground" aria-hidden="true">
              {[...message].length}/{REPORT_MAX}
            </span>
          </div>
          <p id={reportStatusId} role="status" className="font-medium empty:hidden">
            {REPORT_MESSAGE[report] ?? ""}
          </p>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setReportOpen(true);
            setFocusNext("note");
          }}
          className="inline-flex min-h-11 items-center self-start text-left font-medium underline underline-offset-4"
        >
          Something here changed? Tell us and we&rsquo;ll re-check it.
        </button>
      )}
    </section>
  );
}

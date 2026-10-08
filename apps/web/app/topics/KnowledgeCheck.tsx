"use client";

import type { KnowledgeQuestion } from "@ppu/domain-content";
import { useState } from "react";

/**
 * "Check yourself" (MVP-048): the lesson's 2 or 3 questions, answered on the
 * page. After an answer, every option shows why it is right or wrong, with no
 * penalty (Microsoft Learn's knowledge-check rules). Nothing is stored or
 * sent: it is practice. The questions and answers are in the page's HTML, so
 * they read without JavaScript too; only the explanations need it.
 */
export function KnowledgeCheck({ questions }: { questions: readonly KnowledgeQuestion[] }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const answered = answers.filter((answer) => answer !== null).length;
  const right = answers.filter(
    (answer, index) => answer !== null && questions[index]?.options[answer]?.correct,
  ).length;

  return (
    <div className="flex flex-col gap-5 rounded-[1.5rem] border-[1.5px] border-foreground bg-card p-5 md:p-6">
      {questions.map((question, qIndex) => {
        const chosen = answers[qIndex] ?? null;
        const done = chosen !== null;
        return (
          <fieldset key={question.prompt} className="flex flex-col gap-2">
            <legend className="mb-2 font-semibold">
              {qIndex + 1}. {question.prompt}
            </legend>
            {question.options.map((option, oIndex) => {
              const state = !done
                ? "idle"
                : option.correct
                  ? "right"
                  : oIndex === chosen
                    ? "wrong"
                    : "other";
              return (
                <button
                  key={option.text}
                  type="button"
                  disabled={done}
                  aria-pressed={oIndex === chosen}
                  onClick={() =>
                    setAnswers((current) =>
                      current.map((value, i) => (i === qIndex ? oIndex : value)),
                    )
                  }
                  className={`flex w-full items-start gap-3 rounded-2xl border-[1.5px] px-3.5 py-2.5 text-left transition-colors disabled:cursor-default ${
                    state === "right"
                      ? "border-[#065f46] bg-[#d9f7e3]"
                      : state === "wrong"
                        ? "motion-shake border-[#9f1239] bg-[#fde2e1]"
                        : "border-border bg-card enabled:hover:border-accent"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-[0.6875rem] font-extrabold ${
                      state === "right"
                        ? "border-[#065f46] bg-[#065f46] text-white"
                        : state === "wrong"
                          ? "border-[#9f1239] bg-[#9f1239] text-white"
                          : "border-border"
                    }`}
                  >
                    {state === "right" ? "✓" : state === "wrong" ? "✕" : ""}
                  </span>
                  <span className="flex flex-col gap-1">
                    <span>
                      {option.text}
                      {state === "right" ? <span className="sr-only"> (right answer)</span> : null}
                      {state === "wrong" ? (
                        <span className="sr-only"> (your answer, not right)</span>
                      ) : null}
                    </span>
                    {done ? (
                      <span className="text-sm text-muted-foreground">{option.why}</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
            <p role="status" className="text-sm font-medium">
              {done
                ? question.options[chosen]?.correct
                  ? "Right."
                  : "Not quite: the right answer is marked, and every answer says why."
                : null}
            </p>
          </fieldset>
        );
      })}
      <p role="status" className="text-sm text-muted-foreground">
        {answered === questions.length
          ? `You got ${right} of ${questions.length}. Nothing is saved: this is just practice.`
          : null}
      </p>
    </div>
  );
}

"use client";

import { LESSON_SECTIONS } from "@ppu/domain-content";
import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { TECHNOLOGY_OPTIONS } from "../../../lib/technology-options";

/**
 * The admin's Learn topic and lesson forms (MVP-048 slice 1b). Like
 * UpdateForm, they only mirror the API's validation messages back; the server
 * decides. Publishing is the separate control on the topic pages.
 */

type Status = "idle" | "submitting" | "error";
type ControlProps = { id: string; "aria-invalid": boolean; "aria-describedby": string | undefined };

/** Submits `values` as JSON and goes to `done`, or shows the field errors. */
function useAdminForm<T extends Record<string, string>>(initial: T) {
  const router = useRouter();
  const [values, setValues] = useState<T>(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const baseId = useId();

  const set = (key: keyof T, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  async function submit(url: string, method: "POST" | "PATCH", done: string) {
    if (status === "submitting") return;
    setStatus("submitting");
    setFieldErrors({});
    setFormError(null);
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
          fieldErrors?: Record<string, string[]>;
        } | null;
        setFieldErrors(payload?.fieldErrors ?? {});
        setFormError(payload?.message ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      router.push(done);
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  /** A labelled field with its hint and every error wired to it (WCAG 1.3.1, 3.3.1). */
  function field(
    key: keyof T & string,
    label: string,
    control: (props: ControlProps) => ReactNode,
    hint?: string,
  ) {
    const id = `${baseId}-${key}`;
    const errors = fieldErrors[key] ?? [];
    const describedBy =
      [hint ? `${id}-hint` : null, errors.length > 0 ? `${id}-error` : null]
        .filter(Boolean)
        .join(" ") || undefined;
    return (
      <div className="mt-4 flex flex-col gap-1">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        {control({ id, "aria-invalid": errors.length > 0, "aria-describedby": describedBy })}
        {hint ? (
          <p id={`${id}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        ) : null}
        {errors.length === 1 ? (
          <p id={`${id}-error`} className="text-sm text-coral">
            {errors[0]}
          </p>
        ) : errors.length > 1 ? (
          <ul id={`${id}-error`} className="list-disc pl-5 text-sm text-coral">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  const input = (key: keyof T & string, type = "text") =>
    function Input(props: ControlProps) {
      return (
        <input
          {...props}
          type={type}
          value={values[key]}
          onChange={(event) => set(key, event.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2"
        />
      );
    };

  const footer = (label: string) => (
    <div className="mt-6">
      <button
        type="submit"
        aria-disabled={status === "submitting"}
        className="rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground"
      >
        {status === "submitting" ? "Saving…" : label}
      </button>
      <p role="status" className="mt-2">
        {formError}
      </p>
    </div>
  );

  return { values, set, submit, field, input, footer };
}

export interface TopicFormValues extends Record<string, string> {
  slug: string;
  title: string;
  summary: string;
  technology: string;
  /** A whole number as text. */
  sortOrder: string;
}

export function TopicForm({
  mode,
  topicId,
  initialValues,
}: {
  mode: "create" | "edit";
  topicId?: string;
  initialValues?: TopicFormValues;
}) {
  const form = useAdminForm<TopicFormValues>(
    initialValues ?? { slug: "", title: "", summary: "", technology: "POWER_APPS", sortOrder: "1" },
  );
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.submit(
          mode === "create" ? "/api/admin/topics" : `/api/admin/topics/${topicId}`,
          mode === "create" ? "POST" : "PATCH",
          "/admin/topics",
        );
      }}
    >
      {form.field(
        "title",
        "Title",
        form.input("title"),
        "What the topic explains, such as “Delegation in Power Apps”.",
      )}
      {form.field(
        "slug",
        "Slug",
        form.input("slug"),
        "Lower-case and hyphenated: the address, /topics/<slug>.",
      )}
      {form.field(
        "summary",
        "Summary",
        (props) => (
          <textarea
            {...props}
            rows={3}
            value={form.values.summary}
            onChange={(event) => form.set("summary", event.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2"
          />
        ),
        "One or two plain sentences: what it explains and for whom. 300 characters at most.",
      )}
      {form.field("technology", "Area", (props) => (
        <select
          {...props}
          value={form.values.technology}
          onChange={(event) => form.set("technology", event.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2"
        >
          {TECHNOLOGY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
      {form.field(
        "sortOrder",
        "Order in the area",
        form.input("sortOrder", "number"),
        "Lowest first.",
      )}
      {form.footer(mode === "create" ? "Create draft topic" : "Save changes")}
    </form>
  );
}

export interface LessonFormValues extends Record<string, string> {
  title: string;
  slug: string;
  position: string;
  minutes: string;
  /** One outcome per line. */
  outcomes: string;
  /** YYYY-MM-DD, or "". */
  checkedOn: string;
  body: string;
}

/** A starting point in the fixed shape, offered when the body is empty. */
const LESSON_OUTLINE = LESSON_SECTIONS.map((section) =>
  section === "Check yourself"
    ? [
        "## Check yourself",
        "",
        "> [!CHECK] The question?",
        "> - [x] The right answer",
        ">   Why it's right.",
        "> - [ ] A wrong answer",
        ">   Why it's wrong.",
        "",
        "> [!CHECK] A second question?",
        "> - [ ] A wrong answer",
        ">   Why it's wrong.",
        "> - [x] The right answer",
        ">   Why it's right.",
      ].join("\n")
    : section === "Sources"
      ? "## Sources\n\n- [Page title](https://learn.microsoft.com/...), checked <date>"
      : `## ${section}\n\n`,
).join("\n\n");

export function LessonForm({
  mode,
  topicId,
  lessonId,
  initialValues,
}: {
  mode: "create" | "edit";
  topicId: string;
  lessonId?: string;
  initialValues: LessonFormValues;
}) {
  const form = useAdminForm<LessonFormValues>(initialValues);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.submit(
          mode === "create"
            ? `/api/admin/topics/${topicId}/lessons`
            : `/api/admin/lessons/${lessonId}`,
          mode === "create" ? "POST" : "PATCH",
          `/admin/topics/${topicId}/edit`,
        );
      }}
    >
      {form.field("title", "Title", form.input("title"))}
      {form.field(
        "slug",
        "Slug",
        form.input("slug"),
        "Lower-case and hyphenated: /topics/<topic>/<slug>.",
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {form.field(
          "position",
          "Lesson number",
          form.input("position", "number"),
          "1 to 6, no gaps.",
        )}
        {form.field("minutes", "Minutes to read", form.input("minutes", "number"))}
        {form.field("checkedOn", "Checked on (optional)", form.input("checkedOn"), "YYYY-MM-DD")}
      </div>
      {form.field(
        "outcomes",
        "What you'll understand",
        (props) => (
          <textarea
            {...props}
            rows={3}
            value={form.values.outcomes}
            onChange={(event) => form.set("outcomes", event.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2"
          />
        ),
        "2 or 3 outcomes, one per line.",
      )}
      {form.field(
        "body",
        "Lesson",
        (props) => (
          <textarea
            {...props}
            rows={24}
            spellCheck
            value={form.values.body}
            onChange={(event) => form.set("body", event.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 font-mono text-sm"
          />
        ),
        `Markdown with exactly these sections, in order: ${LESSON_SECTIONS.join(", ")}. "Check yourself" has 2 or 3 questions, each with one right answer ([x]) and an explanation under every answer. "Sources" links at least one learn.microsoft.com page.`,
      )}
      {form.values.body.trim() === "" ? (
        <button
          type="button"
          onClick={() => form.set("body", LESSON_OUTLINE)}
          className="mt-2 rounded-full border border-foreground px-4 py-1.5 text-sm font-semibold"
        >
          Start from the lesson outline
        </button>
      ) : null}
      {form.footer(mode === "create" ? "Create draft lesson" : "Save changes")}
    </form>
  );
}

/** Publishes a topic or lesson; shows the server's reason when it can't. */
export function LearnPublishControl({
  endpoint,
  what,
}: {
  endpoint: string;
  what: "topic" | "lesson";
}) {
  const router = useRouter();
  const [state, setState] = useState<{ status: Status | "published"; message?: string }>({
    status: "idle",
  });

  async function publish() {
    if (state.status === "submitting") return;
    setState({ status: "submitting" });
    try {
      const response = await fetch(endpoint, { method: "POST" });
      if (response.ok) {
        setState({ status: "published" });
        router.refresh();
        return;
      }
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      setState({
        status: "error",
        message: payload?.message ?? "Something went wrong. Please try again.",
      });
    } catch {
      setState({ status: "error", message: "Something went wrong. Please try again." });
    }
  }

  if (state.status === "published") return <p role="status">Published.</p>;
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={publish}
        aria-disabled={state.status === "submitting"}
        className="rounded-full border border-foreground px-3 py-1 text-sm font-semibold"
      >
        {state.status === "submitting" ? "Publishing…" : `Publish ${what}`}
      </button>
      <span role="status" className="text-sm text-coral">
        {state.status === "error" ? state.message : null}
      </span>
    </span>
  );
}

"use client";

import { LESSON_SECTIONS } from "@ppu/domain-content";
import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { TECHNOLOGY_OPTIONS } from "../../../lib/technology-options";
import {
  EditorField,
  FIELD_CONTROL,
  SaveBar,
  useSlugFollowsTitle,
  type ControlProps,
} from "../EditorParts";

/**
 * The admin's Learn topic and lesson forms (MVP-048 slice 1b). Like
 * UpdateForm, they only mirror the API's validation messages back; the server
 * decides. Publishing is the separate control on the topic pages.
 */

type Status = "idle" | "submitting" | "error";

/**
 * Submits `values` as JSON and goes to `done`, or shows the field errors. A
 * new item's slug follows its title until the slug is typed (MVP-052 phase 4).
 */
function useAdminForm<T extends Record<string, string>>(initial: T, mode: "create" | "edit") {
  const router = useRouter();
  const [values, setValues] = useState<T>(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const slug = useSlugFollowsTitle(mode, initial["slug"] ?? "");
  const baseId = useId();
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  const set = (key: keyof T, value: string) => {
    if (key === "slug") slug.onSlugTyped(value);
    const nextSlug = key === "title" && "slug" in initial ? slug.fromTitle(value) : null;
    setValues((current) => ({
      ...current,
      [key]: value,
      ...(nextSlug === null ? {} : { slug: nextSlug }),
    }));
  };

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
    hint?: ReactNode,
  ) {
    return (
      <EditorField id={`${baseId}-${key}`} label={label} hint={hint} errors={fieldErrors[key]}>
        {control}
      </EditorField>
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
          className={
            key === "title"
              ? `${FIELD_CONTROL} text-lg font-semibold`
              : key === "slug"
                ? `${FIELD_CONTROL} font-mono text-sm`
                : FIELD_CONTROL
          }
        />
      );
    };

  const footer = (label: string, cancelHref: string) => (
    <SaveBar
      label={label}
      submitting={status === "submitting"}
      error={formError}
      dirty={dirty}
      cancelHref={cancelHref}
    />
  );

  /** The slug field's hint: the address, and whether it follows the title. */
  const slugHint = (address: string) =>
    `${address}${mode === "create" ? " It follows the title until you change it." : ""}`;

  return { values, set, submit, field, input, footer, slugHint };
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
    mode,
  );
  return (
    <form
      noValidate
      className="flex min-w-0 flex-col gap-5"
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
        form.slugHint(
          `Lower-case and hyphenated: the address, /topics/${form.values.slug || "<slug>"}.`,
        ),
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
            className={FIELD_CONTROL}
          />
        ),
        "One or two plain sentences: what it explains and for whom. 300 characters at most.",
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        {form.field("technology", "Area", (props) => (
          <select
            {...props}
            value={form.values.technology}
            onChange={(event) => form.set("technology", event.target.value)}
            className={FIELD_CONTROL}
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
      </div>
      {form.footer(mode === "create" ? "Create draft topic" : "Save changes", "/admin/topics")}
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
  const form = useAdminForm<LessonFormValues>(initialValues, mode);
  return (
    <form
      noValidate
      className="flex min-w-0 flex-col gap-5"
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
        form.slugHint("Lower-case and hyphenated: /topics/<topic>/<slug>."),
      )}
      <div className="grid gap-5 sm:grid-cols-3">
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
            className={FIELD_CONTROL}
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
            className={`${FIELD_CONTROL} font-mono text-sm leading-relaxed`}
          />
        ),
        `Markdown with exactly these sections, in order: ${LESSON_SECTIONS.join(", ")}. "Check yourself" has 2 or 3 questions, each with one right answer ([x]) and an explanation under every answer. "Sources" links at least one learn.microsoft.com page.`,
      )}
      {form.values.body.trim() === "" ? (
        <button
          type="button"
          onClick={() => form.set("body", LESSON_OUTLINE)}
          className="inline-flex min-h-11 w-fit items-center rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground hover:border-foreground"
        >
          Start from the lesson outline
        </button>
      ) : null}
      {form.footer(
        mode === "create" ? "Create draft lesson" : "Save changes",
        `/admin/topics/${topicId}/edit`,
      )}
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

  if (state.status === "published") {
    return (
      <span role="status" className="text-sm font-semibold">
        Published.
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={publish}
        aria-disabled={state.status === "submitting"}
        className="min-h-11 rounded-full bg-[#7c3aed] px-4 text-sm font-semibold text-white hover:bg-[#6d28d9]"
      >
        {state.status === "submitting" ? "Publishing…" : `Publish ${what}`}
      </button>
      <span role="status" className="text-sm text-coral">
        {state.status === "error" ? state.message : null}
      </span>
    </span>
  );
}

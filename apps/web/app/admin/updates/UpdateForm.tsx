"use client";

import { UPDATE_KINDS, UPDATE_KIND_LABEL } from "@ppu/domain-content";
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

export interface UpdateFormValues {
  slug: string;
  title: string;
  summary: string;
  /** "" means platform-wide. */
  technology: string;
  kind: string;
  action: string;
  sourceUrl: string;
  /** YYYY-MM-DD, or "" for none. */
  effectiveDate: string;
  replacement: string;
}

const DEFAULT_VALUES: UpdateFormValues = {
  slug: "",
  title: "",
  summary: "",
  technology: "",
  kind: "FEATURE",
  action: "",
  sourceUrl: "",
  effectiveDate: "",
  replacement: "",
};

type Status = "idle" | "submitting" | "error";

/**
 * Create/edit form for a platform update (MVP-033 slice D). Like ArticleForm,
 * it only mirrors the API's validation messages back; the server decides.
 * Publishing is the separate control on the list page. MVP-052 phase 4: the
 * title comes first and a new update's slug follows it; Save stays in view.
 */
export function UpdateForm({
  mode,
  updateId,
  initialValues,
}: {
  mode: "create" | "edit";
  updateId?: string;
  initialValues?: UpdateFormValues;
}) {
  const router = useRouter();
  const initial = initialValues ?? DEFAULT_VALUES;
  const [values, setValues] = useState<UpdateFormValues>(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const slug = useSlugFollowsTitle(mode, initial.slug);
  const baseId = useId();
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  function set<K extends keyof UpdateFormValues>(key: K, value: UpdateFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setFieldErrors({});
    setFormError(null);
    try {
      const response = await fetch(
        mode === "create" ? "/api/admin/updates" : `/api/admin/updates/${updateId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
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
      router.push("/admin/updates");
    } catch {
      setFormError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  /** A labelled field with its hint and error wired to it (WCAG 1.3.1, 3.3.1). */
  function field(
    key: keyof UpdateFormValues,
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

  const text = (key: keyof UpdateFormValues, type = "text") =>
    function Input(props: ControlProps) {
      return (
        <input
          {...props}
          type={type}
          value={values[key]}
          onChange={(e) => set(key, e.target.value)}
          className={FIELD_CONTROL}
        />
      );
    };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-w-0 flex-col gap-5">
      {field("title", "Title", (props) => (
        <input
          {...props}
          type="text"
          value={values.title}
          onChange={(e) => {
            const title = e.target.value;
            const next = slug.fromTitle(title);
            setValues((current) => ({
              ...current,
              title,
              ...(next === null ? {} : { slug: next }),
            }));
          }}
          className={`${FIELD_CONTROL} text-lg font-semibold`}
        />
      ))}
      {field(
        "slug",
        "Slug",
        (props) => (
          <input
            {...props}
            type="text"
            value={values.slug}
            onChange={(e) => {
              slug.onSlugTyped(e.target.value);
              set("slug", e.target.value);
            }}
            className={`${FIELD_CONTROL} font-mono text-sm`}
          />
        ),
        <>
          Lower-case and hyphenated. It is the item&apos;s anchor on /updates: /updates#
          {values.slug || "<slug>"}.
          {mode === "create" ? " It follows the title until you change it." : ""}
        </>,
      )}
      {field(
        "summary",
        "Summary",
        (props) => (
          <textarea
            {...props}
            rows={4}
            value={values.summary}
            onChange={(e) => set("summary", e.target.value)}
            className={FIELD_CONTROL}
          />
        ),
        "One or two plain sentences in our own words, 500 characters at most.",
      )}
      <div className="grid gap-5 md:grid-cols-2">
        {field("kind", "Kind", (props) => (
          <select
            {...props}
            value={values.kind}
            onChange={(e) => set("kind", e.target.value)}
            className={FIELD_CONTROL}
          >
            {UPDATE_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {UPDATE_KIND_LABEL[kind]}
              </option>
            ))}
          </select>
        ))}
        {field("technology", "Area (optional)", (props) => (
          <select
            {...props}
            value={values.technology}
            onChange={(e) => set("technology", e.target.value)}
            className={FIELD_CONTROL}
          >
            <option value="">Platform-wide</option>
            {TECHNOLOGY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}
      </div>
      {field(
        "sourceUrl",
        "Microsoft's announcement",
        text("sourceUrl", "url"),
        "An https link on microsoft.com, such as learn.microsoft.com.",
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        {field(
          "effectiveDate",
          "Effective date (optional)",
          text("effectiveDate"),
          "As YYYY-MM-DD, such as 2026-08-31. When the change takes effect: a deprecation or retirement with a date appears in the tracker.",
        )}
        {field(
          "action",
          "What to do (optional)",
          text("action"),
          "A few words, such as “No action”.",
        )}
        {field("replacement", "Switch to (optional)", text("replacement"))}
      </div>

      <SaveBar
        label={mode === "create" ? "Create draft" : "Save changes"}
        submitting={status === "submitting"}
        error={formError}
        dirty={dirty}
        cancelHref="/admin/updates"
      />
    </form>
  );
}

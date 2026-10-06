"use client";

import { UPDATE_KINDS, UPDATE_KIND_LABEL } from "@ppu/domain-content";
import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { TECHNOLOGY_OPTIONS } from "../../../lib/technology-options";

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
 * Publishing is the separate control on the list page.
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
  const [values, setValues] = useState<UpdateFormValues>(initialValues ?? DEFAULT_VALUES);
  const [status, setStatus] = useState<Status>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const baseId = useId();

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
    control: (props: {
      id: string;
      "aria-invalid": boolean;
      "aria-describedby": string | undefined;
    }) => ReactNode,
    hint?: string,
  ) {
    const id = `${baseId}-${key}`;
    const error = fieldErrors[key]?.[0];
    const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ");
    return (
      <div>
        <label htmlFor={id}>{label}</label>
        {control({
          id,
          "aria-invalid": Boolean(error),
          "aria-describedby": describedBy || undefined,
        })}
        {hint ? <p id={`${id}-hint`}>{hint}</p> : null}
        {error ? <p id={`${id}-error`}>{error}</p> : null}
      </div>
    );
  }

  const text = (key: keyof UpdateFormValues, type = "text") =>
    function Input(props: {
      id: string;
      "aria-invalid": boolean;
      "aria-describedby": string | undefined;
    }) {
      return (
        <input
          {...props}
          type={type}
          value={values[key]}
          onChange={(e) => set(key, e.target.value)}
        />
      );
    };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {field(
        "slug",
        "Slug",
        text("slug"),
        "Lower-case and hyphenated. It is the item's anchor on /updates.",
      )}
      {field("title", "Title", text("title"))}
      {field(
        "summary",
        "Summary",
        (props) => (
          <textarea
            {...props}
            value={values.summary}
            onChange={(e) => set("summary", e.target.value)}
          />
        ),
        "One or two plain sentences in our own words, 500 characters at most.",
      )}
      {field("kind", "Kind", (props) => (
        <select {...props} value={values.kind} onChange={(e) => set("kind", e.target.value)}>
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
        >
          <option value="">Platform-wide</option>
          {TECHNOLOGY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
      {field(
        "action",
        "What to do (optional)",
        text("action"),
        "A few words, such as “No action”.",
      )}
      {field(
        "sourceUrl",
        "Microsoft's announcement",
        text("sourceUrl", "url"),
        "An https link on microsoft.com, such as learn.microsoft.com.",
      )}
      {field(
        "effectiveDate",
        "Effective date (optional)",
        text("effectiveDate"),
        "As YYYY-MM-DD, such as 2026-08-31. When the change takes effect: a deprecation or retirement with a date appears in the tracker.",
      )}
      {field("replacement", "Switch to (optional)", text("replacement"))}

      <button type="submit" aria-disabled={status === "submitting"}>
        {status === "submitting" ? "Saving…" : mode === "create" ? "Create draft" : "Save changes"}
      </button>
      <p role="status">{formError}</p>
    </form>
  );
}

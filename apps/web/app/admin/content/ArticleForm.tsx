"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ARTICLE_TYPE_LABEL } from "../../../lib/article-types";
import { TECHNOLOGY_OPTIONS, topicOptions } from "../../../lib/technology-options";

export interface ArticleFormValues {
  slug: string;
  title: string;
  type: "TUTORIAL" | "PATTERN" | "COMPARISON" | "KPI_GUIDE" | "REFERENCE";
  /** "" means no technology section (MVP-028). */
  technology: string;
  /** "" means none: the hub shows it in the area's first section (MVP-033). */
  topic: string;
  excerpt: string;
  body: string;
}

interface ArticleFormProps {
  mode: "create" | "edit";
  articleId?: string;
  initialValues?: ArticleFormValues;
}

type Status = "idle" | "submitting" | "error";

const DEFAULT_VALUES: ArticleFormValues = {
  slug: "",
  title: "",
  type: "TUTORIAL",
  technology: "",
  topic: "",
  excerpt: "",
  body: "",
};

/**
 * The create/edit form for Article (MVP-017, FR-014). Server-validated at
 * the API boundary (apps/web/app/api/admin/content/route.ts and
 * [id]/route.ts) — this form only mirrors those messages back, it never
 * decides validity on its own. Publishing is not part of this form: it is
 * the dedicated ArticlePublishControl on the list page, a deliberately
 * separate action.
 */
export function ArticleForm({ mode, articleId, initialValues }: ArticleFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ArticleFormValues>(initialValues ?? DEFAULT_VALUES);
  const [status, setStatus] = useState<Status>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const slugId = useId();
  const titleId = useId();
  const typeId = useId();
  const technologyId = useId();
  const topicId = useId();
  const excerptId = useId();
  const bodyId = useId();
  const statusId = useId();

  function update<K extends keyof ArticleFormValues>(key: K, value: ArticleFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setFieldErrors({});
    setFormError(null);

    const url = mode === "create" ? "/api/admin/content" : `/api/admin/content/${articleId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: values.slug,
          title: values.title,
          type: values.type,
          // BUG-022: the technology was shown but never sent, so a save cleared it.
          technology: values.technology,
          topic: values.topic,
          excerpt: values.excerpt.trim() === "" ? null : values.excerpt,
          body: values.body,
        }),
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

      router.push("/admin/content");
    } catch {
      setFormError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor={slugId}>Slug</label>
        <input
          id={slugId}
          type="text"
          value={values.slug}
          onChange={(event) => update("slug", event.target.value)}
          aria-invalid={Boolean(fieldErrors["slug"])}
          aria-describedby={fieldErrors["slug"] ? `${slugId}-error` : undefined}
        />
        {fieldErrors["slug"] ? <p id={`${slugId}-error`}>{fieldErrors["slug"][0]}</p> : null}
      </div>

      <div>
        <label htmlFor={titleId}>Title</label>
        <input
          id={titleId}
          type="text"
          value={values.title}
          onChange={(event) => update("title", event.target.value)}
          aria-invalid={Boolean(fieldErrors["title"])}
          aria-describedby={fieldErrors["title"] ? `${titleId}-error` : undefined}
        />
        {fieldErrors["title"] ? <p id={`${titleId}-error`}>{fieldErrors["title"][0]}</p> : null}
      </div>

      <div>
        <label htmlFor={typeId}>Type</label>
        <select
          id={typeId}
          value={values.type}
          onChange={(event) => update("type", event.target.value as ArticleFormValues["type"])}
          aria-invalid={Boolean(fieldErrors["type"])}
          aria-describedby={fieldErrors["type"] ? `${typeId}-error` : undefined}
        >
          {(Object.keys(ARTICLE_TYPE_LABEL) as ArticleFormValues["type"][]).map((type) => (
            <option key={type} value={type}>
              {ARTICLE_TYPE_LABEL[type]}
            </option>
          ))}
        </select>
        {fieldErrors["type"] ? <p id={`${typeId}-error`}>{fieldErrors["type"][0]}</p> : null}
      </div>

      {/* MVP-028: which technology section the article appears in. */}
      <div>
        <label htmlFor={technologyId}>Technology section (optional)</label>
        <select
          id={technologyId}
          value={values.technology}
          onChange={(event) => {
            // A topic belongs to one technology, so changing it clears the topic.
            const technology = event.target.value;
            setValues((current) => ({ ...current, technology, topic: "" }));
          }}
          aria-invalid={Boolean(fieldErrors["technology"])}
          aria-describedby={fieldErrors["technology"] ? `${technologyId}-error` : undefined}
        >
          <option value="">None (appears on Learn only)</option>
          {TECHNOLOGY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {fieldErrors["technology"] ? (
          <p id={`${technologyId}-error`}>{fieldErrors["technology"][0]}</p>
        ) : null}
      </div>

      {/* MVP-033: which section of that technology's hub it appears in. */}
      <div>
        <label htmlFor={topicId}>Hub section (optional)</label>
        <select
          id={topicId}
          value={values.topic}
          onChange={(event) => update("topic", event.target.value)}
          disabled={values.technology === ""}
          aria-invalid={Boolean(fieldErrors["topic"])}
          aria-describedby={`${topicId}-hint${fieldErrors["topic"] ? ` ${topicId}-error` : ""}`}
        >
          <option value="">None (the hub&apos;s first section)</option>
          {topicOptions(values.technology).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p id={`${topicId}-hint`}>Choose a technology first. Each has its own sections.</p>
        {fieldErrors["topic"] ? <p id={`${topicId}-error`}>{fieldErrors["topic"][0]}</p> : null}
      </div>

      <div>
        <label htmlFor={excerptId}>Excerpt (optional)</label>
        <textarea
          id={excerptId}
          value={values.excerpt}
          onChange={(event) => update("excerpt", event.target.value)}
          aria-invalid={Boolean(fieldErrors["excerpt"])}
          aria-describedby={fieldErrors["excerpt"] ? `${excerptId}-error` : undefined}
        />
        {fieldErrors["excerpt"] ? (
          <p id={`${excerptId}-error`}>{fieldErrors["excerpt"][0]}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor={bodyId}>Body (Markdown)</label>
        <textarea
          id={bodyId}
          value={values.body}
          onChange={(event) => update("body", event.target.value)}
          aria-invalid={Boolean(fieldErrors["body"])}
          aria-describedby={fieldErrors["body"] ? `${bodyId}-error` : undefined}
        />
        {fieldErrors["body"] ? <p id={`${bodyId}-error`}>{fieldErrors["body"][0]}</p> : null}
      </div>

      <button type="submit" aria-disabled={status === "submitting"}>
        {status === "submitting" ? "Saving…" : mode === "create" ? "Create draft" : "Save changes"}
      </button>
      <p id={statusId} role="status">
        {formError}
      </p>
    </form>
  );
}

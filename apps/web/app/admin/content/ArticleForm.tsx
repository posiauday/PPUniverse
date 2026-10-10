"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ARTICLE_TYPE_LABEL } from "../../../lib/article-types";
import { TECHNOLOGY_OPTIONS, topicOptions } from "../../../lib/technology-options";
import { EditorField, FIELD_CONTROL, SaveBar, useSlugFollowsTitle } from "../EditorParts";

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
 * separate action. MVP-052 phase 4: the title comes first and a new guide's
 * slug follows it; Save stays in view at the bottom of the screen.
 */
export function ArticleForm({ mode, articleId, initialValues }: ArticleFormProps) {
  const router = useRouter();
  const initial = initialValues ?? DEFAULT_VALUES;
  const [values, setValues] = useState<ArticleFormValues>(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const slug = useSlugFollowsTitle(mode, initial.slug);
  const baseId = useId();
  const id = (key: keyof ArticleFormValues) => `${baseId}-${key}`;
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

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
    <form onSubmit={handleSubmit} noValidate className="flex min-w-0 flex-col gap-5">
      <EditorField id={id("title")} label="Title" errors={fieldErrors["title"]}>
        {(props) => (
          <input
            {...props}
            type="text"
            value={values.title}
            onChange={(event) => {
              const title = event.target.value;
              const next = slug.fromTitle(title);
              setValues((current) => ({
                ...current,
                title,
                ...(next === null ? {} : { slug: next }),
              }));
            }}
            className={`${FIELD_CONTROL} text-lg font-semibold`}
          />
        )}
      </EditorField>

      <EditorField
        id={id("slug")}
        label="Slug"
        hint={
          <>
            The address: /guides/{values.slug || "<slug>"}.{" "}
            {mode === "create"
              ? "It follows the title until you change it."
              : "Changing it after publishing breaks links to the old address."}
          </>
        }
        errors={fieldErrors["slug"]}
      >
        {(props) => (
          <input
            {...props}
            type="text"
            value={values.slug}
            onChange={(event) => {
              slug.onSlugTyped(event.target.value);
              update("slug", event.target.value);
            }}
            className={`${FIELD_CONTROL} font-mono text-sm`}
          />
        )}
      </EditorField>

      <div className="grid gap-5 sm:grid-cols-2">
        <EditorField id={id("type")} label="Type" errors={fieldErrors["type"]}>
          {(props) => (
            <select
              {...props}
              value={values.type}
              onChange={(event) => update("type", event.target.value as ArticleFormValues["type"])}
              className={FIELD_CONTROL}
            >
              {(Object.keys(ARTICLE_TYPE_LABEL) as ArticleFormValues["type"][]).map((type) => (
                <option key={type} value={type}>
                  {ARTICLE_TYPE_LABEL[type]}
                </option>
              ))}
            </select>
          )}
        </EditorField>

        {/* MVP-028: which technology section the article appears in. */}
        <EditorField
          id={id("technology")}
          label="Technology section (optional)"
          errors={fieldErrors["technology"]}
        >
          {(props) => (
            <select
              {...props}
              value={values.technology}
              onChange={(event) => {
                // A topic belongs to one technology, so changing it clears the topic.
                const technology = event.target.value;
                setValues((current) => ({ ...current, technology, topic: "" }));
              }}
              className={FIELD_CONTROL}
            >
              <option value="">None (appears on Learn only)</option>
              {TECHNOLOGY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </EditorField>

        {/* MVP-033: which section of that technology's hub it appears in. */}
        <EditorField
          id={id("topic")}
          label="Hub section (optional)"
          hint="Choose a technology first. Each has its own sections."
          errors={fieldErrors["topic"]}
        >
          {(props) => (
            <select
              {...props}
              value={values.topic}
              onChange={(event) => update("topic", event.target.value)}
              disabled={values.technology === ""}
              className={`${FIELD_CONTROL} disabled:cursor-not-allowed disabled:bg-muted`}
            >
              <option value="">None (the hub&apos;s first section)</option>
              {topicOptions(values.technology).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </EditorField>
      </div>

      <EditorField id={id("excerpt")} label="Excerpt (optional)" errors={fieldErrors["excerpt"]}>
        {(props) => (
          <textarea
            {...props}
            rows={3}
            value={values.excerpt}
            onChange={(event) => update("excerpt", event.target.value)}
            className={FIELD_CONTROL}
          />
        )}
      </EditorField>

      <EditorField id={id("body")} label="Body (Markdown)" errors={fieldErrors["body"]}>
        {(props) => (
          <textarea
            {...props}
            rows={22}
            spellCheck
            value={values.body}
            onChange={(event) => update("body", event.target.value)}
            className={`${FIELD_CONTROL} font-mono text-sm leading-relaxed`}
          />
        )}
      </EditorField>

      <SaveBar
        label={mode === "create" ? "Create draft" : "Save changes"}
        submitting={status === "submitting"}
        error={formError}
        dirty={dirty}
        cancelHref="/admin/content"
      />
    </form>
  );
}

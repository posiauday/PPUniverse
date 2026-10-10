"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorField, FIELD_CONTROL, SaveBar, useSlugFollowsTitle } from "../EditorParts";

export interface ProductFormValues {
  name: string;
  slug: string;
  summary: string;
  categoryId: string;
}

export interface ProductFormCategoryOption {
  id: string;
  name: string;
}

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  initialValues?: ProductFormValues;
  categories: ProductFormCategoryOption[];
}

type Status = "idle" | "submitting" | "error";

function defaultValues(categories: ProductFormCategoryOption[]): ProductFormValues {
  return { name: "", slug: "", summary: "", categoryId: categories[0]?.id ?? "" };
}

/**
 * The create/edit form for a Product's core fields (MVP-012, FR-009).
 * Server-validated at the API boundary (apps/web/app/api/admin/products/
 * route.ts and [id]/route.ts) -- this form only mirrors those messages
 * back, it never decides validity on its own (mirrors
 * apps/web/app/admin/content/ArticleForm.tsx exactly). License, support,
 * compatibility, releases and publishing are not part of this form: they
 * are the dedicated editors on the edit page, deliberately separate
 * actions/requests.
 */
export function ProductForm({ mode, productId, initialValues, categories }: ProductFormProps) {
  const router = useRouter();
  const initial = initialValues ?? defaultValues(categories);
  const [values, setValues] = useState<ProductFormValues>(initial);
  /** What was last saved, so "Unsaved changes" is measured from it. */
  const [baseline, setBaseline] = useState<ProductFormValues>(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const slug = useSlugFollowsTitle(mode, initial.slug);
  const baseId = useId();
  const id = (key: keyof ProductFormValues) => `${baseId}-${key}`;
  const dirty = JSON.stringify(values) !== JSON.stringify(baseline);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setSaved(false);
    setFieldErrors({});
    setFormError(null);

    const url = mode === "create" ? "/api/admin/products" : `/api/admin/products/${productId}`;
    const method = mode === "create" ? "POST" : "PATCH";

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

      const payload = (await response.json()) as { product: { id: string } };
      if (mode === "create") {
        router.push(`/admin/products/${payload.product.id}/edit`);
      } else {
        setBaseline(values);
        setSaved(true);
        router.refresh();
        setStatus("idle");
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-w-0 flex-col gap-5">
      <EditorField id={id("name")} label="Name" errors={fieldErrors["name"]}>
        {(props) => (
          <input
            {...props}
            type="text"
            value={values.name}
            onChange={(event) => {
              const name = event.target.value;
              const next = slug.fromTitle(name);
              setValues((current) => ({
                ...current,
                name,
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
            The address: /products/{values.slug || "<slug>"}.{" "}
            {mode === "create"
              ? "It follows the name until you change it."
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

      <EditorField id={id("summary")} label="Summary" errors={fieldErrors["summary"]}>
        {(props) => (
          <textarea
            {...props}
            rows={3}
            value={values.summary}
            onChange={(event) => update("summary", event.target.value)}
            className={FIELD_CONTROL}
          />
        )}
      </EditorField>

      <EditorField
        id={id("categoryId")}
        label="Category"
        errors={fieldErrors["categoryId"]}
        className="max-w-sm"
      >
        {(props) => (
          <select
            {...props}
            value={values.categoryId}
            onChange={(event) => update("categoryId", event.target.value)}
            className={FIELD_CONTROL}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        )}
      </EditorField>

      <SaveBar
        label={mode === "create" ? "Create draft" : "Save changes"}
        submitting={status === "submitting"}
        error={formError}
        dirty={dirty}
        saved={saved}
        cancelHref={mode === "create" ? "/admin/products" : undefined}
      />
    </form>
  );
}

"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [values, setValues] = useState<ProductFormValues>(
    initialValues ?? defaultValues(categories),
  );
  const [status, setStatus] = useState<Status>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const nameId = useId();
  const slugId = useId();
  const summaryId = useId();
  const categoryIdFieldId = useId();
  const statusId = useId();

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
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
        router.refresh();
        setStatus("idle");
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor={nameId}>Name</label>
        <input
          id={nameId}
          type="text"
          value={values.name}
          onChange={(event) => update("name", event.target.value)}
          aria-invalid={Boolean(fieldErrors["name"])}
          aria-describedby={fieldErrors["name"] ? `${nameId}-error` : undefined}
        />
        {fieldErrors["name"] ? <p id={`${nameId}-error`}>{fieldErrors["name"][0]}</p> : null}
      </div>

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
        <label htmlFor={summaryId}>Summary</label>
        <textarea
          id={summaryId}
          value={values.summary}
          onChange={(event) => update("summary", event.target.value)}
          aria-invalid={Boolean(fieldErrors["summary"])}
          aria-describedby={fieldErrors["summary"] ? `${summaryId}-error` : undefined}
        />
        {fieldErrors["summary"] ? (
          <p id={`${summaryId}-error`}>{fieldErrors["summary"][0]}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor={categoryIdFieldId}>Category</label>
        <select
          id={categoryIdFieldId}
          value={values.categoryId}
          onChange={(event) => update("categoryId", event.target.value)}
          aria-invalid={Boolean(fieldErrors["categoryId"])}
          aria-describedby={fieldErrors["categoryId"] ? `${categoryIdFieldId}-error` : undefined}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {fieldErrors["categoryId"] ? (
          <p id={`${categoryIdFieldId}-error`}>{fieldErrors["categoryId"][0]}</p>
        ) : null}
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

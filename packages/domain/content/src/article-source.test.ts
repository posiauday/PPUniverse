import { describe, expect, it } from "vitest";
import { parseArticleSource } from "./article-source.js";

const VALID = `---
title: "Delegation in Power Apps: why your gallery stops at 500 rows"
slug: power-apps-delegation-500-rows
type: TUTORIAL
technology: POWER_APPS
excerpt: "Why an app shows only part of your data."
---
## Why it happens

Body text.
`;

describe("parseArticleSource", () => {
  it("parses front matter and the body, unquoting values (colons inside quotes are kept)", () => {
    expect(parseArticleSource(VALID)).toEqual({
      ok: true,
      article: {
        title: "Delegation in Power Apps: why your gallery stops at 500 rows",
        slug: "power-apps-delegation-500-rows",
        type: "TUTORIAL",
        technology: "POWER_APPS",
        excerpt: "Why an app shows only part of your data.",
        body: "## Why it happens\n\nBody text.",
      },
    });
  });

  it("accepts CRLF files and an omitted technology or excerpt", () => {
    const text = VALID.replace("technology: POWER_APPS\n", "")
      .replace(/excerpt: .*\n/, "")
      .replace(/\n/g, "\r\n");
    const result = parseArticleSource(text);
    expect(result.ok && result.article.technology).toBeNull();
    expect(result.ok && result.article.excerpt).toBeNull();
  });

  it("ignores a leading byte-order mark, which some editors add", () => {
    const withBom = String.fromCharCode(0xfeff) + VALID;
    expect(parseArticleSource(withBom).ok).toBe(true);
  });

  it("rejects what the admin editor would reject, naming every problem", () => {
    const result = parseArticleSource(
      "---\ntitle: \nslug: Not A Slug\ntype: LEARNING_PATH\ntechnology: SHAREPOINT\n---\n",
    );
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors).toEqual([
      "title is required and must be 200 characters or fewer",
      "slug must be lower-case and hyphen-separated",
      "type must be TUTORIAL, PATTERN, COMPARISON or KPI_GUIDE",
      "technology must be one of the six sections, or omitted",
      "body is required",
    ]);
  });

  it("rejects unknown or duplicate keys and a missing header", () => {
    expect(parseArticleSource("no header")).toEqual({
      ok: false,
      errors: ["missing front matter: the file must start with a --- block"],
    });
    const extra = parseArticleSource(
      VALID.replace("type: TUTORIAL", "type: TUTORIAL\nstatus: PUBLISHED"),
    );
    expect(!extra.ok && extra.errors).toContain("unknown front-matter line: status: PUBLISHED");
    const dup = parseArticleSource(
      VALID.replace("type: TUTORIAL", "type: TUTORIAL\ntype: PATTERN"),
    );
    expect(!dup.ok && dup.errors).toContain("duplicate key: type");
  });
});

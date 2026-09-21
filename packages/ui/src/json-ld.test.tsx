import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JsonLd, serializeJsonLd, type JsonLdObject } from "./json-ld.js";

const BACKSLASH = String.fromCharCode(0x5c);
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

/** The text a JSON unicode escape for `character` should have in the output, e.g. backslash + "u003c" for "<". */
const escapeFor = (character: string): string =>
  `${BACKSLASH}u${character.charCodeAt(0).toString(16).padStart(4, "0")}`;

const hostileValues = [
  "</script><script>alert(1)</script>",
  "<!-- comment -->",
  "<script",
  "<img src=x onerror=alert(1)>",
  "</SCRIPT>",
  'fish & chips > "quotes" and a backslash ' + BACKSLASH + " and a\nnewline",
  `separators${LINE_SEPARATOR}and${PARAGRAPH_SEPARATOR}here`,
];

describe("serializeJsonLd", () => {
  it("escapes every less-than character with the JSON unicode escape", () => {
    const output = serializeJsonLd({ name: "a<b<c" });
    expect(output).toBe(`{"name":"a${escapeFor("<")}b${escapeFor("<")}c"}`);
  });

  it("also escapes greater-than, ampersand and the two line-separator characters", () => {
    const output = serializeJsonLd({
      name: `>&${LINE_SEPARATOR}${PARAGRAPH_SEPARATOR}`,
    });
    expect(output).toBe(
      `{"name":"${escapeFor(">")}${escapeFor("&")}${escapeFor(LINE_SEPARATOR)}${escapeFor(PARAGRAPH_SEPARATOR)}"}`,
    );
  });

  it.each(hostileValues)("leaves no unsafe character in the output for %j", (value) => {
    const output = serializeJsonLd({ name: value, nested: { list: [value] } });
    expect(output).not.toMatch(/[<>&]/);
    expect(output).not.toContain(LINE_SEPARATOR);
    expect(output).not.toContain(PARAGRAPH_SEPARATOR);
  });

  it.each(hostileValues)("round-trips %j exactly through JSON.parse", (value) => {
    const data: JsonLdObject = { "@type": "Product", name: value, nested: { list: [value] } };
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });

  it("keeps ordinary text readable", () => {
    expect(serializeJsonLd({ name: "Power Apps component", version: "1.2.0" })).toBe(
      '{"name":"Power Apps component","version":"1.2.0"}',
    );
  });
});

describe("JsonLd component", () => {
  it("renders a single application/ld+json script containing the serialized data", () => {
    const { container } = render(<JsonLd data={{ "@type": "WebSite", name: "Example" }} />);
    const script = container.querySelector("script");
    expect(script?.getAttribute("type")).toBe("application/ld+json");
    expect(JSON.parse(script?.textContent ?? "")).toEqual({ "@type": "WebSite", name: "Example" });
  });

  describe("injection safety, checked by the HTML parser rather than by string inspection", () => {
    const hostile: JsonLdObject = {
      "@type": "Product",
      name: "</script><script>window.pwned = true</script><img src=x onerror=alert(1)>",
      description: "<!-- <script>",
    };

    it("cannot terminate the script element or create another element", () => {
      const markup = renderToStaticMarkup(<JsonLd data={hostile} />);
      document.body.innerHTML = markup;

      expect(document.body.querySelectorAll("*")).toHaveLength(1);
      expect(document.body.querySelectorAll("script")).toHaveLength(1);
      expect(document.body.querySelectorAll("img")).toHaveLength(0);
      expect(JSON.parse(document.body.querySelector("script")?.textContent ?? "")).toEqual(hostile);
      expect((window as unknown as { pwned?: boolean }).pwned).toBeUndefined();
    });

    it("control: the same data serialized WITHOUT the escaping does break out (so the test above can fail)", () => {
      document.body.innerHTML = `<script type="application/ld+json">${JSON.stringify(hostile)}</script>`;
      expect(document.body.querySelectorAll("*").length).toBeGreaterThan(1);
    });
  });
});

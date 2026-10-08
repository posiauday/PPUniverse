import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: (props: { href: string; children?: unknown; className?: string }) =>
      createElement("a", { href: props.href, className: props.className }, props.children as never),
  };
});

import { ComponentWorkbench, hasReplica } from "./ComponentWorkbench";
import { readButtons, visibleButtons } from "./replicas/DialogReplica";
import { stateFor } from "./replicas/StatesReplica";
import { itemsFromText } from "./replicas/TabsReplica";

const render = (componentName: string, yaml: string | null = "ComponentDefinitions: {}") =>
  renderToStaticMarkup(
    <ComponentWorkbench
      componentName={componentName}
      title="Thing"
      yaml={yaml}
      signInHref="/signin?callbackUrl=%2Fcomponents%2Fthing"
      variations={[{ name: "Plain", description: "No changes.", settings: {} }]}
    />,
  );

describe("ComponentWorkbench", () => {
  it.each(["lcsButton", "lcsTextField", "lcsDialog", "lcsToast", "lcsTabs", "lcsStates"])(
    "renders a live replica and a variation for %s",
    (name) => {
      expect(hasReplica(name)).toBe(true);
      const html = render(name);
      expect(html).toContain('role="tablist"');
      expect(html).toContain("Copy YAML");
      expect(html).toContain("Plain");
      expect(html).not.toContain("on its way");
    },
  );

  it("says the live preview is coming for a component without a replica", () => {
    expect(render("lcsSomethingNew")).toContain("on its way");
  });

  it("never shows the YAML or a copy button when the reader must sign in", () => {
    const html = render("lcsButton", null);
    expect(html).not.toContain("Copy YAML");
    expect(html).not.toContain("ComponentDefinitions");
    expect(html).toContain("Sign in to copy (free)");
    expect(html).toContain('href="/signin?callbackUrl=%2Fcomponents%2Fthing"');
  });
});

describe("replica helpers match the components' own formulas", () => {
  it("ItemsFromText splits on commas and trims", () => {
    expect(itemsFromText("Open, Waiting ,Done,")).toEqual(["Open", "Waiting", "Done"]);
  });

  it("StateFor checks loading, then error, then rows", () => {
    expect(stateFor(true, true, 0)).toBe("Loading");
    expect(stateFor(false, true, 5)).toBe("Error");
    expect(stateFor(false, false, 0)).toBe("Empty");
    expect(stateFor(false, false, 3)).toBe("");
  });
});

describe("the Dialog replica follows lcsDialog's button rules", () => {
  const buttons = readButtons(
    'Table({Key: "cancel", Label: "Cancel", Style: "Secondary"}, {Key: "confirm", Label: "Don""t", Style: "Primary"})',
  );

  it("reads the Buttons table", () => {
    expect(buttons).toEqual([
      { Key: "cancel", Label: "Cancel", Style: "Secondary" },
      { Key: "confirm", Label: 'Don"t', Style: "Primary" },
    ]);
  });

  it("hides cancel for an Alert and turns confirm red for Danger", () => {
    expect(visibleButtons({ Kind: "Alert", Buttons: buttons }).map((b) => b.Key)).toEqual([
      "confirm",
    ]);
    expect(visibleButtons({ Kind: "Danger", Buttons: buttons })[1]?.Style).toBe("Danger");
  });

  it("shows at most three buttons, the last three", () => {
    const four = readButtons('Table({Key: "a"}, {Key: "b"}, {Key: "c"}, {Key: "d"})');
    expect(visibleButtons({ Kind: "Confirm", Buttons: four }).map((b) => b.Key)).toEqual([
      "b",
      "c",
      "d",
    ]);
  });
});

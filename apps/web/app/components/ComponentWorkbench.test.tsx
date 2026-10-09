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
import { skeletonRows, stateFor } from "./replicas/StatesReplica";
import { itemsFromText, tabText } from "./replicas/TabsReplica";
import { formatProblem } from "./replicas/TextFieldReplica";
import { dateProblem, presets, timeList, workingDays } from "./replicas/DatePickerReplica";
import { pageSlots, paging, summary } from "./replicas/PaginationReplica";
import {
  avatarColour,
  fieldMessage,
  initials,
  listMessage,
  searchStaff,
  STAFF,
} from "./replicas/PeoplePickerReplica";

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
  it.each([
    "lcsButton",
    "lcsTextField",
    "lcsDialog",
    "lcsToast",
    "lcsTabs",
    "lcsStates",
    "lcsFab",
    "lcsDatePicker",
    "lcsPeoplePicker",
    "lcsPagination",
  ])("renders a live replica and its variations for %s", (name) => {
    expect(hasReplica(name)).toBe(true);
    const html = render(name);
    expect(html).toContain('role="tablist"');
    expect(html).toContain("Copy YAML");
    expect(html).toContain("Plain");
    expect(html).not.toContain("on its way");
  });

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
  it("a tab's text carries its count only when above zero", () => {
    expect(tabText("Open", { Open: 12, Waiting: 0 })).toBe("Open (12)");
    expect(tabText("Waiting", { Open: 12, Waiting: 0 })).toBe("Waiting");
    expect(tabText("Done", {})).toBe("Done");
  });

  it("Skeleton draws as many rows as fit in the panel, at least one", () => {
    expect(skeletonRows(3)).toBe(3);
    expect(skeletonRows(12)).toBe(4);
    expect(skeletonRows(0)).toBe(1);
  });

  it("Text field formats pass good text and an empty box, and explain bad text", () => {
    expect(formatProblem("Email", "sam@example.com")).toBe("");
    expect(formatProblem("Email", "sam@")).toMatch(/email address/);
    expect(formatProblem("Phone", "+1 (555) 010-0100")).toBe("");
    expect(formatProblem("Phone", "call me")).toMatch(/phone number/);
    expect(formatProblem("Number", "3,5")).toBe("");
    expect(formatProblem("Number", "3.5.1")).toMatch(/number/);
    expect(formatProblem("Url", "https://example.com/a")).toBe("");
    expect(formatProblem("Url", "example.com")).toMatch(/https/);
    expect(formatProblem("PostalCodeCA", "k1a 0b1")).toBe("");
    expect(formatProblem("PostalCodeCA", "12345")).toMatch(/postal code/);
    expect(formatProblem("ZipCodeUS", "12345-6789")).toBe("");
    expect(formatProblem("ZipCodeUS", "1234")).toMatch(/ZIP/);
    expect(formatProblem("Email", "   ")).toBe("");
    expect(formatProblem("None", "anything")).toBe("");
  });

  it("the date picker's time list, working days and quick picks follow the component", () => {
    expect(timeList(15, false).slice(0, 3)).toEqual(["12:00 AM", "12:15 AM", "12:30 AM"]);
    expect(timeList(30, true)).toHaveLength(48);
    expect(timeList(60, true)[14]).toBe("14:00");
    // Monday 2 March to Sunday 8 March 2026: five working days.
    expect(workingDays(new Date(2026, 2, 2), new Date(2026, 2, 8))).toBe(5);
    const wednesday = new Date(2026, 2, 4);
    const [thisWeek, nextSeven, lastThirty] = presets("Range", wednesday);
    expect(thisWeek![1].getDate()).toBe(2);
    expect(thisWeek![2]!.getDate()).toBe(8);
    expect(nextSeven![2]!.getDate()).toBe(10);
    expect(lastThirty![1].getMonth()).toBe(1);
    expect(presets("Date", wednesday).map((entry) => entry[0])).toEqual([
      "Today",
      "Tomorrow",
      "In a week",
    ]);
    // With weekends blocked, a quick pick never lands on one: This week ends on Friday 6 March,
    // and "In a week" from Saturday 7 March moves on to Monday 16 March.
    expect(presets("Range", wednesday, true)[0]![2]!.getDate()).toBe(6);
    expect(presets("Date", new Date(2026, 2, 7), true)[2]![1].getDate()).toBe(16);
  });

  it("the date picker's checks run in the component's order", () => {
    const range = { Mode: "Range" as const, Required: true, BlockWeekends: true };
    expect(dateProblem(range, null, null)).toBe("Choose a date.");
    expect(dateProblem(range, new Date(2026, 2, 4), null)).toBe("Choose an end date.");
    expect(dateProblem(range, new Date(2026, 2, 6), new Date(2026, 2, 4))).toMatch(/on or after/);
    expect(dateProblem(range, new Date(2026, 2, 7), new Date(2026, 2, 9))).toMatch(/weekday/);
    expect(dateProblem(range, new Date(2026, 2, 4), new Date(2026, 2, 6))).toBe("");
  });

  it("the people picker searches, draws avatars and explains itself like the component", () => {
    expect(searchStaff(STAFF, "PRI").map((person) => person.DisplayName)).toEqual(["Priya Nair"]);
    expect(searchStaff(STAFF, "example.com")).toHaveLength(STAFF.length);
    expect(searchStaff(STAFF, "zz")).toEqual([]);
    expect(initials("  Avery   Brooks ")).toBe("AB");
    expect(initials("Mateo de la Cruz")).toBe("MC");
    expect(initials("Cher")).toBe("C");
    // Mod(Len(name), 6): the same name always gets the same colour.
    expect(avatarColour("Sam Rivera")).toBe(avatarColour("Sam Rivera"));
    expect(avatarColour("Ab")).toBe("#0d8076");
    const list = { full: false, minSearchLength: 2, lastSearch: "", shown: 0, found: 0 };
    expect(listMessage({ ...list, typed: "p" })).toBe("Type at least 2 characters to search.");
    expect(listMessage({ ...list, typed: "zz" })).toBe("");
    expect(listMessage({ ...list, typed: "zz", lastSearch: "zz" })).toBe('No one found for "zz".');
    expect(listMessage({ ...list, typed: "pri", lastSearch: "pri", found: 1 })).toMatch(
      /already chosen/,
    );
    expect(listMessage({ ...list, full: true, typed: "p" })).toBe("");
    const inputs = {
      Label: "Approvers",
      Hint: "Up to three.",
      Placeholder: "",
      MaxPeople: 3,
      MinSearchLength: 2,
      Required: true,
      AccentColor: "#0f6cbd",
      Theme: "Light",
    };
    expect(fieldMessage(inputs, 0, false)).toBe("Up to three.");
    expect(fieldMessage(inputs, 0, true)).toBe("⚠ Choose at least one person.");
    expect(fieldMessage(inputs, 3, true)).toMatch(/most this field allows \(3\)/);
    expect(fieldMessage({ ...inputs, MaxPeople: 1 }, 1, true)).toBe("Up to three.");
  });

  it("pagination shows seven buttons at most, with ellipses, and the rows a gallery needs", () => {
    expect(pageSlots(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageSlots(3, 32)).toEqual([1, 2, 3, 4, 5, 0, 32]);
    expect(pageSlots(5, 32)).toEqual([1, 0, 4, 5, 6, 0, 32]);
    expect(pageSlots(30, 32)).toEqual([1, 0, 28, 29, 30, 31, 32]);
    expect(paging(312, 10, 3)).toEqual({
      page: 3,
      pageCount: 32,
      firstRow: 21,
      lastRow: 30,
      rowsOnPage: 10,
    });
    // The last page is short, and a page past the end shows the last one.
    expect(paging(312, 25, 99)).toMatchObject({
      page: 13,
      firstRow: 301,
      lastRow: 312,
      rowsOnPage: 12,
    });
    expect(paging(0, 10, 1)).toMatchObject({ pageCount: 1, firstRow: 0, rowsOnPage: 0 });
    expect(summary(1312, 25, 2, "orders")).toBe("26–50 of 1,312 orders");
    expect(summary(0, 10, 1, "orders")).toBe("No orders");
  });

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

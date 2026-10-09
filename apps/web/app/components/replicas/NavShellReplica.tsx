"use client";

import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useNotify } from "./notify";
import { cssColor, fromPowerFx, SEGOE, type ReplicaApi, type Wiring } from "./replica";

/**
 * A web replica of lcsNavShell (MVP-049; docs/final-decisions.md, 2026-10-08,
 * "One live view"), as its YAML lays it out, on a screen wired the way its
 * guide says: ScreenWidth and ScreenHeight from Parent, the component placed
 * from its Shell outputs and a content container from its Content outputs.
 * The screen here is the preview's frame, so on a phone-width page the menu
 * becomes a bottom bar, as it would in Power Apps.
 */

export interface NavItem {
  Key: string;
  Label: string;
  Icon: string;
  Badge: string;
}

/** Items' default in the component's YAML. */
export const ITEMS: readonly NavItem[] = [
  { Key: "home", Label: "Home", Icon: "Home", Badge: "" },
  { Key: "orders", Label: "Orders", Icon: "Cart", Badge: "3" },
  { Key: "customers", Label: "Customers", Icon: "People", Badge: "" },
  { Key: "reports", Label: "Reports", Icon: "ChartMultiple", Badge: "" },
  { Key: "settings", Label: "Settings", Icon: "Settings", Badge: "" },
];

/** The preview screen's height, when ScreenHeight is Parent.Height. */
const SCREEN_HEIGHT = 420;
const COLLAPSED_WIDTH = 64;
const BAR_HEIGHT = 64;

interface Inputs {
  Title: string;
  CurrentKey: string;
  HiddenKeys: string;
  DisabledKeys: string;
  StartCollapsed: boolean;
  /** "Parent" while wired to Parent.Width / Parent.Height, else a number a variation sets. */
  ScreenWidth: number | "Parent";
  ScreenHeight: number | "Parent";
  BottomBarBelow: number;
  MaxBottomItems: number;
  ExpandedWidth: number;
  ShowToggle: boolean;
  MenuLabel: string;
  CollapseText: string;
  ExpandText: string;
  AccentColor: string;
  Theme: string;
}

const DEFAULTS: Inputs = {
  Title: "My app",
  CurrentKey: "",
  HiddenKeys: "",
  DisabledKeys: "",
  StartCollapsed: false,
  ScreenWidth: "Parent",
  ScreenHeight: "Parent",
  BottomBarBelow: 640,
  MaxBottomItems: 5,
  ExpandedWidth: 240,
  ShowToggle: true,
  MenuLabel: "Main menu",
  CollapseText: "Collapse the menu",
  ExpandText: "Expand the menu",
  AccentColor: "#0f6cbd",
  Theme: "Light",
};

const keysOf = (text: string) =>
  text
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);

/** The component's outputs, from its formulas: where it goes, and where the content goes. */
export function shellLayout(options: {
  screenWidth: number;
  screenHeight: number;
  bottomBarBelow: number;
  collapsed: boolean;
  expandedWidth: number;
}) {
  const bottom = options.screenWidth < options.bottomBarBelow;
  const side = options.collapsed ? COLLAPSED_WIDTH : options.expandedWidth;
  return {
    isBottomBar: bottom,
    shell: bottom
      ? {
          x: 0,
          y: options.screenHeight - BAR_HEIGHT,
          width: options.screenWidth,
          height: BAR_HEIGHT,
        }
      : { x: 0, y: 0, width: side, height: options.screenHeight },
    content: bottom
      ? { x: 0, y: 0, width: options.screenWidth, height: options.screenHeight - BAR_HEIGHT }
      : { x: side, y: 0, width: options.screenWidth - side, height: options.screenHeight },
  };
}

/** The items shown (HiddenKeys removed) and the one marked current, as the YAML works them out. */
export function menuOf(items: readonly NavItem[], hiddenKeys: string, current: string | null) {
  const hidden = keysOf(hiddenKeys);
  const visible = items.filter((item) => !hidden.includes(item.Key));
  return { visible, currentKey: current || visible[0]?.Key || "" };
}

/** Our own simple glyphs for the default items' Fluent icon names. */
const GLYPHS: Record<string, ReactNode> = {
  Home: <path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />,
  Cart: (
    <>
      <path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L20 8H6.2" />
      <circle cx="9.5" cy="19" r="1.3" />
      <circle cx="16.5" cy="19" r="1.3" />
    </>
  ),
  People: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8" />
      <circle cx="16.5" cy="9.5" r="2.4" />
      <path d="M15.5 14.4c2.5-.3 4.5 1.3 5 4.1" />
    </>
  ),
  ChartMultiple: <path d="M4 20V10M10 20V5M16 20v-7M21 20H3" />,
  Settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
    </>
  ),
  Navigation: <path d="M4 7h16M4 12h16M4 17h16" />,
};

function Glyph({ name, filled }: { name: string; filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5 shrink-0"
      fill={filled && name !== "ChartMultiple" && name !== "Navigation" ? "currentColor" : "none"}
      fillOpacity={filled ? 0.18 : 0}
      stroke="currentColor"
      strokeWidth={filled ? 2 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {GLYPHS[name] ?? null}
    </svg>
  );
}

export function useNavShellReplica(): ReplicaApi {
  const notify = useNotify();
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  // locCollapsed and locSelected: blank until the user collapses the menu or picks an item.
  const [collapsedChoice, setCollapsedChoice] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  // Parent.Width: the preview frame's width, measured. A callback ref, because
  // choosing a variation mounts a fresh frame, and a detached one measures 0.
  const [parentWidth, setParentWidth] = useState(660);
  const observer = useRef<ResizeObserver | null>(null);
  const frame = useCallback((element: HTMLDivElement | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!element || typeof ResizeObserver === "undefined") return;
    observer.current = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry?.contentRect.width ?? 0);
      if (width > 0) setParentWidth(width);
    });
    observer.current.observe(element);
  }, []);

  const dark = inputs.Theme === "Dark";
  const collapsed = collapsedChoice ?? inputs.StartCollapsed;
  const screenWidth = inputs.ScreenWidth === "Parent" ? parentWidth : inputs.ScreenWidth;
  const screenHeight = inputs.ScreenHeight === "Parent" ? SCREEN_HEIGHT : inputs.ScreenHeight;
  const layout = shellLayout({
    screenWidth,
    screenHeight,
    bottomBarBelow: inputs.BottomBarBelow,
    collapsed,
    expandedWidth: inputs.ExpandedWidth,
  });
  const { visible, currentKey } = menuOf(ITEMS, inputs.HiddenKeys, inputs.CurrentKey || selected);
  const disabled = keysOf(inputs.DisabledKeys);
  const bottomItems = visible.slice(0, Math.max(1, inputs.MaxBottomItems));
  const currentItem = visible.find((item) => item.Key === currentKey);

  const ink = dark ? "text-white" : "text-[#242424]";
  const sub = dark ? "text-[#adadad]" : "text-[#616161]";
  const currentInk = dark ? "text-white" : "text-[color-mix(in_srgb,var(--accent)_75%,black)]";
  const tint = dark
    ? "bg-[color-mix(in_srgb,var(--accent)_45%,#202020)]"
    : "bg-[color-mix(in_srgb,var(--accent)_14%,white)]";
  const hover = dark ? "hover:bg-white/[0.06]" : "hover:bg-black/[0.04]";

  const go = (item: NavItem) => {
    setSelected(item.Key);
    notify(`Go to ${item.Key}`);
  };
  const toggle = () => {
    const next = !collapsed;
    setCollapsedChoice(next);
    notify(next ? "Menu collapsed" : "Menu expanded");
  };
  const name = (item: NavItem) => (item.Badge ? `${item.Label}, ${item.Badge}` : item.Label);
  const badge = (text: string, small: boolean) => (
    <span
      aria-hidden="true"
      className={`grid place-items-center rounded-full bg-[var(--accent)] px-1.5 font-semibold text-white ${
        small ? "h-4 min-w-4 text-[9px]" : "h-[22px] min-w-[22px] text-[11px]"
      }`}
    >
      {text}
    </span>
  );

  const side = (
    <nav
      aria-label={inputs.MenuLabel}
      className={`absolute flex flex-col border-r ${dark ? "border-[#424242] bg-[#202020]" : "border-[#e5e7eb] bg-[#fafafa]"}`}
      style={{ left: 0, top: 0, width: layout.shell.width, height: layout.shell.height }}
    >
      <div className="flex h-16 shrink-0 items-center gap-2 px-3">
        {inputs.ShowToggle ? (
          <button
            type="button"
            aria-label={collapsed ? inputs.ExpandText : inputs.CollapseText}
            title={collapsed ? inputs.ExpandText : inputs.CollapseText}
            onClick={toggle}
            className={`grid size-10 shrink-0 place-items-center rounded ${ink} ${hover}`}
          >
            <Glyph name="Navigation" filled={false} />
          </button>
        ) : null}
        {collapsed ? null : (
          <p className={`truncate text-base font-semibold ${inputs.ShowToggle ? "" : "pl-2"}`}>
            {inputs.Title}
          </p>
        )}
      </div>
      <ul className="flex-1 overflow-y-auto px-2">
        {visible.map((item) => {
          const current = item.Key === currentKey;
          const off = disabled.includes(item.Key);
          return (
            <li key={item.Key} className="relative mb-0.5 h-11">
              {current ? (
                <>
                  <span aria-hidden="true" className={`absolute inset-0 rounded-lg ${tint}`} />
                  <span
                    aria-hidden="true"
                    className="absolute top-3 bottom-3 left-0 w-[3px] bg-[var(--accent)]"
                  />
                </>
              ) : null}
              <button
                type="button"
                aria-label={name(item)}
                aria-current={current ? "page" : undefined}
                title={collapsed ? item.Label : undefined}
                disabled={off}
                onClick={() => go(item)}
                className={`relative flex size-full items-center gap-3 rounded-lg text-sm ${
                  collapsed ? "justify-center" : "pl-3.5"
                } ${off ? `${sub} cursor-not-allowed opacity-50` : `${current ? `${currentInk} font-semibold` : ink} ${hover}`}`}
              >
                <Glyph name={item.Icon} filled={current} />
                {collapsed ? null : <span className="truncate">{item.Label}</span>}
              </button>
              {item.Badge ? (
                <span
                  className={`pointer-events-none absolute ${collapsed ? "top-1 left-[30px]" : "top-1/2 right-2.5 -translate-y-1/2"}`}
                >
                  {badge(item.Badge, collapsed)}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const bar = (
    <nav
      aria-label={inputs.MenuLabel}
      className={`absolute border-t ${dark ? "border-[#424242] bg-[#202020]" : "border-[#e5e7eb] bg-[#fafafa]"}`}
      style={{
        left: 0,
        top: layout.shell.y,
        width: layout.shell.width,
        height: layout.shell.height,
      }}
    >
      <ul className="flex h-full">
        {bottomItems.map((item) => {
          const current = item.Key === currentKey;
          const off = disabled.includes(item.Key);
          return (
            <li key={item.Key} className="relative min-w-0 flex-1">
              <button
                type="button"
                aria-label={name(item)}
                aria-current={current ? "page" : undefined}
                title={item.Label}
                disabled={off}
                onClick={() => go(item)}
                className={`flex size-full flex-col items-center pt-1.5 ${off ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <span
                  className={`grid h-[30px] w-14 place-items-center rounded-full ${current ? `${tint} ${currentInk}` : `${ink} ${off ? "" : hover}`}`}
                >
                  <Glyph name={item.Icon} filled={current} />
                </span>
                <span
                  className={`mt-0.5 max-w-full truncate px-0.5 text-[11px] ${current ? `${currentInk} font-semibold` : sub}`}
                >
                  {item.Label}
                </span>
              </button>
              {item.Badge ? (
                <span className="pointer-events-none absolute top-1 left-[calc(50%+6px)]">
                  {badge(item.Badge, true)}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const wiring: Wiring[] = [
    { control: "lcsNavShell_1", property: "ScreenWidth", formula: "Parent.Width" },
    { control: "lcsNavShell_1", property: "ScreenHeight", formula: "Parent.Height" },
    { control: "lcsNavShell_1", property: "X", formula: "lcsNavShell_1.ShellX" },
    { control: "lcsNavShell_1", property: "Y", formula: "lcsNavShell_1.ShellY" },
    { control: "lcsNavShell_1", property: "Width", formula: "lcsNavShell_1.ShellWidth" },
    { control: "lcsNavShell_1", property: "Height", formula: "lcsNavShell_1.ShellHeight" },
    { control: "Container1", property: "X", formula: "lcsNavShell_1.ContentX" },
    { control: "Container1", property: "Y", formula: "lcsNavShell_1.ContentY" },
    { control: "Container1", property: "Width", formula: "lcsNavShell_1.ContentWidth" },
    { control: "Container1", property: "Height", formula: "lcsNavShell_1.ContentHeight" },
    {
      control: "Label1",
      property: "Text",
      formula: "LookUp(lcsNavShell_1.Items, Key = lcsNavShell_1.SelectedKey).Label",
    },
    {
      control: "lcsNavShell_1",
      property: "OnNavigate",
      formula: 'Notify("Go to " & ItemKey)',
    },
    {
      control: "lcsNavShell_1",
      property: "OnToggle",
      formula: 'Notify(If(Collapsed, "Menu collapsed", "Menu expanded"))',
    },
  ];

  const fixedWidth = inputs.ScreenWidth === "Parent" ? undefined : inputs.ScreenWidth;
  return {
    screen: (
      <div className="w-full overflow-x-auto">
        <div
          ref={frame}
          style={
            {
              "--accent": inputs.AccentColor,
              width: fixedWidth ?? "100%",
              height: screenHeight,
            } as CSSProperties
          }
          className={`relative mx-auto overflow-hidden rounded-md text-left ${SEGOE} ${ink} ${
            dark ? "bg-[#1b1b1b] ring-1 ring-white/10" : "bg-white ring-1 ring-black/10"
          }`}
        >
          {/* Container1, placed from the component's Content outputs. */}
          <div
            className="absolute overflow-hidden p-5"
            style={{
              left: layout.content.x,
              top: layout.content.y,
              width: layout.content.width,
              height: layout.content.height,
            }}
          >
            <p className="text-xl font-semibold">{currentItem?.Label ?? ""}</p>
            <div aria-hidden="true" className="mt-4 flex flex-col gap-2.5">
              {[92, 76, 84, 58].map((width) => (
                <span
                  key={width}
                  className={`h-3 rounded ${dark ? "bg-white/10" : "bg-black/[0.07]"}`}
                  style={{ width: `${width}%` }}
                />
              ))}
            </div>
          </div>
          {layout.isBottomBar ? bar : side}
        </div>
      </div>
    ),
    apply: (settings) => {
      const next = { ...DEFAULTS };
      for (const [key, formula] of Object.entries(settings)) {
        if (key === "AccentColor") next.AccentColor = cssColor(formula, DEFAULTS.AccentColor);
        else if (key in next)
          (next as unknown as Record<string, unknown>)[key] = fromPowerFx(formula);
      }
      setInputs(next);
      setCollapsedChoice(null);
      setSelected(null);
    },
    dark,
    wiring,
  };
}

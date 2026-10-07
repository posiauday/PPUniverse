import type { Page } from "@playwright/test";

/**
 * The page-speed budget (MVP-042; docs/final-decisions.md, 2026-10-06, "SEO
 * additions", decision 4, and 2026-10-07, "Comments wording, admin panel,
 * speed check and the Learn module", decision 3): Google's Core Web Vitals
 * "good" thresholds. INP needs real interactions, so the lab check uses Total
 * Blocking Time, the standard lab stand-in for responsiveness, at 200 ms.
 */
export const SPEED_BUDGET = { lcpMs: 2500, cls: 0.1, tbtMs: 200 } as const;

/** A mid-range phone on a slow connection, roughly what Lighthouse's mobile run uses. */
export const PHONE_PROFILE = {
  viewport: { width: 412, height: 823 },
  cpuSlowdown: 4,
  network: {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  },
} as const;

export interface Vitals {
  lcpMs: number;
  cls: number;
  tbtMs: number;
}

interface RawVitals {
  fcp: number;
  lcp: number;
  cls: number;
  longTasks: Array<{ start: number; duration: number }>;
}

/** Installed before the page loads: records paint, layout shifts and long tasks. */
function observe(): void {
  const raw: RawVitals = { fcp: 0, lcp: 0, cls: 0, longTasks: [] };
  (window as unknown as { __ppuVitals: RawVitals }).__ppuVitals = raw;
  const watch = (type: string, onEntry: (entry: PerformanceEntry) => void) => {
    try {
      new PerformanceObserver((list) => list.getEntries().forEach(onEntry)).observe({
        type,
        buffered: true,
      });
    } catch {
      // An entry type this browser doesn't support stays at its default.
    }
  };
  watch("paint", (entry) => {
    if (entry.name === "first-contentful-paint") raw.fcp = entry.startTime;
  });
  watch("largest-contentful-paint", (entry) => {
    raw.lcp = entry.startTime;
  });
  watch("layout-shift", (entry) => {
    const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
    if (!shift.hadRecentInput) raw.cls += shift.value;
  });
  watch("longtask", (entry) => {
    raw.longTasks.push({ start: entry.startTime, duration: entry.duration });
  });
}

/** Total Blocking Time: each long task's time over 50 ms, after the first contentful paint. */
export function totalBlockingTime(raw: Pick<RawVitals, "fcp" | "longTasks">): number {
  return raw.longTasks
    .filter((task) => task.start >= raw.fcp)
    .reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0);
}

/** The median of each metric across runs. */
export function medianVitals(runs: readonly Vitals[]): Vitals {
  const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
  };
  return {
    lcpMs: median(runs.map((run) => run.lcpMs)),
    cls: median(runs.map((run) => run.cls)),
    tbtMs: median(runs.map((run) => run.tbtMs)),
  };
}

/** Which budget lines a page breaks, in words; empty when it's within budget. */
export function overBudget(vitals: Vitals, budget = SPEED_BUDGET): string[] {
  const problems: string[] = [];
  if (vitals.lcpMs > budget.lcpMs)
    problems.push(`LCP ${Math.round(vitals.lcpMs)} ms > ${budget.lcpMs} ms`);
  if (vitals.cls >= budget.cls) problems.push(`CLS ${vitals.cls.toFixed(3)} >= ${budget.cls}`);
  if (vitals.tbtMs > budget.tbtMs)
    problems.push(`TBT ${Math.round(vitals.tbtMs)} ms > ${budget.tbtMs} ms`);
  return problems;
}

/**
 * Loads `path` once on the phone profile (Chromium only: it needs the
 * DevTools protocol for throttling) and returns its vitals.
 */
export async function measure(page: Page, path: string): Promise<Vitals> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", PHONE_PROFILE.network);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: PHONE_PROFILE.cpuSlowdown });
  await page.setViewportSize(PHONE_PROFILE.viewport);
  await page.addInitScript(observe);
  await page.goto(path, { waitUntil: "load" });
  // Let late work finish: LCP and long tasks after load still count.
  await page.waitForTimeout(3000);
  const raw = await page.evaluate(
    () => (window as unknown as { __ppuVitals: RawVitals }).__ppuVitals,
  );
  await cdp.detach();
  return { lcpMs: raw.lcp, cls: raw.cls, tbtMs: totalBlockingTime(raw) };
}

/**
 * Diagnoses the sign-in "Send sign-in link" click (decision, 2026-09-21: "Run 7 failure
 * / sign-in submit signature"). Two CI failures so far (run 4 §signin-sent§, run 7
 * §signin-send-failed§, both Firefox, both 320px, both on this control) showed the
 * app's handler never executing — no request, no client-side validation error. This
 * captures, on the same in-page clock (§performance.now()§, which is already relative to
 * this document's navigation start — no manual zeroing needed), the facts the fixed
 * classification criterion needs: whether the click reached the button (hit test),
 * whether it was hydrated at that moment, and whether the browser's own click/submit
 * events fired at all.
 *
 * Test logic only; nothing here runs in, or is reachable from, the application.
 */

export interface ClickEventLogEntry {
  type: "click" | "submit";
  atMs: number;
  target: string;
}

/**
 * Installs capture-phase listeners on §document§ for §click§ and §submit§, before the
 * click is attempted, so the trace shows whether either fired at all and on what target
 * — not just whether OUR click call resolved.
 */
export function installClickEventTracer(): void {
  const KEY = "__e2eClickEvents";
  const w = window as unknown as { [KEY]: ClickEventLogEntry[] };
  if (w[KEY]) return;
  const log: ClickEventLogEntry[] = [];
  w[KEY] = log;

  const describe = (target: EventTarget | null): string => {
    if (!(target instanceof Element)) return String(target);
    const id = target.id ? `#${target.id}` : "";
    const text = (target.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 30);
    return `${target.tagName.toLowerCase()}${id}${text ? ` "${text}"` : ""}`;
  };
  const record = (type: "click" | "submit") => (event: Event) =>
    log.push({ type, atMs: performance.now(), target: describe(event.target) });
  document.addEventListener("click", record("click"), { capture: true });
  document.addEventListener("submit", record("submit"), { capture: true });
}

export interface SubmitButtonInspection {
  atMs: number;
  buttonFound: boolean;
  buttonHydrated: boolean;
  buttonVisible: boolean;
  buttonRect: { x: number; y: number; width: number; height: number } | null;
  inViewport: boolean;
  pointerEvents: string | null;
  zIndex: string | null;
  clickPoint: { x: number; y: number };
  elementAtClickPoint: string;
  hitTargetsButton: boolean;
  viewport: { width: number; height: number };
}

/**
 * Inspects the "Send sign-in link" button right before a click is attempted at
 * (clickX, clickY) — the same point Playwright's own §.click()§ targets (the element's
 * centre). Everything here answers one question: did the click, as a real pointer
 * event, have any chance of reaching the button? Takes one object argument, as
 * §page.evaluate(fn, arg)§ requires when §fn§ is passed by reference.
 */
export function inspectSignInSubmitButton({
  clickX,
  clickY,
}: {
  clickX: number;
  clickY: number;
}): SubmitButtonInspection {
  const describe = (el: Element | null): string => {
    if (!el) return "(none)";
    const id = el.id ? `#${el.id}` : "";
    const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `${el.tagName.toLowerCase()}${id}${text ? ` "${text}"` : ""}`;
  };

  const buttons = [...document.querySelectorAll("button")];
  const button =
    buttons.find((candidate) => /send sign-in link/i.test(candidate.textContent ?? "")) ?? null;
  const style = button ? getComputedStyle(button) : null;
  const rect = button?.getBoundingClientRect() ?? null;
  const atPoint = document.elementFromPoint(clickX, clickY);
  const hitTargetsButton = button !== null && (atPoint === button || button.contains(atPoint));
  // React attaches a fibre/props property (key starts with "__reactProps$") to a DOM
  // node once it has rendered and attached its event handlers; its absence means the
  // element exists in the DOM but React has not yet made it interactive.
  const hydrated =
    button !== null && Object.keys(button).some((key) => key.startsWith("__reactProps"));
  const inViewport =
    rect !== null &&
    rect.width > 0 &&
    rect.height > 0 &&
    rect.left >= 0 &&
    rect.top >= 0 &&
    rect.right <= window.innerWidth &&
    rect.bottom <= window.innerHeight;

  return {
    atMs: performance.now(),
    buttonFound: button !== null,
    buttonHydrated: hydrated,
    buttonVisible: button?.checkVisibility() ?? false,
    buttonRect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
    inViewport,
    pointerEvents: style?.pointerEvents ?? null,
    zIndex: style?.zIndex ?? null,
    clickPoint: { x: clickX, y: clickY },
    elementAtClickPoint: describe(atPoint),
    hitTargetsButton,
    viewport: { width: window.innerWidth, height: window.innerHeight },
  };
}

export interface SignInClickDiagnostics {
  /** Node wall-clock (Date.now()), a DIFFERENT clock from the in-page fields below — see
   * failure-evidence.ts for why they cannot be merged onto one axis. */
  interceptionRegisteredAtMs: number | null;
  clickIssuedAtMs: number;
  preClick: SubmitButtonInspection | null;
  events: ClickEventLogEntry[];
}

/** Pushes one attempt's diagnostics onto window.__e2eClickDiagnostics for later attachment. */
export function recordSignInClickDiagnostics(entry: SignInClickDiagnostics): void {
  const KEY = "__e2eClickDiagnostics";
  const w = window as unknown as { [KEY]: SignInClickDiagnostics[] };
  (w[KEY] ??= []).push(entry);
}

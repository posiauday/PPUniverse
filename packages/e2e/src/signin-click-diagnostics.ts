/**
 * Diagnoses the sign-in "Send sign-in link" click (decisions, 2026-09-21: "Run 7
 * failure / sign-in submit signature", then "Run 8 disposition"). Two CI failures so
 * far (run 4 `signin-sent`, run 7 `signin-send-failed`, both Firefox, both 320px, both
 * on this control) showed the app's handler never executing — no request, no
 * client-side validation error.
 *
 * Refined per the second decision, because a listener attached too late, or to the
 * wrong node, or a single pre-fill snapshot cannot rule out the specific hypothesis
 * under test: that `fill()`'s re-render replaces or detaches the button between locator
 * resolution and click dispatch, so the click lands on an orphan node that never
 * reaches React. Unproven — a candidate, not a conclusion. This module exists to
 * confirm or eliminate it with evidence, not to assume it:
 *
 * - Listeners are attached at `document` (before any interaction) AND, if it can be
 *   found, at the DOM node React itself created its root on — so an event reaching
 *   document but never reaching React's own root is a distinguishable, visible fact.
 * - The button is snapshotted TWICE with the same function — once right after the
 *   locator resolves, again immediately before the click is dispatched (after `fill()`,
 *   which is the specific re-render under suspicion) — so identity, connectedness and
 *   layout are compared across exactly the window the hypothesis is about, not before
 *   it.
 * - Node identity is tracked with a `WeakMap` keyed by the actual element object: if the
 *   button locator resolves to a *different* object on the second snapshot, that is a
 *   replaced node, not the same one merely re-measured.
 *
 * All timestamps here are `performance.now()`, which is already relative to this
 * document's navigation start — no manual zeroing needed, and all in-page fields in
 * this module share one clock.
 *
 * `installClickEventTracer` and `snapshotButtonNode` are each passed BY REFERENCE to
 * Playwright's `evaluate()`, which serializes only that one function's own source text
 * (`Function.prototype.toString()`) and re-executes it inside the browser — it does
 * NOT carry along module-scope constants or helper functions declared outside the
 * function body. Each of those two functions is therefore fully self-contained: every
 * constant and helper it needs is declared INSIDE it, even at the cost of a little
 * duplication between them, matching the pattern already used in
 * `failure-evidence-inpage.ts`. (An earlier version of this file hoisted shared
 * constants and a shared `describeTarget` helper to module scope "to avoid
 * duplication"; that broke both functions at runtime with a `ReferenceError` the first
 * time they actually ran in a browser, caught in CI, not locally.)
 *
 * Round 2 (decision, 2026-09-22, "BUG-014 recurrence" — the last investigation round
 * authorized inside MVP-023): the signature recurred on a run where every check above
 * proved trustworthy, and the evidence came back unreadable rather than classifiable —
 * a live, stable, connected button, but zero captured events at any listener and zero
 * matching network request. That is equally consistent with "nothing happened" as with
 * "the document was replaced and the listener that captured nothing was no longer the
 * live one." `checkObserverLiveness` closes that gap: an install-time token on
 * `window`, read back immediately before and immediately after the click. If the token
 * is gone, or reading it throws because the execution context was destroyed, the
 * document changed and every OTHER observation from that attempt is void, not merely
 * inconclusive.
 *
 * Test logic only; nothing here runs in, or is reachable from, the application.
 */

export interface ClickEventLogEntry {
  type: "click" | "submit";
  atMs: number;
  target: string;
}

export interface RootContainerInfo {
  found: boolean;
  description: string | null;
}

export interface NativeSubmitLogEntry {
  atMs: number;
  /**
   * Read from a SEPARATE bubble-phase listener at `document`, not the capture-phase
   * one above: document is the outermost point in the DOM tree, so a bubble-phase
   * listener there runs LAST among document-reachable listeners, after any
   * bubble-phase handler (including React's own default event delegation) has already
   * had its chance to call `preventDefault()`. Reading this from the capture-phase
   * listener instead would show `false` even in the normal, working case, since
   * capture fires before bubble-phase handlers run at all.
   */
  defaultPrevented: boolean;
}

/**
 * Installs capture-phase `click`/`submit` listeners at `document` (always) and, if
 * React's root container can be found, ALSO there — a click that reaches document but
 * not the root is a distinguishable, visible fact, not an assumption. ALSO installs a
 * separate bubble-phase `submit` listener at `document` (round 2, see the module
 * comment) to observe `defaultPrevented` at the point in propagation where it is
 * meaningful, and writes an install-time token to `window` so a later, separate call
 * can prove the observer is still alive rather than assume it. Self-contained: see the
 * module comment for why. Returns that token.
 */
export function installClickEventTracer(): string {
  const DOC_EVENTS_KEY = "__e2eClickEvents";
  const ROOT_EVENTS_KEY = "__e2eRootClickEvents";
  const ROOT_INFO_KEY = "__e2eRootInfo";
  const OBSERVER_TOKEN_KEY = "__e2eObserverToken";
  const NATIVE_SUBMIT_KEY = "__e2eNativeSubmitLog";

  const w = window as unknown as {
    [DOC_EVENTS_KEY]?: ClickEventLogEntry[];
    [ROOT_EVENTS_KEY]?: ClickEventLogEntry[];
    [ROOT_INFO_KEY]?: RootContainerInfo;
    [OBSERVER_TOKEN_KEY]?: string;
    [NATIVE_SUBMIT_KEY]?: NativeSubmitLogEntry[];
  };
  if (w[DOC_EVENTS_KEY]) return w[OBSERVER_TOKEN_KEY] ?? "";

  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  w[OBSERVER_TOKEN_KEY] = token;

  const describeTarget = (target: EventTarget | null): string => {
    if (!(target instanceof Element)) return String(target);
    const id = target.id ? `#${target.id}` : "";
    const text = (target.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 30);
    return `${target.tagName.toLowerCase()}${id}${text ? ` "${text}"` : ""}`;
  };
  const record = (log: ClickEventLogEntry[], type: "click" | "submit") => (event: Event) =>
    log.push({ type, atMs: performance.now(), target: describeTarget(event.target) });

  const docLog: ClickEventLogEntry[] = [];
  w[DOC_EVENTS_KEY] = docLog;
  document.addEventListener("click", record(docLog, "click"), { capture: true });
  document.addEventListener("submit", record(docLog, "submit"), { capture: true });

  const nativeSubmitLog: NativeSubmitLogEntry[] = [];
  w[NATIVE_SUBMIT_KEY] = nativeSubmitLog;
  document.addEventListener(
    "submit",
    (event) => {
      nativeSubmitLog.push({ atMs: performance.now(), defaultPrevented: event.defaultPrevented });
    },
    { capture: false },
  );

  // A scan for React's root-container marker (a property key starting with
  // "__reactContainer$", attached to whatever node createRoot/hydrateRoot was given) —
  // not a guess at Next.js's mounting convention, because assuming a specific element
  // (#__next is a Pages Router convention, not App Router's) would risk silently
  // finding nothing and reporting a false "not found". An EARLIER version of this scan
  // checked only document.querySelectorAll("*") (Element nodes) and always reported
  // "not found" in every engine, 100% reproducibly (caught by this file's own
  // self-check in harness-smoke.spec.ts, not by a BUG-014 run): Next.js's App Router
  // hydrates onto `document` ITSELF
  // (node_modules/next/dist/client/app-index.js: "const appElement = document"), and
  // document is a Document, not an Element, so querySelectorAll("*") can never include
  // it. document is checked explicitly alongside the element scan for that reason.
  const rootCandidates: (Document | Element)[] = [document, ...document.querySelectorAll("*")];
  const rootNode = rootCandidates.find((candidate) =>
    Object.keys(candidate).some((key) => key.startsWith("__reactContainer$")),
  );
  w[ROOT_INFO_KEY] = rootNode
    ? {
        found: true,
        description:
          rootNode === document
            ? "document"
            : `${(rootNode as Element).tagName.toLowerCase()}${(rootNode as Element).id ? `#${(rootNode as Element).id}` : ""}`,
      }
    : { found: false, description: null };
  if (rootNode) {
    const rootLog: ClickEventLogEntry[] = [];
    w[ROOT_EVENTS_KEY] = rootLog;
    rootNode.addEventListener("click", record(rootLog, "click"), { capture: true });
    rootNode.addEventListener("submit", record(rootLog, "submit"), { capture: true });
  }

  return token;
}

export interface ObserverLivenessSnapshot {
  atMs: number;
  tokenPresent: boolean;
  token: string | null;
}

/**
 * Reads back the install-time token written by `installClickEventTracer`, called
 * immediately before AND immediately after the click dispatch (round 2, see the module
 * comment). If the document has been replaced since install, this token — like every
 * other piece of `window`-scoped state this module relies on — cannot have survived,
 * so its absence here is direct proof the observer died, not merely a missing data
 * point.
 *
 * The caller should also treat an `evaluate()` call to this function throwing (Firefox
 * and other engines report this as roughly "Execution context was destroyed") as an
 * EVEN STRONGER, more direct signal of the same thing: the document was in the middle
 * of being replaced at the exact moment this was asked, not merely already replaced by
 * the time it was asked. This function cannot express that itself — a thrown error
 * never returns a value — so it is the caller's `.catch()` that must record it.
 * Self-contained: see the module comment for why.
 */
export function checkObserverLiveness(): ObserverLivenessSnapshot {
  const OBSERVER_TOKEN_KEY = "__e2eObserverToken";
  const w = window as unknown as { [OBSERVER_TOKEN_KEY]?: string };
  const token = w[OBSERVER_TOKEN_KEY] ?? null;
  return { atMs: performance.now(), tokenPresent: token !== null, token };
}

export interface HitTestResult {
  clickPoint: { x: number; y: number };
  elementAtClickPoint: string;
  hitTargetsButton: boolean;
}

export interface ButtonSnapshot {
  atMs: number;
  nodeId: string;
  /** False on the very first snapshot of a given element; meaningful from the second
   * snapshot of "the same locator" onward — true means a DIFFERENT element object than
   * whatever was snapshotted before it (a replaced node), not merely re-measured. */
  isKnownNode: boolean;
  isConnected: boolean;
  hydrated: boolean;
  visible: boolean;
  rect: { x: number; y: number; width: number; height: number };
  pointerEvents: string | null;
  zIndex: string | null;
  fontsStatus: string;
  /** Hit-tested against THIS SAME element reference and its own just-measured centre —
   * no separate re-resolution, so the snapshot and the hit test can never disagree
   * about which node they mean. */
  hitTest: HitTestResult;
}

/**
 * Snapshots whatever element a locator resolves to, called via `locator.evaluate()` so
 * Playwright hands it the freshly re-queried live element each time — not a coordinate
 * or selector re-evaluated separately, which could resolve to something else. Typed as
 * the general `Element` (not `HTMLButtonElement`) because Playwright's own `evaluate()`
 * signature is generic over the element a locator could resolve to, and everything used
 * here (`getComputedStyle`, `getBoundingClientRect`, `isConnected`, `checkVisibility`) is
 * available on `Element` itself. Self-contained: see the module comment for why.
 */
export function snapshotButtonNode(element: Element): ButtonSnapshot {
  const NODE_IDENTITY_KEY = "__e2eNodeIdentities";
  const describeTarget = (target: EventTarget | null): string => {
    if (!(target instanceof Element)) return String(target);
    const id = target.id ? `#${target.id}` : "";
    const text = (target.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 30);
    return `${target.tagName.toLowerCase()}${id}${text ? ` "${text}"` : ""}`;
  };

  const w = window as unknown as { [NODE_IDENTITY_KEY]?: WeakMap<Element, string> };
  const map = (w[NODE_IDENTITY_KEY] ??= new WeakMap<Element, string>());
  const isKnownNode = map.has(element);
  let nodeId = map.get(element);
  if (!nodeId) {
    nodeId = Math.random().toString(36).slice(2, 10);
    map.set(element, nodeId);
  }
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  const clickPoint = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  const atPoint = document.elementFromPoint(clickPoint.x, clickPoint.y);
  const hitTargetsButton =
    element.isConnected && (atPoint === element || element.contains(atPoint));
  return {
    atMs: performance.now(),
    nodeId,
    isKnownNode,
    isConnected: element.isConnected,
    // React attaches a fibre/props property (key starts with "__reactProps$") to a DOM
    // node once it has rendered and attached its event handlers; its absence means the
    // element exists in the DOM but React has not made it interactive.
    hydrated: Object.keys(element).some((key) => key.startsWith("__reactProps")),
    visible: element.checkVisibility(),
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    pointerEvents: style.pointerEvents,
    zIndex: style.zIndex,
    fontsStatus: document.fonts.status,
    hitTest: { clickPoint, elementAtClickPoint: describeTarget(atPoint), hitTargetsButton },
  };
}

/**
 * `checkObserverLiveness`'s result, plus what the calling code on the Node side
 * observed trying to get it: `evaluateError` is set when the `evaluate()` call itself
 * threw rather than returning — round 2's strongest possible signal of a document
 * replacement happening at that exact moment, not merely already having happened.
 */
export interface ObserverLivenessResult extends ObserverLivenessSnapshot {
  evaluateError: string | null;
}

export interface SignInClickDiagnostics {
  /** Node wall-clock (Date.now()), a DIFFERENT clock from the in-page fields below — see
   * failure-evidence.ts for why they cannot be merged onto one axis. */
  interceptionRegisteredAtMs: number | null;
  /** How many times interceptSignInSend's own route handler fired, read at the point
   * this diagnostic was recorded (round 2, item 2e) — null when this state has no
   * interception at all (signin-validation-error, where the email field is empty and
   * no request is ever expected). */
  interceptionInvocationCount: number | null;
  clickIssuedAtMs: number;
  rootContainer: RootContainerInfo;
  /** The token installClickEventTracer wrote to window at install time, so a later
   * mismatch or absence in observerBeforeClick/observerAfterClick is a comparison
   * against a known-good value, not just "was something there". */
  installToken: string;
  /** Read immediately before button.click() (round 2, items 2a/2b). */
  observerBeforeClick: ObserverLivenessResult;
  /** Read immediately after button.click() (round 2, items 2a/2b). A missing token or
   * an evaluateError here, when observerBeforeClick was fine, is direct evidence the
   * document was replaced by the click itself — not evidence the application ignored
   * a click that a live observer would have seen. */
  observerAfterClick: ObserverLivenessResult;
  /** Snapshotted right after the locator resolves, BEFORE fill(). */
  atResolution: ButtonSnapshot | null;
  /** Snapshotted again immediately before the click is dispatched, AFTER fill() — the
   * specific re-render under suspicion. Its own `hitTest` field uses the exact same
   * element reference this snapshot was taken from. */
  atDispatch: ButtonSnapshot | null;
  /** True if atDispatch resolved to a different element object than atResolution. */
  nodeReplacedBetweenResolutionAndDispatch: boolean | null;
  /** atDispatch.rect minus atResolution.rect; null if either snapshot is missing. */
  rectDelta: { dx: number; dy: number; dwidth: number; dheight: number } | null;
  events: { document: ClickEventLogEntry[]; root: ClickEventLogEntry[] | null };
  /** From the SEPARATE bubble-phase submit listener (round 2, item 2d) — see
   * NativeSubmitLogEntry for why defaultPrevented is only meaningful read this way. */
  nativeSubmitLog: NativeSubmitLogEntry[];
}

/**
 * Pushes one attempt's diagnostics onto `window.__e2eClickDiagnostics` for later
 * attachment. Self-contained: see the module comment for why.
 *
 * The local constant below is named `DIAGNOSTICS_GLOBAL_NAME` (decision, 2026-09-22,
 * "Run 13 / merge authorization"; scoped-suppression follow-up, same date, "Secret
 * scan false positive"). Its earlier name was a single all-caps word matching the
 * generic-api-key secret-scanner rule's own trigger keyword, paired with the same
 * entropy-eligible string value this constant still holds — the scanner treats that
 * combination as a possible credential. The rule fires on that keyword-plus-value
 * pattern wherever the exact text appears, including inside a comment describing it,
 * which is why this note deliberately does not reproduce the old declaration
 * verbatim (doing so once already regenerated the same finding in a later commit).
 * The new name avoids the trigger keyword and more accurately describes what the
 * constant is: the name of a `window` property used to carry diagnostics, not a
 * credential of any kind. Only the identifier changed — the string value, and all
 * runtime behavior, are unchanged.
 */
export function recordSignInClickDiagnostics(entry: SignInClickDiagnostics): void {
  const DIAGNOSTICS_GLOBAL_NAME = "__e2eClickDiagnostics";
  const w = window as unknown as { [DIAGNOSTICS_GLOBAL_NAME]: SignInClickDiagnostics[] };
  (w[DIAGNOSTICS_GLOBAL_NAME] ??= []).push(entry);
}

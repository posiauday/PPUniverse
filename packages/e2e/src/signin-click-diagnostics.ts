/**
 * Diagnoses the sign-in "Send sign-in link" click (decisions, 2026-09-21: "Run 7
 * failure / sign-in submit signature", then "Run 8 disposition"). Two CI failures so
 * far (run 4 §signin-sent§, run 7 §signin-send-failed§, both Firefox, both 320px, both
 * on this control) showed the app's handler never executing — no request, no
 * client-side validation error.
 *
 * Refined per the second decision, because a listener attached too late, or to the
 * wrong node, or a single pre-fill snapshot cannot rule out the specific hypothesis
 * under test: that §fill()§'s re-render replaces or detaches the button between locator
 * resolution and click dispatch, so the click lands on an orphan node that never
 * reaches React. Unproven — a candidate, not a conclusion. This module exists to
 * confirm or eliminate it with evidence, not to assume it:
 *
 * - Listeners are attached at §document§ (before any interaction) AND, if it can be
 *   found, at the DOM node React itself created its root on — so an event reaching
 *   document but never reaching React's own root is a distinguishable, visible fact.
 * - The button is snapshotted TWICE with the same function — once right after the
 *   locator resolves, again immediately before the click is dispatched (after §fill()§,
 *   which is the specific re-render under suspicion) — so identity, connectedness and
 *   layout are compared across exactly the window the hypothesis is about, not before
 *   it.
 * - Node identity is tracked with a §WeakMap§ keyed by the actual element object: if the
 *   button locator resolves to a *different* object on the second snapshot, that is a
 *   replaced node, not the same one merely re-measured.
 *
 * All timestamps here are §performance.now()§, which is already relative to this
 * document's navigation start — no manual zeroing needed, and all in-page fields in
 * this module share one clock.
 *
 * §installClickEventTracer§ and §snapshotButtonNode§ are each passed BY REFERENCE to
 * Playwright's §evaluate()§, which serializes only that one function's own source text
 * (§Function.prototype.toString()§) and re-executes it inside the browser — it does
 * NOT carry along module-scope constants or helper functions declared outside the
 * function body. Each of those two functions is therefore fully self-contained: every
 * constant and helper it needs is declared INSIDE it, even at the cost of a little
 * duplication between them, matching the pattern already used in
 * §failure-evidence-inpage.ts§. (An earlier version of this file hoisted shared
 * constants and a shared §describeTarget§ helper to module scope "to avoid
 * duplication"; that broke both functions at runtime with a §ReferenceError§ the first
 * time they actually ran in a browser, caught in CI, not locally.)
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

/**
 * Installs capture-phase §click§/§submit§ listeners at §document§ (always) and, if
 * React's root container can be found, ALSO there — a click that reaches document but
 * not the root is a distinguishable, visible fact, not an assumption. Self-contained:
 * see the module comment for why.
 */
export function installClickEventTracer(): void {
  const DOC_EVENTS_KEY = "__e2eClickEvents";
  const ROOT_EVENTS_KEY = "__e2eRootClickEvents";
  const ROOT_INFO_KEY = "__e2eRootInfo";

  const w = window as unknown as {
    [DOC_EVENTS_KEY]?: ClickEventLogEntry[];
    [ROOT_EVENTS_KEY]?: ClickEventLogEntry[];
    [ROOT_INFO_KEY]?: RootContainerInfo;
  };
  if (w[DOC_EVENTS_KEY]) return;

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
 * Snapshots whatever element a locator resolves to, called via §locator.evaluate()§ so
 * Playwright hands it the freshly re-queried live element each time — not a coordinate
 * or selector re-evaluated separately, which could resolve to something else. Typed as
 * the general §Element§ (not §HTMLButtonElement§) because Playwright's own §evaluate()§
 * signature is generic over the element a locator could resolve to, and everything used
 * here (§getComputedStyle§, §getBoundingClientRect§, §isConnected§, §checkVisibility§) is
 * available on §Element§ itself. Self-contained: see the module comment for why.
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

export interface SignInClickDiagnostics {
  /** Node wall-clock (Date.now()), a DIFFERENT clock from the in-page fields below — see
   * failure-evidence.ts for why they cannot be merged onto one axis. */
  interceptionRegisteredAtMs: number | null;
  clickIssuedAtMs: number;
  rootContainer: RootContainerInfo;
  /** Snapshotted right after the locator resolves, BEFORE fill(). */
  atResolution: ButtonSnapshot | null;
  /** Snapshotted again immediately before the click is dispatched, AFTER fill() — the
   * specific re-render under suspicion. Its own §hitTest§ field uses the exact same
   * element reference this snapshot was taken from. */
  atDispatch: ButtonSnapshot | null;
  /** True if atDispatch resolved to a different element object than atResolution. */
  nodeReplacedBetweenResolutionAndDispatch: boolean | null;
  /** atDispatch.rect minus atResolution.rect; null if either snapshot is missing. */
  rectDelta: { dx: number; dy: number; dwidth: number; dheight: number } | null;
  events: { document: ClickEventLogEntry[]; root: ClickEventLogEntry[] | null };
}

/**
 * Pushes one attempt's diagnostics onto §window.__e2eClickDiagnostics§ for later
 * attachment. Self-contained: see the module comment for why.
 */
export function recordSignInClickDiagnostics(entry: SignInClickDiagnostics): void {
  const KEY = "__e2eClickDiagnostics";
  const w = window as unknown as { [KEY]: SignInClickDiagnostics[] };
  (w[KEY] ??= []).push(entry);
}

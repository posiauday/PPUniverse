import type { TitleTraceEvent } from "./title-trace.js";

/**
 * Runs INSIDE the page, installed by page.addInitScript before any app script runs on
 * every navigation (decision, 2026-09-21: MVP-023 run 4 Firefox failures). It records,
 * with in-page performance.now() timestamps: every change to the document's title, and
 * every firing of Next.js's built-in route announcer together with document.title at
 * that exact moment. It changes nothing the app does; it only observes.
 *
 * Two independent sources for title changes, because either could be how a title update
 * actually happens: the <title> element's text content (what the browser's own title
 * algorithm reads, and what a React re-render of <title> would mutate), and a direct
 * `document.title = ...` assignment (which the <title>-element observer would not catch
 * on its own, since the browser updates the element FROM the assignment).
 *
 * The route-announcer read of document.title happening inside a MutationObserver
 * callback (queued as a microtask right after the announcer text is written) is the most
 * direct evidence available of what `document.title` actually was at the moment Next's
 * own accessibility announcer fired.
 */
export function installFailureEvidenceTracer(): void {
  const KEY = "__e2eTitleTrace";
  const w = window as unknown as { [KEY]: TitleTraceEvent[] };
  if (w[KEY]) return; // idempotent per document, in case addInitScript ever runs twice
  const trace: TitleTraceEvent[] = [];
  w[KEY] = trace;

  const t0 = performance.now();
  const push = (event: TitleTraceEvent) => trace.push(event);
  const now = () => Math.round((performance.now() - t0) * 100) / 100;

  push({ kind: "title", atMs: now(), title: document.title, via: "initial" });

  function observeTitleElement(): boolean {
    const el = document.querySelector("title");
    if (!el) return false;
    // Record the value at the moment the observer attaches too, not only later changes:
    // an engine that inserts <title> with its final text in one step (observed in WebKit)
    // would otherwise leave that value unrecorded, since no further mutation ever fires.
    push({ kind: "title", atMs: now(), title: document.title, via: "title-element" });
    new MutationObserver(() =>
      push({ kind: "title", atMs: now(), title: document.title, via: "title-element" }),
    ).observe(el, { childList: true, characterData: true, subtree: true });
    return true;
  }
  if (!observeTitleElement()) {
    const headObserver = new MutationObserver(() => {
      if (observeTitleElement()) headObserver.disconnect();
    });
    // addInitScript runs before the parser has necessarily created <html>, so
    // document.documentElement can still be null; the Document node itself is always a
    // valid MutationObserver target and still reports <html>/<head> being added.
    headObserver.observe(document.documentElement ?? document, { childList: true, subtree: true });
  }

  // A direct `document.title = ...` assignment does not always go through a visible
  // mutation of a pre-existing <title> element (the browser may create one), so this is
  // a second, independent source, not a duplicate of the observer above.
  const titleDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, "title");
  if (titleDescriptor?.set) {
    const nativeSet = titleDescriptor.set;
    Object.defineProperty(document, "title", {
      configurable: true,
      get: titleDescriptor.get,
      set(value: string) {
        nativeSet.call(this, value);
        push({ kind: "title", atMs: now(), title: value, via: "document.title-setter" });
      },
    });
  }

  // Next's AppRouterAnnouncer (apps/web/node_modules/next/dist/client/components/
  // app-router-announcer.js): on every route-tree change it reads `document.title`, and
  // if it is falsy, falls back to the page's <h1> text; either way it writes that text
  // into a hidden role="alert" live region inside a <next-route-announcer> custom
  // element's shadow root. Observing that region's content directly, and reading
  // document.title in the same callback, tells us what the announcer effect saw.
  function observeAnnouncer(root: ShadowRoot): boolean {
    const node = root.getElementById("__next-route-announcer__");
    if (!node) return false;
    // Same reasoning as observeTitleElement: record the state at attach time too.
    push({
      kind: "announcer",
      atMs: now(),
      text: node.textContent ?? "",
      documentTitleThen: document.title,
    });
    new MutationObserver(() =>
      push({
        kind: "announcer",
        atMs: now(),
        text: node.textContent ?? "",
        documentTitleThen: document.title,
      }),
    ).observe(node, { childList: true, characterData: true, subtree: true });
    return true;
  }
  function tryAttachAnnouncer(): boolean {
    const host = document.querySelector("next-route-announcer");
    return host?.shadowRoot ? observeAnnouncer(host.shadowRoot) : false;
  }
  if (!tryAttachAnnouncer()) {
    const bodyObserver = new MutationObserver(() => {
      if (tryAttachAnnouncer()) bodyObserver.disconnect();
    });
    bodyObserver.observe(document.body ?? document.documentElement ?? document, {
      childList: true,
      subtree: true,
    });
  }
}

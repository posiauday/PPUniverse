"use client";

import { useRef, useState, type ReactNode } from "react";
import type { Wiring } from "./replicas/replica";

/**
 * The formulas on a component's preview screen (MVP-049; docs/final-decisions.md,
 * 2026-10-08, "One live view"), one per line on the dark code surface, with
 * Power Fx coloured and a copy button on each line for Studio's formula bar.
 */

type Token = { text: string; kind: "string" | "number" | "function" | "name" | "plain" };

const TOKEN =
  /("(?:[^"]|"")*")|(\b(?:true|false)\b|\b\d+(?:\.\d+)?\b)|(\b[A-Za-z][A-Za-z0-9]*(?=\())|(\b[A-Za-z][A-Za-z0-9_]*\.[A-Za-z][A-Za-z0-9_]*\b)/g;

/** Splits a Power Fx formula into text, numbers, function calls and dotted names, for colouring. */
export function highlightPowerFx(formula: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const match of formula.matchAll(TOKEN)) {
    if (match.index > last) tokens.push({ text: formula.slice(last, match.index), kind: "plain" });
    const kind = match[1] ? "string" : match[2] ? "number" : match[3] ? "function" : "name";
    tokens.push({ text: match[0], kind });
    last = match.index + match[0].length;
  }
  if (last < formula.length) tokens.push({ text: formula.slice(last), kind: "plain" });
  return tokens;
}

/** Each colour is above 7:1 on the code surface, which stays dark in both themes. */
const TOKEN_CLASS: Record<Token["kind"], string> = {
  string: "text-[#9be39b]",
  number: "text-[#f7c08a]",
  function: "text-[#c9b8ff]",
  name: "text-[#8fd8ff]",
  plain: "",
};

function Formula({ formula }: { formula: string }): ReactNode {
  return highlightPowerFx(formula).map((token, index) =>
    token.kind === "plain" ? (
      token.text
    ) : (
      <span key={index} className={TOKEN_CLASS[token.kind]}>
        {token.text}
      </span>
    ),
  );
}

export function FormulaList({ lines }: { lines: readonly Wiring[] }) {
  const [copied, setCopied] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function copy(line: Wiring) {
    const name = `${line.control}.${line.property}`;
    try {
      await navigator.clipboard.writeText(line.formula);
      setCopied(name);
    } catch {
      setCopied("");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(""), 2000);
  }

  return (
    <div className="on-code-surface mt-3 overflow-hidden rounded-2xl border border-code-border bg-code text-code-foreground">
      <ul className="divide-y divide-code-border font-mono text-[0.8125rem] leading-relaxed">
        {lines.map((line, index) => {
          const name = `${line.control}.${line.property}`;
          return (
            <li key={`${name}:${index}`} className="flex items-start gap-2 py-1.5 pr-1.5 pl-4">
              <p className="min-w-0 flex-1 py-1.5 break-all">
                <span className="font-semibold text-white">{name}</span>{" "}
                <span className="text-code-muted">=</span> <Formula formula={line.formula} />
              </p>
              <button
                type="button"
                aria-label={`Copy the ${name} formula`}
                onClick={() => copy(line)}
                className="grid size-9 shrink-0 place-items-center rounded-lg text-code-muted hover:bg-white/10 hover:text-code-foreground motion-safe:transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {copied === name ? (
                    <path d="M5 12l5 5L20 7" />
                  ) : (
                    <>
                      <rect x="9" y="9" width="11" height="11" rx="2" />
                      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
                    </>
                  )}
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
      <p role="status" className="sr-only">
        {copied ? `Copied the ${copied} formula.` : ""}
      </p>
    </div>
  );
}

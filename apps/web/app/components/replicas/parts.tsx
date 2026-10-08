/** The property-kind chips the component pages share (MVP-049). */

const KIND_CHIP: Record<string, string> = {
  Input: "bg-tech-automate text-tech-automate-ink",
  Output: "bg-tech-dataverse text-tech-dataverse-ink",
  InputFunction: "bg-tech-bi text-tech-bi-ink",
  OutputFunction: "bg-tech-bi text-tech-bi-ink",
  Event: "bg-tech-pages text-tech-pages-ink",
  Action: "bg-tech-apps text-tech-apps-ink",
};

export function KindChip({ kind }: { kind: string }) {
  return (
    <span
      className={`rounded-md px-1.5 py-1 font-mono text-[0.6875rem] leading-none font-semibold tracking-wider uppercase ${KIND_CHIP[kind] ?? "bg-muted"}`}
    >
      {kind}
    </span>
  );
}

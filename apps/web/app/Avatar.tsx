import { avatarFromSeed, type AvatarSpec } from "@ppu/domain-content";

/** Written out in full so Tailwind finds the classes. */
const TINT: Record<AvatarSpec["tint"], string> = {
  apps: "bg-tech-apps text-tech-apps-ink",
  automate: "bg-tech-automate text-tech-automate-ink",
  bi: "bg-tech-bi text-tech-bi-ink",
  copilot: "bg-tech-copilot text-tech-copilot-ink",
  dataverse: "bg-tech-dataverse text-tech-dataverse-ink",
  pages: "bg-tech-pages text-tech-pages-ink",
  gov: "bg-tech-gov text-tech-gov-ink",
};

/** Our own simple shapes, on a 24 x 24 grid. */
const SHAPE: Record<AvatarSpec["shape"], React.ReactNode> = {
  stack: (
    <>
      <rect x="8" y="4" width="11" height="9" rx="3" />
      <rect x="5" y="11" width="11" height="9" rx="3" fill="currentColor" />
    </>
  ),
  spark: <path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z" fill="currentColor" />,
  loop: (
    <>
      <path d="M18 12a6 6 0 1 1-2-4.5" />
      <path d="M16 3.5v4.5h-4.5" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="2" fill="currentColor" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" fill="currentColor" />
    </>
  ),
  wave: <path d="M3 14c3-6 6 6 9 0s6 6 9 0" />,
  node: (
    <>
      <path d="M7 7l10 5-10 5" />
      <circle cx="7" cy="7" r="2.5" fill="currentColor" />
      <circle cx="17" cy="12" r="2.5" fill="currentColor" />
      <circle cx="7" cy="17" r="2.5" fill="currentColor" />
    </>
  ),
};

/**
 * A reader's generated avatar (MVP-040): one of our area tints and one of our
 * own shapes, picked by their avatar seed. Decorative: their display name is
 * always shown next to it.
 */
export function Avatar({ seed, size = 40 }: { seed: string; size?: number }) {
  const spec = avatarFromSeed(seed);
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center rounded-[30%] ${TINT[spec.tint]}`}
      style={{ width: size, height: size }}
      data-avatar={`${spec.tint}-${spec.shape}`}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {SHAPE[spec.shape]}
      </svg>
    </span>
  );
}

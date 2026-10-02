import { TECHNOLOGIES } from "@ppu/domain-content";
import Link from "next/link";
import { TECHNOLOGY_PALETTE } from "../../lib/technology-palette";

/** Governance & admin, the seventh area (docs/final-decisions.md, 2026-10-02). */
export const GOVERNANCE_AREA = {
  key: "GOVERNANCE_ADMIN",
  name: "Governance & admin",
  slug: "governance",
  tint: "bg-tech-gov",
  ink: "text-tech-gov-ink",
  dot: "bg-tech-gov-ink",
  tagline: "Guardrails that don't slow makers down",
} as const;

/** Every area, in menu order: the six technologies, then Governance & admin. */
export const ALL_AREAS = [
  ...TECHNOLOGIES.map((entry) => ({
    key: entry.technology,
    name: entry.name,
    slug: entry.slug,
    ...TECHNOLOGY_PALETTE[entry.technology],
  })),
  GOVERNANCE_AREA,
];

/** The "Other areas" row at the foot of every hub. */
export function OtherAreas({ currentSlug }: { currentSlug: string }) {
  const areas = ALL_AREAS.filter((area) => area.slug !== currentSlug);
  return (
    <section aria-labelledby="other_sections" className="mx-auto mt-20 max-w-[77.5rem]">
      <h2 id="other_sections" className="text-3xl font-bold md:text-[2.25rem]">
        Other areas
      </h2>
      <ul className="mt-6 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-6">
        {areas.map((area) => (
          <li key={area.slug}>
            <Link
              href={`/${area.slug}`}
              className={`motion-lift flex h-32 flex-col justify-between rounded-[1.375rem] p-5 text-foreground no-underline ${area.tint}`}
            >
              <span className="font-display text-xl leading-tight font-bold">{area.name}</span>
              <span className={`text-[0.8125rem] font-semibold ${area.ink}`}>{area.tagline} →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

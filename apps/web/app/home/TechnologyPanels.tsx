import { TECHNOLOGIES, type Technology } from "@ppu/domain-content";
import Link from "next/link";
import type { ReactNode } from "react";
import { TECHNOLOGY_PALETTE } from "../../lib/technology-palette";

/**
 * The six technology panels on the home page (MVP-031, Daylight): each a big
 * tinted card linking to its section, with the real number of published
 * guides and a small looping illustration of what the section is about.
 * The illustrations are decoration (aria-hidden); the link's name is the
 * technology, its tagline and its guide count.
 */
export function TechnologyPanels({
  counts,
}: {
  counts: Readonly<Partial<Record<Technology, number>>>;
}) {
  return (
    <>
      <CompactPanels counts={counts} />
      <ul className="hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 lg:gap-[18px]">
        {TECHNOLOGIES.map((entry) => {
          const palette = TECHNOLOGY_PALETTE[entry.technology];
          const count = counts[entry.technology] ?? 0;
          return (
            <li key={entry.slug}>
              <Link
                href={`/${entry.slug}`}
                className={`motion-lift relative flex h-[340px] flex-col overflow-hidden rounded-[1.875rem] p-7 text-foreground no-underline lg:h-[400px] ${palette.tint}`}
              >
                <h3 className="font-display text-[1.875rem] leading-tight font-bold tracking-[-0.02em]">
                  {entry.name}
                </h3>
                <span className={`mt-1 text-[0.9375rem] ${palette.ink}`}>{palette.tagline}</span>
                <span className={`mt-3.5 text-[0.8125rem] font-semibold ${palette.ink}`}>
                  {count > 0
                    ? `${count} ${count === 1 ? "guide" : "guides"} →`
                    : "Guides coming soon →"}
                </span>
                <div aria-hidden="true" className="relative mt-2 flex min-h-0 flex-1 flex-col">
                  {TECHNOLOGY_VISUALS[entry.technology]}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function guideLabel(count: number): string {
  return count > 0 ? `${count} ${count === 1 ? "guide" : "guides"} →` : "Guides coming soon →";
}

/** Small illustrations for the first three compact panels (the mobile canvas). */
const COMPACT_VISUALS: Readonly<Partial<Record<Technology, ReactNode>>> = {
  POWER_APPS: (
    <span className="absolute right-[18px] -bottom-[30px] h-[130px] w-[84px] -rotate-[8deg] rounded-[18px] bg-[#14141a] p-1.5">
      <span className="block h-full rounded-[13px] bg-white" />
    </span>
  ),
  POWER_AUTOMATE: (
    <span className="absolute right-[18px] bottom-[22px] flex gap-1.5 text-[11px] font-semibold">
      <span className="rounded-[9px] bg-white px-2.5 py-1.5 text-[#14141a]">Try</span>
      <span className="rounded-[9px] bg-white px-2.5 py-1.5 text-[#9a3412]">Catch</span>
    </span>
  ),
  POWER_BI: (
    <span className="absolute right-5 bottom-5 flex items-end gap-[5px]">
      {[
        ["h-[30px]", "bg-[#fcd34d]", "0s"],
        ["h-[46px]", "bg-[#f59e0b]", "0.15s"],
        ["h-[62px]", "bg-[#14141a]", "0.3s"],
      ].map(([height, colour, delay]) => (
        <i
          key={delay}
          className={`motion-grow w-3.5 rounded ${height} ${colour}`}
          style={{ animationDelay: delay }}
        />
      ))}
    </span>
  ),
};

/**
 * The same six links, compact, below sm, as the mobile canvas draws them: the
 * first three as short panels with a small illustration, the last three as a
 * row of tiles. Only one of the two layouts is ever displayed.
 */
function CompactPanels({ counts }: { counts: Readonly<Partial<Record<Technology, number>>> }) {
  const [first, second] = [TECHNOLOGIES.slice(0, 3), TECHNOLOGIES.slice(3)];
  return (
    <div className="flex flex-col gap-3.5 sm:hidden">
      <ul className="flex flex-col gap-3.5">
        {first.map((entry) => {
          const palette = TECHNOLOGY_PALETTE[entry.technology];
          return (
            <li key={entry.slug}>
              <Link
                href={`/${entry.slug}`}
                className={`relative flex h-[150px] flex-col overflow-hidden rounded-3xl p-5 text-foreground no-underline ${palette.tint}`}
              >
                <h3 className="font-display text-2xl font-bold">{entry.name}</h3>
                <span className={`mt-0.5 text-sm ${palette.ink}`}>{palette.tagline}</span>
                <span className={`mt-auto text-[0.8125rem] font-semibold ${palette.ink}`}>
                  {guideLabel(counts[entry.technology] ?? 0)}
                </span>
                <span aria-hidden="true">{COMPACT_VISUALS[entry.technology]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <ul className="grid grid-cols-3 gap-2.5">
        {second.map((entry) => {
          const palette = TECHNOLOGY_PALETTE[entry.technology];
          const count = counts[entry.technology] ?? 0;
          return (
            <li key={entry.slug}>
              <Link
                href={`/${entry.slug}`}
                className={`flex h-[110px] flex-col justify-between rounded-[1.25rem] p-3.5 text-foreground no-underline ${palette.tint}`}
              >
                <h3 className="font-display text-base leading-tight font-bold">{entry.name}</h3>
                <span className={`text-xs font-semibold ${palette.ink}`}>
                  {count > 0 ? `${count} ${count === 1 ? "guide" : "guides"} →` : "Soon →"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const TRY_CATCH_PATH = "M52 34 C 150 34, 120 100, 165 100 S 230 166, 278 166";

/** One illustration per technology. Fixed colours: they sit on white mock
 * surfaces, which read on both themes' tints. */
export const TECHNOLOGY_VISUALS: Readonly<Record<Technology, ReactNode>> = {
  POWER_APPS: (
    <>
      <div className="absolute -bottom-16 left-1/2 h-[260px] w-[184px] -translate-x-[30%] -rotate-6 rounded-[30px] bg-[#14141a] p-2.5 shadow-[0_30px_50px_-20px_rgb(91_33_182/0.6)] lg:-bottom-9">
        <div className="flex h-full flex-col gap-2 overflow-hidden rounded-[22px] bg-white px-2.5 py-3.5">
          <span className="h-6 shrink-0 rounded-lg border-[1.5px] border-[#7c3aed]" />
          <div className="min-h-0 flex-1 overflow-hidden">
            <div className="motion-scroll flex flex-col gap-1.5 [animation-duration:8s]">
              {["#f5f0ff", "#ede4ff", "#ddd6fe", "#f5f0ff", "#ede4ff", "#ddd6fe"].map(
                (colour, index) => (
                  <span
                    key={index}
                    className="h-[54px] shrink-0 rounded-[10px]"
                    style={{ background: colour }}
                  />
                ),
              )}
            </div>
          </div>
        </div>
      </div>
      <span className="shape-sphere motion-bob absolute bottom-10 left-3 h-16 w-16 [animation-duration:6s]" />
    </>
  ),
  POWER_AUTOMATE: (
    <div className="relative mx-auto my-auto h-[200px] w-full max-w-[330px]">
      <svg viewBox="0 0 330 200" className="absolute inset-0 h-full w-full">
        <path
          d={TRY_CATCH_PATH}
          fill="none"
          stroke="#93c5fd"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="3 10"
        />
      </svg>
      <span
        className="motion-run absolute top-0 left-0 h-4 w-4 rounded-full border-[3px] border-white bg-[#2563eb] [animation-duration:3s]"
        style={{ offsetPath: `path("${TRY_CATCH_PATH}")`, offsetAnchor: "center" }}
      />
      <svg viewBox="0 0 330 200" className="absolute inset-0 h-full w-full font-sans">
        <rect x="8" y="12" width="88" height="44" rx="14" fill="#fff" />
        <text x="52" y="39" fontSize="14" textAnchor="middle" fill="#1e3a8a" fontWeight="600">
          Try
        </text>
        <rect x="121" y="78" width="88" height="44" rx="14" fill="#fff" />
        <text x="165" y="105" fontSize="14" textAnchor="middle" fill="#9a3412" fontWeight="600">
          Catch
        </text>
        <rect x="234" y="144" width="88" height="44" rx="14" fill="#14141a" />
        <text x="278" y="171" fontSize="14" textAnchor="middle" fill="#fff" fontWeight="600">
          Finally
        </text>
      </svg>
    </div>
  ),
  POWER_BI: (
    <div className="relative mt-auto flex h-[190px] items-end gap-3">
      <span className="absolute inset-x-0 top-[18px] border-t-[3px] border-dashed border-[#d97706]" />
      <span className="absolute top-[-6px] right-0 font-mono text-[11px] text-tech-bi-ink">
        TARGET
      </span>
      {[
        ["h-[70px]", "bg-[#fde68a]", "0s"],
        ["h-[112px]", "bg-[#fcd34d]", "0.12s"],
        ["h-[96px]", "bg-[#fbbf24]", "0.24s"],
        ["h-[146px]", "bg-[#f59e0b]", "0.36s"],
        ["h-[178px]", "bg-foreground", "0.48s"],
      ].map(([height, colour, delay]) => (
        <span
          key={delay}
          className={`motion-grow flex-1 rounded-t-xl rounded-b ${height} ${colour}`}
          style={{ animationDelay: delay }}
        />
      ))}
    </div>
  ),
  COPILOT_STUDIO: (
    <div className="my-auto flex flex-col gap-3 text-[0.9375rem] text-[#14141a]">
      <span className="motion-question self-end rounded-[16px_16px_4px_16px] bg-[#14141a] px-4 py-2.5 text-white">
        Which sites can you search?
      </span>
      <div className="grid justify-items-start">
        <span className="motion-typing col-start-1 row-start-1 motion-reduce:hidden inline-flex gap-1.5 rounded-[16px_16px_16px_4px] bg-white px-4 py-4">
          {["0s", "0.2s", "0.4s"].map((delay) => (
            <span
              key={delay}
              className="motion-dot h-[7px] w-[7px] rounded-full bg-[#0d9488]"
              style={{ animationDelay: delay }}
            />
          ))}
        </span>
        <span className="motion-answer col-start-1 row-start-1 rounded-[16px_16px_16px_4px] bg-white px-4 py-2.5">
          Only the HR and IT sites you approved.
        </span>
      </div>
      <span className="self-start rounded-full bg-white px-2.5 py-1.5 text-xs font-semibold text-[#115e59]">
        ● Grounded in 2 knowledge sources
      </span>
    </div>
  ),
  DATAVERSE: (
    <div className="relative mt-4 flex-1 text-[#3f3f4a]">
      <svg
        viewBox="0 0 330 210"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <path
          d="M128 74 H168 V40 H206"
          fill="none"
          stroke="#059669"
          strokeWidth="3"
          strokeDasharray="4 6"
        />
        <path
          d="M128 74 H168 V158 H206"
          fill="none"
          stroke="#059669"
          strokeWidth="3"
          strokeDasharray="4 6"
        />
      </svg>
      <div className="absolute top-3.5 left-0 w-32 overflow-hidden rounded-2xl bg-white shadow-[0_16px_30px_-18px_rgb(6_95_70/0.6)]">
        <span className="block bg-[#047857] px-3 py-2 text-[13px] font-semibold text-white">
          Account
        </span>
        <span className="block px-3 py-2 text-xs">Name</span>
        <span className="block px-3 py-2 text-xs">Owner</span>
        <span className="block px-3 py-2 text-xs">Region</span>
      </div>
      <div className="absolute top-1 right-0 w-32 overflow-hidden rounded-2xl bg-white shadow-[0_16px_30px_-18px_rgb(6_95_70/0.6)]">
        <span className="block bg-[#14141a] px-3 py-2 text-[13px] font-semibold text-white">
          Contact
        </span>
        <span className="block px-3 py-2 text-xs">Account (lookup)</span>
      </div>
      <div className="absolute top-[122px] right-0 w-32 overflow-hidden rounded-2xl bg-white shadow-[0_16px_30px_-18px_rgb(6_95_70/0.6)]">
        <span className="block bg-[#34d399] px-3 py-2 text-[13px] font-semibold text-[#14141a]">
          Inspection
        </span>
        <span className="block px-3 py-2 text-xs">Account (lookup)</span>
      </div>
    </div>
  ),
  POWER_PAGES: (
    <div className="absolute inset-x-0 -bottom-10 h-[232px] overflow-hidden rounded-t-[18px] bg-white text-[#3f3f4a] shadow-[0_30px_50px_-20px_rgb(157_23_77/0.5)] lg:-bottom-6">
      <div className="flex items-center gap-1.5 border-b border-[#f3e8ee] px-3 py-2.5">
        <span className="h-[9px] w-[9px] rounded-full bg-[#fbcfe8]" />
        <span className="h-[9px] w-[9px] rounded-full bg-[#fbcfe8]" />
        <span className="h-[9px] w-[9px] rounded-full bg-[#fbcfe8]" />
        <span className="ml-2 font-mono text-[10px] text-[#9d174d]">Signed in · Customer</span>
      </div>
      <div className="flex flex-col gap-2.5 p-4">
        <span className="text-xs font-semibold">Request a site visit</span>
        <span className="h-[30px] rounded-[9px] border-[1.5px] border-[#f9a8d4]" />
        <span className="h-[30px] rounded-[9px] border-[1.5px] border-[#f9a8d4]" />
        <span className="self-start rounded-full bg-[#db2777] px-[18px] py-2 text-[13px] font-semibold text-white">
          Submit
        </span>
      </div>
    </div>
  ),
};

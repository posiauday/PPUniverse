import type { ProductTechnology } from "@ppu/domain-content";
import { TECHNOLOGY_VISUALS } from "../home/TechnologyPanels";

/** Rows in the Power Apps hero phone: an invented sample list, decoration only. */
const PHONE_ROWS = [
  { name: "North depot", swatch: "#8b5cf6" },
  { name: "North harbour", swatch: "#f59e0b" },
  { name: "North quarry", swatch: "#db2777" },
  { name: "North ridge", swatch: "#059669" },
  { name: "Northgate yard", swatch: "#0284c7" },
  { name: "North point", swatch: "#8b5cf6" },
] as const;

/**
 * Power Automate's hub (board H1): a flow mid-run. The trigger has fired, a
 * dot travels to the approval, which is waiting; the email step is next.
 * Fixed light colours, like a screenshot of the maker portal.
 */
function FlowRunVisual() {
  return (
    <div className="pointer-events-none absolute top-1/2 right-12 hidden w-[390px] -translate-y-1/2 flex-col gap-3 rounded-[1.75rem] border border-white/90 bg-white/60 p-5 text-[0.9375rem] text-[#14141a] xl:flex">
      <span className="flex items-center gap-2.5 rounded-2xl bg-white p-3.5">
        <i className="h-[30px] w-[30px] rounded-[9px] bg-[#1d4ed8]" />
        <b className="font-semibold">When an item is created</b>
        <span className="ml-auto font-mono text-xs text-[#166534]">✓ 1s</span>
      </span>
      <span className="relative mx-4 h-[22px]">
        <i className="absolute inset-x-0 top-1/2 h-0.5 bg-[#14141a]/15" />
        <i className="motion-travel absolute top-1/2 -mt-[7px] h-3.5 w-3.5 rounded-full border-2 border-[#14141a] bg-[#a3e635]" />
      </span>
      <span className="flex items-center gap-2.5 rounded-2xl bg-white p-3.5">
        <i className="h-[30px] w-[30px] rounded-[9px] bg-[#ff7a59]" />
        <b className="font-semibold">Start and wait for an approval</b>
        <span className="motion-blink ml-auto font-mono text-xs text-[#92400e]">waiting</span>
      </span>
      <span className="flex items-center gap-2.5 rounded-2xl bg-white p-3.5 opacity-70">
        <i className="h-[30px] w-[30px] rounded-[9px] bg-[#a3e635]" />
        <b className="font-semibold">Send an email (V2)</b>
      </span>
    </div>
  );
}

/** Power BI's hub (board H2): four bars rising to a target, the last one ink. */
function RisingBarsVisual() {
  const bars = [
    { height: "46%", colour: "#f59e0b" },
    { height: "70%", colour: "#ff7a59" },
    { height: "58%", colour: "#7c3aed" },
    { height: "92%", colour: "#14141a" },
  ] as const;
  return (
    <div className="pointer-events-none absolute top-1/2 right-24 hidden h-[200px] -translate-y-1/2 items-end gap-3.5 xl:flex">
      {bars.map((bar, index) => (
        <i
          key={bar.colour}
          className="motion-grow block w-[34px] rounded-t-xl rounded-b-md"
          style={{ height: bar.height, background: bar.colour, animationDelay: `${index * 0.4}s` }}
        />
      ))}
    </div>
  );
}

/**
 * The decorative illustration in a technology section's header (MVP-031).
 * Power Apps gets the canvas's hero phone: tilted, with a search box whose
 * cursor blinks and a list that scrolls, plus a sphere and a lime pill. The
 * other five sections, which the canvas does not draw, reuse their home-page
 * panel illustration. Hidden from assistive technology by the caller; the
 * mock app is always light, like a screenshot.
 */
export function TechnologyHeroVisual({ technology }: { technology: ProductTechnology }) {
  if (technology === "POWER_AUTOMATE") return <FlowRunVisual />;
  if (technology === "POWER_BI") return <RisingBarsVisual />;
  if (technology !== "POWER_APPS") {
    return (
      <div className="pointer-events-none absolute top-10 right-16 bottom-0 hidden w-[340px] flex-col xl:flex">
        {TECHNOLOGY_VISUALS[technology]}
      </div>
    );
  }
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[480px] xl:block">
      <div className="absolute top-[70px] right-[150px] h-[470px] w-[240px] -rotate-[7deg] rounded-[40px] bg-[#14141a] p-3 shadow-[0_40px_60px_-24px_rgb(91_33_182/0.6)]">
        <div className="flex h-full flex-col gap-2.5 overflow-hidden rounded-[30px] bg-white px-3.5 py-[18px] text-[#14141a]">
          <span className="font-display text-[15px] font-bold">Site inspections</span>
          <span className="flex h-[34px] shrink-0 items-center rounded-[10px] border-[1.5px] border-[#7c3aed] px-2.5 text-[13px]">
            North
            <span className="motion-caret ml-0.5 h-[15px] w-[1.5px] bg-[#7c3aed]" />
          </span>
          <div className="min-h-0 flex-1 overflow-hidden">
            <div className="motion-scroll flex flex-col gap-2 [animation-duration:9s]">
              {PHONE_ROWS.map((row) => (
                <span
                  key={row.name}
                  className="flex h-[54px] shrink-0 items-center gap-2 rounded-xl bg-[#f5f0ff] px-2.5 text-xs font-medium"
                >
                  <i className="h-7 w-7 rounded-lg" style={{ background: row.swatch }} />
                  {row.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <span className="shape-sphere motion-bob absolute top-[60px] right-[70px] h-[84px] w-[84px]" />
      <span className="shape-pill motion-bob-alt absolute right-[420px] bottom-[42px] h-[46px] w-[130px]" />
    </div>
  );
}

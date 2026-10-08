import Link from "next/link";

/**
 * The Daylight home hero (MVP-031; docs/final-decisions.md, "Visual
 * redesign: Daylight"): the headline rising in word by word, with a lime
 * marker sweeping under the accent word, then the calls to action, then a
 * wide "stage" of animated mock-ups.
 *
 * Truthful by construction: the announcement pill shows the real number of
 * published guides and is left out when there are none. The stage is
 * decoration -- an invented sample app, flow, KPI card and chat, built from
 * plain elements -- so it is hidden from assistive technology (aria-hidden)
 * and says nothing the headline does not. Every animation's resting state is
 * the finished picture, so with reduced motion (globals.css) it is simply
 * still.
 */
export function HomeHero({ guideCount }: { guideCount: number }) {
  return (
    <section aria-labelledby="home_title" className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-6 h-[520px] bg-[radial-gradient(rgb(20_20_26/0.09)_1.2px,transparent_1.2px)] [mask-image:linear-gradient(#000,transparent_70%)] bg-[length:26px_26px]"
      />
      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 pt-8 text-center sm:px-4 md:pt-14">
        {guideCount > 0 ? (
          <Link
            href="/learn"
            className="motion-rise inline-flex min-h-11 items-center gap-2.5 rounded-full border border-border bg-card py-1.5 pr-4 pl-1.5 text-sm text-muted-foreground no-underline shadow-[0_6px_20px_-12px_rgb(20_20_26/0.3)] hover:text-foreground"
          >
            <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-highlight">
              <span className="sr-only">Learn: </span>New
            </span>
            {guideCount} free {guideCount === 1 ? "guide" : "guides"} across six technologies
            <span aria-hidden="true">→</span>
          </Link>
        ) : null}
        <h1
          id="home_title"
          className="text-[3.125rem] leading-[0.98] font-bold sm:text-7xl lg:max-w-[58rem] lg:text-[6.25rem] lg:leading-[0.96]"
        >
          <Word delay={0.1}>Build</Word> <Word delay={0.18}>Power</Word>{" "}
          <Word delay={0.26}>Platform</Word> <Word delay={0.34}>apps</Word>{" "}
          <Word delay={0.42}>that</Word>{" "}
          <Word delay={0.5} className="accent-word text-[1.12em]">
            <span className="marker">actually</span>
          </Word>{" "}
          <Word delay={0.58}>hold</Word> <Word delay={0.66}>up.</Word>
        </h1>
        <p
          className="motion-rise max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          style={{ animationDelay: "0.7s" }}
        >
          Free tutorials, architecture patterns and KPI guides for Power Apps, Power Automate, Power
          BI, Copilot Studio, Dataverse and Power Pages.
        </p>
        <div
          className="motion-rise flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row"
          style={{ animationDelay: "0.85s" }}
        >
          <Link
            href="/learn"
            className="motion-press inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-primary px-7 text-[1.0625rem] font-semibold text-primary-foreground no-underline"
          >
            Start learning <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="#technologies"
            className="inline-flex min-h-14 items-center justify-center rounded-full border-[1.5px] border-foreground bg-card px-7 text-[1.0625rem] font-semibold text-foreground no-underline hover:bg-muted"
          >
            Explore the six technologies
          </Link>
        </div>
        <p className="font-mono text-xs tracking-wider text-muted-foreground">
          INDEPENDENT · NOT AFFILIATED WITH MICROSOFT
        </p>
      </div>

      <HeroStage />
    </section>
  );
}

function Word({
  delay,
  className,
  children,
}: {
  delay: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`motion-word${className ? ` ${className}` : ""}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </span>
  );
}

const STAGE_ROWS = [
  {
    title: "North depot",
    detail: "Row 12",
    status: "Passed",
    tone: "pass",
    swatch: "from-[#c4b5fd] to-[#7c3aed]",
  },
  {
    title: "North harbour",
    detail: "Row 861",
    status: "Due",
    tone: "due",
    swatch: "from-[#fde68a] to-[#f59e0b]",
  },
  {
    title: "North quarry",
    detail: "Row 2,417",
    status: "Passed",
    tone: "pass",
    swatch: "from-[#fbcfe8] to-[#db2777]",
  },
  {
    title: "North ridge",
    detail: "Row 4,902",
    status: "Due",
    tone: "due",
    swatch: "from-[#a7f3d0] to-[#059669]",
  },
  {
    title: "Northgate yard",
    detail: "Row 7,330",
    status: "Overdue",
    tone: "late",
    swatch: "from-[#bae6fd] to-[#0284c7]",
  },
] as const;

const STATUS_TONE = {
  pass: "bg-[#dcfce7] text-[#166534]",
  due: "bg-[#fef3c7] text-[#92400e]",
  late: "bg-[#ffe4e6] text-[#9f1239]",
} as const;

// The dot follows this path with the lcs-run-flow keyframes in globals.css: change both together.
const FLOW_PATH = "M30 26 H115 V104 H198";

/**
 * The decorative stage. Every element has its own lane, so nothing overlaps
 * content: the app window in the centre, the flow card on the left, the KPI
 * card on the right, the chat below the window, the shapes in the corners.
 * The side cards appear only on wide screens. The mock app is always light,
 * like a screenshot, so its fixed colours do not follow the theme.
 */
function HeroStage() {
  return (
    <div
      aria-hidden="true"
      className="motion-rise relative mx-auto mt-12 h-[470px] max-w-[77.5rem] overflow-hidden rounded-[2.25rem] bg-stage md:mt-14 lg:h-[640px]"
      style={{ animationDelay: "0.9s" }}
    >
      <div className="motion-drift absolute -top-40 -left-32 h-[620px] w-[620px] rounded-full bg-[#c4b5fd] opacity-80 blur-[70px]" />
      <div className="motion-drift-alt absolute -top-24 -right-36 h-[560px] w-[560px] rounded-full bg-[#fdba74] opacity-60 blur-[80px]" />
      <div className="motion-drift absolute -bottom-64 left-[30%] h-[520px] w-[640px] rounded-full bg-[#bef264] opacity-55 blur-[80px] [animation-duration:18s]" />
      <div className="motion-drift-alt absolute right-[10%] -bottom-52 h-[420px] w-[420px] rounded-full bg-[#7dd3fc] opacity-55 blur-[70px] [animation-duration:20s]" />

      <span className="shape-sphere motion-bob absolute top-11 left-6 h-16 w-16 lg:left-14 lg:h-[92px] lg:w-[92px]" />
      <span className="shape-ring motion-bob-alt absolute top-9 right-6 hidden h-[108px] w-[108px] lg:right-16 lg:block" />
      <span className="shape-pill motion-bob-alt absolute bottom-14 left-[70px] hidden h-[54px] w-[150px] lg:block" />
      <span className="shape-cube motion-bob absolute right-6 bottom-8 h-14 w-14 [animation-duration:10s] lg:right-20 lg:bottom-[60px] lg:h-[76px] lg:w-[76px]" />

      {/* App window: centre lane */}
      <div className="absolute top-10 left-1/2 w-[min(540px,calc(100%-2rem))] -translate-x-1/2 overflow-hidden rounded-[22px] bg-white text-[#14141a] shadow-[0_40px_80px_-30px_rgb(20_20_26/0.45),0_0_0_1px_rgb(20_20_26/0.06)] lg:top-14">
        <div className="flex items-center gap-2 border-b border-[#eeeae2] bg-[#fbfaf7] px-4 py-3">
          <span className="h-[11px] w-[11px] rounded-full bg-[#ff6b5e]" />
          <span className="h-[11px] w-[11px] rounded-full bg-[#ffc23d]" />
          <span className="h-[11px] w-[11px] rounded-full bg-[#2dcb52]" />
          <span className="ml-3 truncate font-mono text-xs">
            <span className="text-[#6b6b78]">Items =</span>{" "}
            <span className="text-[#7c3aed]">Filter</span>(Tasks,{" "}
            <span className="text-[#7c3aed]">StartsWith</span>(Title, txtSearch.Value))
          </span>
        </div>
        <div className="grid sm:grid-cols-[1fr_180px]">
          <div className="flex flex-col gap-3 bg-[#fbfaf7] p-5">
            <div className="flex items-center justify-between">
              <span className="font-display text-xl font-bold">Site inspections</span>
              <span className="rounded-full bg-[#ecfccb] px-2.5 py-1 font-mono text-[11px] text-[#3f6212]">
                EVERY ROW
              </span>
            </div>
            <div className="flex h-[42px] items-center rounded-xl border-[1.5px] border-[#7c3aed] bg-white px-3 text-[15px]">
              North
              <span className="ml-0.5 h-5 w-0.5 bg-[#7c3aed]" />
            </div>
            <div className="h-[172px] overflow-hidden">
              <div className="motion-scroll flex flex-col gap-2 [animation-delay:2s]">
                {STAGE_ROWS.map((row) => (
                  <div
                    key={row.title}
                    className="flex items-center gap-3 rounded-2xl border border-[#eeeae2] bg-white p-2.5"
                  >
                    <span
                      className={`h-8 w-8 shrink-0 rounded-[10px] bg-gradient-to-br ${row.swatch}`}
                    />
                    <span className="grow text-sm font-medium">
                      {row.title}
                      <span className="block text-xs font-normal text-[#6b6b78]">{row.detail}</span>
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_TONE[row.tone]}`}>
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="hidden flex-col gap-3 border-l border-[#eeeae2] px-4 py-[18px] text-[13px] text-[#3f3f4a] sm:flex">
            <span className="font-mono text-[10px] tracking-widest text-[#6b6b78]">CHECKS</span>
            {["Delegable", "No row limit hit", "Searches every row"].map((check) => (
              <span key={check} className="flex items-center gap-2">
                <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[#a3e635]">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#14141a"
                    strokeWidth="4"
                  >
                    <path d="M5 12l5 5 9-10" />
                  </svg>
                </span>
                {check}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Flow card: left lane */}
      <div className="motion-float absolute top-[196px] left-12 hidden w-[262px] rounded-[20px] bg-white p-4 text-[#14141a] shadow-[0_30px_60px_-28px_rgb(20_20_26/0.45)] lg:block">
        <span className="font-mono text-[10px] tracking-widest text-[#1d4ed8]">POWER AUTOMATE</span>
        <div className="relative mt-2.5 h-[130px] w-[230px]">
          <svg viewBox="0 0 230 130" width="230" height="130" className="absolute inset-0">
            <path
              d={FLOW_PATH}
              fill="none"
              stroke="#bfdbfe"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="2 7"
            />
          </svg>
          <span className="motion-run-flow absolute top-0 left-0 h-3 w-3 rounded-full bg-[#2563eb]" />
          <svg
            viewBox="0 0 230 130"
            width="230"
            height="130"
            className="absolute inset-0 font-sans"
          >
            <rect x="2" y="10" width="56" height="32" rx="10" fill="#dbeafe" />
            <text x="30" y="30" fontSize="11" textAnchor="middle" fill="#1e3a8a" fontWeight="600">
              Trigger
            </text>
            <rect x="84" y="49" width="62" height="32" rx="10" fill="#fef3c7" />
            <text x="115" y="69" fontSize="11" textAnchor="middle" fill="#78350f" fontWeight="600">
              Approve?
            </text>
            <rect x="170" y="88" width="58" height="32" rx="10" fill="#dcfce7" />
            <text x="199" y="108" fontSize="11" textAnchor="middle" fill="#14532d" fontWeight="600">
              Notify
            </text>
          </svg>
        </div>
      </div>

      {/* KPI card: right lane */}
      <div className="motion-float absolute top-[196px] right-12 hidden w-[262px] rounded-[20px] bg-white p-4 text-[#14141a] shadow-[0_30px_60px_-28px_rgb(20_20_26/0.45)] [animation-delay:1.5s] lg:block">
        <span className="font-mono text-[10px] tracking-widest text-[#92400e]">
          POWER BI · KPI CARD
        </span>
        <div className="relative mt-3.5 flex h-[100px] items-end gap-2">
          <span className="absolute inset-x-0 top-3.5 border-t-2 border-dashed border-[#f59e0b]" />
          {[
            ["h-[44px]", "bg-[#fde68a]", "0s"],
            ["h-[58px]", "bg-[#fcd34d]", "0.15s"],
            ["h-[52px]", "bg-[#fbbf24]", "0.3s"],
            ["h-[72px]", "bg-[#f59e0b]", "0.45s"],
            ["h-[92px]", "bg-[#14141a]", "0.6s"],
          ].map(([height, colour, delay]) => (
            <span
              key={delay}
              className={`motion-grow flex-1 rounded-t-md rounded-b-sm ${height} ${colour}`}
              style={{ animationDelay: delay }}
            />
          ))}
        </div>
        <span className="mt-3 block text-[13px] text-[#3f3f4a]">Target, trend and context</span>
      </div>

      {/* Named cursors (wide screens): they only travel over empty space. */}
      <div className="motion-cursor-a absolute top-[186px] left-[640px] hidden lg:block">
        <Cursor colour="#7c3aed" label="You" />
      </div>
      <div className="motion-cursor-b absolute top-[470px] left-[870px] hidden lg:block">
        <Cursor colour="#c2410c" label="The guide" />
      </div>

      {/* Chat: lower centre lane */}
      <div className="absolute top-[458px] left-1/2 hidden w-[440px] -translate-x-1/2 flex-col gap-2.5 text-sm text-[#14141a] lg:flex">
        <span className="motion-question self-end rounded-[16px_16px_4px_16px] bg-[#14141a] px-3.5 py-2.5 text-white">
          How do I reset my password?
        </span>
        <div className="grid justify-items-start">
          <span className="motion-typing col-start-1 row-start-1 motion-reduce:hidden inline-flex gap-1.5 rounded-[16px_16px_16px_4px] bg-white px-4 py-3.5">
            {["0s", "0.2s", "0.4s"].map((delay) => (
              <span
                key={delay}
                className="motion-dot h-[7px] w-[7px] rounded-full bg-[#0d9488]"
                style={{ animationDelay: delay }}
              />
            ))}
          </span>
          <span className="motion-answer col-start-1 row-start-1 inline-flex items-center gap-2.5 rounded-[16px_16px_16px_4px] bg-white px-3.5 py-2.5 shadow-[0_16px_30px_-18px_rgb(20_20_26/0.45)]">
            <span className="h-[22px] w-[22px] rounded-full bg-gradient-to-br from-[#5eead4] to-[#0d9488]" />
            From your IT support site: 3 steps <span className="text-[#0f766e]">↗</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function Cursor({ colour, label }: { colour: string; label: string }) {
  return (
    <>
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path
          d="M3 2l7 19 3-8 8-3z"
          fill={colour}
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="absolute top-[18px] left-4 rounded-[999px_999px_999px_4px] px-2 py-[3px] text-[11px] font-semibold whitespace-nowrap text-white"
        style={{ background: colour }}
      >
        {label}
      </span>
    </>
  );
}

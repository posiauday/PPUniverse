import { avatarFromSeed, type AvatarSpec } from "@ppu/domain-content";
import { CROWN_SEED } from "../lib/avatar-seeds";

/**
 * A reader's generated avatar, a "maker critter" (MVP-040; redrawn
 * 2026-10-08): a small character with one low-code accessory, drawn from
 * their avatar seed by avatarFromSeed, wearing a name tag with their initials. Our own drawing on a 64 x 64 grid, no
 * product logos. Decorative: the display name is always shown next to it.
 *
 * Plain SVG with no ids (no gradients, <pattern> or clip-path defs), so any
 * number of avatars can share a page without duplicate ids.
 *
 * No tile (product owner, 2026-10-09, "Avatars: no tile, a little 3D"): the
 * background is transparent, the sparkles stay on the page around the
 * character, and a small offset shade under the head and the name tag, with a
 * very light drop shadow, gives a slight 3D look.
 */

const PALETTE: Record<
  AvatarSpec["palette"],
  { bg: string; glow: string; body: string; ink: string }
> = {
  apps: { bg: "#efe7ff", glow: "#d9cbff", body: "#8b5cf6", ink: "#5b21b6" },
  automate: { bg: "#e1eeff", glow: "#c3d9ff", body: "#3b82f6", ink: "#1e40af" },
  bi: { bg: "#fff3cc", glow: "#ffe08a", body: "#f59e0b", ink: "#92400e" },
  copilot: { bg: "#d6f7ee", glow: "#aeeedb", body: "#14b8a6", ink: "#115e59" },
  dataverse: { bg: "#ddf8e6", glow: "#b6efc9", body: "#22c55e", ink: "#065f46" },
  pages: { bg: "#ffe0ee", glow: "#ffc2db", body: "#ec4899", ink: "#9d174d" },
  gov: { bg: "#e8edf3", glow: "#cdd6e2", body: "#64748b", ink: "#334155" },
  coral: { bg: "#ffe6d9", glow: "#ffcbb0", body: "#f97316", ink: "#9a3412" },
};

const DARK = "#14141a";
const GOLD = "#facc15";

/**
 * Sparkles around the critter, where the tile used to be: three per avatar,
 * laid out by its pattern so avatars differ, clear of every accessory and the
 * name tag. [x, y, size] on the 64 x 64 grid.
 */
const SPARKLES: Record<AvatarSpec["pattern"], readonly (readonly [number, number, number])[]> = {
  dots: [
    [6.5, 30, 3],
    [9, 49, 1.8],
    [57, 34, 2],
  ],
  rings: [
    [7, 38, 2.4],
    [11, 52, 1.6],
    [57.5, 31, 2.4],
  ],
  stripes: [
    [6.5, 44, 2.8],
    [9.5, 30, 1.6],
    [56.5, 36, 1.8],
  ],
  grid: [
    [7, 33, 2],
    [7.5, 48, 2.6],
    [57, 32, 1.6],
  ],
};

/** A very light drop shadow lifts the avatar off the page (.avatar-lift in globals.css). */
const LIFT = "avatar-lift shrink-0 overflow-visible";

/** A little in from the 64 x 64 grid's edge: without a tile, the character can fill more of the box. */
const VIEW_BOX = "2 2 60 60";

function Head({ kind, fill }: { kind: AvatarSpec["head"]; fill: string }) {
  if (kind === "round") return <circle cx="32" cy="37" r="17" fill={fill} />;
  if (kind === "hex")
    return (
      <polygon
        points="32,19 47.5,28 47.5,46 32,55 16.5,46 16.5,28"
        fill={fill}
        strokeLinejoin="round"
        stroke={fill}
        strokeWidth="3"
      />
    );
  if (kind === "blob")
    return (
      <path
        d="M30.5 20c11-1 18.5 6 18.5 16.5 0 10-6.5 17.5-17.5 17.5S15 47 15 37.5C15 26.5 20.5 21 30.5 20z"
        fill={fill}
      />
    );
  return <rect x="15" y="21" width="34" height="32" rx="12" fill={fill} />;
}

function Eyes({ kind, glint }: { kind: AvatarSpec["eyes"]; glint: string }) {
  const arc = (x: number) => (
    <path
      d={`M${x - 3} 35.5q3-4 6 0`}
      fill="none"
      stroke={DARK}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  );
  const dot = (x: number, rx = 2.8, ry = 2.8) => (
    <g>
      <ellipse cx={x} cy="34.5" rx={rx} ry={ry} fill={DARK} />
      <circle cx={x + 0.9} cy={34.5 - ry / 2.4} r="0.95" fill="#fff" />
    </g>
  );
  if (kind === "ovals")
    return (
      <>
        {dot(26, 2.6, 3.8)}
        {dot(38, 2.6, 3.8)}
      </>
    );
  if (kind === "happy")
    return (
      <>
        {arc(26)}
        {arc(38)}
      </>
    );
  if (kind === "wink")
    return (
      <>
        {dot(26)}
        {arc(38)}
      </>
    );
  if (kind === "visor")
    return (
      <g>
        <rect x="19.5" y="30" width="25" height="9" rx="4.5" fill={DARK} />
        <circle cx="26.5" cy="34.5" r="2" fill={glint} />
        <circle cx="37.5" cy="34.5" r="2" fill={glint} />
        <path
          d="M22 31.8h5"
          stroke="#fff"
          strokeOpacity=".35"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>
    );
  return (
    <>
      {dot(26)}
      {dot(38)}
    </>
  );
}

function Mouth({ kind }: { kind: AvatarSpec["mouth"] }) {
  const line = { fill: "none", stroke: DARK, strokeWidth: 2.2, strokeLinecap: "round" as const };
  if (kind === "open") return <ellipse cx="32" cy="44" rx="2.6" ry="2.3" fill={DARK} />;
  if (kind === "grin")
    return (
      <g>
        <path d="M27 42h10q0 6-5 6t-5-6z" fill={DARK} />
        <rect x="29" y="42" width="6" height="1.8" rx=".6" fill="#fff" />
      </g>
    );
  if (kind === "line") return <path d="M29 44h6" {...line} />;
  if (kind === "cat") return <path d="M27.5 43q2.25 3 4.5 0q2.25 3 4.5 0" {...line} />;
  return <path d="M28 43q4 4.5 8 0" {...line} />;
}

function Gear({ ink, bg }: { ink: string; bg: string }) {
  const teeth = Array.from({ length: 8 }, (_, i) => (
    <rect
      key={i}
      x="15"
      y="5.5"
      width="4"
      height="5"
      rx="1"
      fill={ink}
      transform={`rotate(${i * 45} 17 15)`}
    />
  ));
  return (
    <g>
      {teeth}
      <circle cx="17" cy="15" r="6.2" fill={ink} />
      <circle cx="17" cy="15" r="2.4" fill={bg} />
    </g>
  );
}

/** Accessories drawn behind the head (their base is hidden by it). */
function BackAccessory({
  kind,
  ink,
  bg,
}: {
  kind: AvatarSpec["accessory"];
  ink: string;
  bg: string;
}) {
  if (kind === "antenna")
    return (
      <g>
        <path d="M32 24V10" stroke={DARK} strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="9" r="3.6" fill={ink} stroke={DARK} strokeWidth="1.4" />
        <circle
          cx="32"
          cy="9"
          r="7"
          fill="none"
          stroke={ink}
          strokeOpacity=".35"
          strokeWidth="1.2"
        />
      </g>
    );
  if (kind === "gear") return <Gear ink={ink} bg={bg} />;
  return null;
}

/** Accessories drawn on top of the head. */
function FrontAccessory({ kind, ink }: { kind: AvatarSpec["accessory"]; ink: string }) {
  switch (kind) {
    case "bolt":
      return (
        <polygon
          points="50,4 42.5,16 47.5,16 44.5,27 54,12.5 48.8,12.5 52.5,4"
          fill={GOLD}
          stroke={DARK}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      );
    case "bars":
      return (
        <g stroke={DARK} strokeWidth="1.3" strokeLinejoin="round">
          <rect x="24.5" y="12" width="5" height="9" rx="1.2" fill={ink} />
          <rect x="30" y="7" width="5" height="14" rx="1.2" fill={GOLD} />
          <rect x="35.5" y="14" width="5" height="7" rx="1.2" fill={ink} />
          <path d="M22.5 21.5h20" strokeLinecap="round" />
        </g>
      );
    case "bubble":
      return (
        <g>
          <path
            d="M39 6.5h14a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4h-8l-4.5 4v-4H39a4 4 0 0 1-4-4v-7a4 4 0 0 1 4-4z"
            fill="#fff"
            stroke={DARK}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          {[41, 46, 51].map((x) => (
            <circle key={x} cx={x} cy="14" r="1.4" fill={ink} />
          ))}
        </g>
      );
    case "cylinder":
      return (
        <g stroke={DARK} strokeWidth="1.3">
          <path d="M23 11v9.5c0 1.9 4 3.5 9 3.5s9-1.6 9-3.5V11" fill={ink} />
          <path d="M23 15.8c0 1.9 4 3.5 9 3.5s9-1.6 9-3.5" fill="none" strokeOpacity=".6" />
          <ellipse cx="32" cy="11" rx="9" ry="3.4" fill={GOLD} />
        </g>
      );
    case "spark":
      return (
        <g fill={GOLD} stroke={DARK} strokeWidth="1.2" strokeLinejoin="round">
          <path d="M49 4l2.2 6.3L57.5 12.5l-6.3 2.2L49 21l-2.2-6.3-6.3-2.2 6.3-2.2z" />
          <path d="M57 19l1 2.8 2.8 1-2.8 1-1 2.8-1-2.8-2.8-1 2.8-1z" />
        </g>
      );
    case "headset":
      return (
        <g>
          <path
            d="M14.5 36a17.5 17.5 0 0 1 35 0"
            fill="none"
            stroke={DARK}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <rect
            x="10.5"
            y="31"
            width="7"
            height="12"
            rx="3.5"
            fill={ink}
            stroke={DARK}
            strokeWidth="1.3"
          />
          <rect
            x="46.5"
            y="31"
            width="7"
            height="12"
            rx="3.5"
            fill={ink}
            stroke={DARK}
            strokeWidth="1.3"
          />
          <path
            d="M14 42.5q1.5 7.5 10 7.5"
            fill="none"
            stroke={DARK}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="25" cy="50" r="2" fill={DARK} />
        </g>
      );
    default:
      return null;
  }
}

/** Up to two initials from a display name: the first letter of its first two words ("Nimble Webhook 481" gives "NW"). */
export function initialsOf(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .map((word) => Array.from(word)[0] ?? "")
    .filter((char) => /\p{L}/u.test(char));
  return letters.slice(0, 2).join("").toLocaleUpperCase() || "?";
}

/** The critter itself on the 64 x 64 grid: shadow, accessory, head and face. */
function Critter({
  spec,
  colors,
}: {
  spec: AvatarSpec;
  colors: (typeof PALETTE)[AvatarSpec["palette"]];
}) {
  return (
    <g>
      <ellipse cx="32" cy="58.5" rx="15" ry="2.6" fill={DARK} opacity=".12" />
      <g transform={`rotate(${spec.tilt} 32 38)`}>
        <BackAccessory kind={spec.accessory} ink={colors.ink} bg={colors.bg} />
        {/* The head's shade, a little down and right: the slight 3D look. */}
        <g transform="translate(1.2 1.8)" opacity=".18">
          <Head kind={spec.head} fill={DARK} />
        </g>
        <Head kind={spec.head} fill={colors.body} />
        <ellipse
          cx="25"
          cy="26.5"
          rx="6"
          ry="3"
          fill="#fff"
          opacity=".28"
          transform="rotate(-20 25 26.5)"
        />
        {spec.blush ? (
          <g fill="#ff8fab" opacity=".6">
            <ellipse cx="21.8" cy="40.5" rx="3" ry="1.8" />
            <ellipse cx="42.2" cy="40.5" rx="3" ry="1.8" />
          </g>
        ) : null}
        <Eyes kind={spec.eyes} glint={colors.glow} />
        <Mouth kind={spec.mouth} />
        <FrontAccessory kind={spec.accessory} ink={colors.ink} />
      </g>
    </g>
  );
}

/** A four-point sparkle centred on (x, y). */
function Sparkle({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  const k = r * 0.28;
  return (
    <path
      d={`M${x} ${y - r}L${x + k} ${y - k}L${x + r} ${y}L${x + k} ${y + k}L${x} ${y + r}L${x - k} ${y + k}L${x - r} ${y}L${x - k} ${y - k}Z`}
      fill={fill}
    />
  );
}

/**
 * The crowned avatar (docs/final-decisions.md, 2026-10-08, "Avatars: choose
 * from a gallery; the crown is for admins"): a royal critter in a gold crown
 * set with three gems, an ermine collar on a red cape, before a soft gold
 * sunburst with sparkles (no tile since 2026-10-09). Our own drawing, built to
 * look rich large on the profile and still read as a crown at 32 pixels.
 */
function Crowned({ initials }: { initials: string | null }) {
  const rays = Array.from({ length: 16 }, (_, index) => index * 22.5);
  return (
    <>
      <g fill="#eab308" opacity=".22">
        {rays.map((angle) => (
          <path key={angle} d="M32 33L30.3 4H33.7Z" transform={`rotate(${angle} 32 33)`} />
        ))}
      </g>
      <circle cx="32" cy="33" r="23" fill="#8b5cf6" opacity=".14" />
      <circle
        cx="32"
        cy="33"
        r="23"
        fill="none"
        stroke="#eab308"
        strokeOpacity=".6"
        strokeWidth=".9"
      />
      <Sparkle x={8} y={12} r={3.4} fill="#f59e0b" />
      <Sparkle x={56.5} y={20} r={2.4} fill="#f59e0b" />
      <Sparkle x={8.5} y={44} r={1.9} fill="#8b5cf6" />
      {/* Cape and ermine collar. */}
      <path d="M13 64C13.5 53 21 48.5 32 48.5S50.5 53 51 64Z" fill="#b91c1c" />
      <path
        d="M13 64C13.5 53 21 48.5 32 48.5S50.5 53 51 64"
        fill="none"
        stroke="#7f1d1d"
        strokeWidth="1"
      />
      <path d="M17.5 55.5C22 50.5 42 50.5 46.5 55.5C42 59 22 59 17.5 55.5Z" fill="#fff" />
      <g fill="#14141a">
        <path d="M24 54.2l.9 1.6-.9 1.2-.9-1.2z" />
        <path d="M32 53.6l.9 1.6-.9 1.2-.9-1.2z" />
        <path d="M40 54.2l.9 1.6-.9 1.2-.9-1.2z" />
      </g>
      {/* Head, with its shade a little down and right. */}
      <circle cx="33.2" cy="40.8" r="14.5" fill={DARK} opacity=".18" />
      <circle cx="32" cy="39" r="14.5" fill="#8b5cf6" />
      <ellipse
        cx="26"
        cy="32.5"
        rx="5"
        ry="2.5"
        fill="#fff"
        opacity=".3"
        transform="rotate(-24 26 32.5)"
      />
      <g fill="#ff8fab" opacity=".55">
        <ellipse cx="22.6" cy="42.6" rx="2.8" ry="1.6" />
        <ellipse cx="41.4" cy="42.6" rx="2.8" ry="1.6" />
      </g>
      {/* Eyes: calm and pleased, with a glint. */}
      <g fill="#14141a">
        <ellipse cx="27" cy="38.6" rx="2.3" ry="2.7" />
        <ellipse cx="37" cy="38.6" rx="2.3" ry="2.7" />
      </g>
      <g fill="#fff">
        <circle cx="27.8" cy="37.6" r=".9" />
        <circle cx="37.8" cy="37.6" r=".9" />
      </g>
      <path
        d="M23.8 35.2q3.2-1.8 6.4 0M33.8 35.2q3.2-1.8 6.4 0"
        fill="none"
        stroke="#14141a"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M28.4 44.2q3.6 3.2 7.2 0"
        fill="none"
        stroke="#14141a"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Crown: five points, a band, three gems. */}
      <path
        d="M18.5 28.5L20.5 14.5L25.5 21.5L32 10.5L38.5 21.5L43.5 14.5L45.5 28.5Z"
        fill={GOLD}
        stroke="#a16207"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M22 26.5L23 18.8M42 26.5L41 18.8"
        stroke="#fde68a"
        strokeWidth=".9"
        strokeLinecap="round"
      />
      <rect
        x="18"
        y="25.6"
        width="28"
        height="5.4"
        rx="1.8"
        fill="#eab308"
        stroke="#a16207"
        strokeWidth="1"
      />
      <circle cx="20.5" cy="14.5" r="1.7" fill="#fde68a" stroke="#a16207" strokeWidth=".7" />
      <circle cx="32" cy="10.5" r="1.9" fill="#fde68a" stroke="#a16207" strokeWidth=".7" />
      <circle cx="43.5" cy="14.5" r="1.7" fill="#fde68a" stroke="#a16207" strokeWidth=".7" />
      <circle cx="32" cy="28.3" r="1.9" fill="#ef4444" stroke="#7f1d1d" strokeWidth=".6" />
      <circle cx="25.2" cy="28.3" r="1.3" fill="#3b82f6" stroke="#1e3a8a" strokeWidth=".5" />
      <circle cx="38.8" cy="28.3" r="1.3" fill="#22c55e" stroke="#14532d" strokeWidth=".5" />
      <Sparkle x={36.5} y={17.5} r={1.6} fill="#fff" />
      {initials ? (
        <g transform="rotate(-8 49 50)">
          <rect x="37.7" y="44.6" width="25" height="14" rx="4.5" fill={DARK} opacity=".2" />
          <rect
            x="36.5"
            y="43"
            width="25"
            height="14"
            rx="4.5"
            fill={GOLD}
            stroke="#14141a"
            strokeWidth="1.3"
          />
          <text x="49" y="53.4" fontSize="9.5" textAnchor="middle" fill="#14141a" style={LETTERS}>
            {initials}
          </text>
        </g>
      ) : null}
    </>
  );
}

const LETTERS = {
  fontFamily: "var(--font-display), 'Segoe UI', system-ui, sans-serif",
  fontWeight: 800,
};

/**
 * With a `name`, the critter wears a name tag with the reader's initials
 * (product owner's choice, 2026-10-08, "Name tag"). Without one, it's the
 * critter alone.
 */
export function Avatar({ seed, size = 40, name }: { seed: string; size?: number; name?: string }) {
  const initials = name ? initialsOf(name) : null;
  if (seed === CROWN_SEED) {
    return (
      <svg
        aria-hidden="true"
        width={size}
        height={size}
        viewBox={VIEW_BOX}
        className={LIFT}
        data-avatar="crown"
      >
        <Crowned initials={initials} />
      </svg>
    );
  }
  const spec = avatarFromSeed(seed);
  const colors = PALETTE[spec.palette];
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox={VIEW_BOX}
      className={LIFT}
      data-avatar={`${spec.palette}-${spec.head}-${spec.accessory}`}
    >
      {SPARKLES[spec.pattern].map(([x, y, r]) => (
        <Sparkle key={`${x}-${y}`} x={x} y={y} r={r} fill={colors.body} />
      ))}
      <Critter spec={spec} colors={colors} />
      {initials ? (
        <g transform="rotate(-8 49 50)">
          <rect x="37.7" y="44.6" width="25" height="14" rx="4.5" fill={DARK} opacity=".2" />
          <rect
            x="36.5"
            y="43"
            width="25"
            height="14"
            rx="4.5"
            fill="#fff"
            stroke={DARK}
            strokeWidth="1.3"
          />
          <text x="49" y="53.4" fontSize="9.5" textAnchor="middle" fill={DARK} style={LETTERS}>
            {initials}
          </text>
        </g>
      ) : null}
    </svg>
  );
}

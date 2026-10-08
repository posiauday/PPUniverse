"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { CROWN_SEED, newAvatarSeed } from "../../../lib/avatar-seeds";
import { postJson } from "../../../lib/post-json";
import { Avatar } from "../../Avatar";

/** Eleven new critters, plus the reader's own first, fill a gallery of twelve. */
const GALLERY_SIZE = 11;

function randomFromCrypto(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0]! / 2 ** 32;
}

const MESSAGE = {
  saved: "Saved. Your comments now show this avatar.",
  "too-many": "You've changed your profile a few times today. Please try again tomorrow.",
  error: "Something went wrong. Please try again.",
} as const;

/**
 * Choose an avatar from a gallery (docs/final-decisions.md, 2026-10-08,
 * "Avatars: choose from a gallery; the crown is for admins"): the reader's own
 * first, then eleven new critters, and "Show other avatars" for eleven more.
 * Admins also see the crowned avatar. Each is a toggle button, so the focus
 * ring sits on the avatar itself; Save keeps the chosen one.
 */
export function AvatarPicker({
  current,
  displayName,
  isAdmin,
  initialSeeds,
}: {
  current: string;
  displayName: string;
  isAdmin: boolean;
  /** The first gallery, made on the server so the page renders the same on both sides. */
  initialSeeds: readonly string[];
}) {
  const router = useRouter();
  const [seeds, setSeeds] = useState<readonly string[]>(initialSeeds);
  const [chosen, setChosen] = useState(current);
  const [state, setState] = useState<"idle" | "busy" | keyof typeof MESSAGE>("idle");
  const headingId = useId();
  const statusId = useId();

  const options = [
    ...(isAdmin && current !== CROWN_SEED ? [CROWN_SEED] : []),
    current,
    ...seeds.filter((seed) => seed !== current),
  ];

  async function save() {
    if (state === "busy" || chosen === current) return;
    setState("busy");
    const answer = await postJson("/api/account/profile", { avatar: chosen });
    if (answer.status === 200) {
      setState("saved");
      router.refresh();
      return;
    }
    setState(answer.error === "too-many" ? "too-many" : "error");
  }

  return (
    <section aria-labelledby={headingId} className="mt-8">
      <h2 id={headingId} className="font-display text-2xl font-bold">
        Choose your avatar
      </h2>
      <p className="mt-1 text-muted-foreground">
        Pick one, then save. Your initials go on its name tag.
      </p>
      <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {options.map((seed, index) => {
          const pressed = seed === chosen;
          const label =
            seed === CROWN_SEED
              ? "The crown, for admins"
              : seed === current
                ? "Your avatar now"
                : `Avatar ${index + 1}`;
          return (
            <li key={seed}>
              <button
                type="button"
                aria-pressed={pressed}
                onClick={() => {
                  setChosen(seed);
                  if (state !== "busy") setState("idle");
                }}
                className={`grid w-full place-items-center gap-1 rounded-2xl border-2 bg-card p-2 motion-safe:transition-[border-color,transform] motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 ${
                  pressed ? "border-foreground" : "border-transparent hover:border-border"
                }`}
              >
                <Avatar seed={seed} name={displayName} size={72} />
                <span className="text-xs leading-tight text-muted-foreground">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          aria-disabled={state === "busy" || chosen === current}
          aria-describedby={statusId}
          className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground aria-disabled:opacity-60"
        >
          Save avatar
        </button>
        <button
          type="button"
          onClick={() => {
            setSeeds(Array.from({ length: GALLERY_SIZE }, () => newAvatarSeed(randomFromCrypto)));
            // A pick from the gallery being replaced goes back to the current avatar.
            if (seeds.includes(chosen)) setChosen(current);
          }}
          className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-foreground bg-card px-5 font-semibold"
        >
          Show other avatars
        </button>
      </div>
      <p id={statusId} role="status" className="mt-2 font-medium empty:hidden">
        {state === "saved" || state === "too-many" || state === "error" ? MESSAGE[state] : ""}
      </p>
    </section>
  );
}

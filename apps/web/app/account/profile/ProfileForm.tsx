"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { postJson } from "../../../lib/post-json";

type State =
  | "idle"
  | "busy"
  | "saved"
  | "avatar"
  | "too-short"
  | "too-long"
  | "characters"
  | "reserved"
  | "taken"
  | "too-many"
  | "error";

const MESSAGE: Partial<Record<State, string>> = {
  saved: "Saved. Your comments now show this name.",
  avatar: "Here's your new avatar.",
  "too-short": "Please use at least 3 characters.",
  "too-long": "Please use at most 30 characters.",
  characters: "Use letters, numbers, spaces and . _ - only, with at least one letter.",
  reserved: "That name could look official. Please choose another.",
  taken: "Someone already has that name. Please choose another.",
  "too-many": "You've changed your profile a few times today. Please try again tomorrow.",
  error: "Something went wrong. Please try again.",
};

/** Change the display name, or draw a new avatar (MVP-040). */
export function ProfileForm({ displayName }: { displayName: string }) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [state, setState] = useState<State>("idle");
  const fieldId = useId();
  const hintId = useId();
  const statusId = useId();

  async function send(body: Record<string, string>, success: State) {
    if (state === "busy") return;
    setState("busy");
    const answer = await postJson("/api/account/profile", body);
    if (answer.status === 200) {
      setState(success);
      router.refresh();
      return;
    }
    const known: State[] = ["too-short", "too-long", "characters", "reserved", "taken", "too-many"];
    setState(known.find((code) => code === answer.error) ?? "error");
  }

  const invalid = ["too-short", "too-long", "characters", "reserved", "taken"].includes(state);
  return (
    <div className="mt-6 flex flex-col gap-5">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void send({ displayName: name }, "saved");
        }}
        className="flex flex-col gap-2.5"
      >
        <label htmlFor={fieldId} className="font-semibold">
          Display name
        </label>
        <p id={hintId} className="text-sm text-muted-foreground">
          3 to 30 characters: letters, numbers, spaces and . _ -. Shown publicly with your comments.
        </p>
        <input
          id={fieldId}
          value={name}
          maxLength={30}
          onChange={(event) => setName(event.target.value)}
          aria-describedby={`${hintId} ${statusId}`}
          aria-invalid={invalid}
          autoComplete="nickname"
          className="h-11 w-full max-w-[22rem] rounded-2xl border-[1.5px] border-muted-foreground bg-card px-3 text-base text-foreground"
        />
        <div>
          <button
            type="submit"
            aria-disabled={state === "busy"}
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground"
          >
            Save name
          </button>
        </div>
      </form>
      <div>
        <button
          type="button"
          onClick={() => void send({ avatar: "new" }, "avatar")}
          aria-disabled={state === "busy"}
          className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-foreground bg-card px-5 font-semibold"
        >
          Draw a new avatar
        </button>
      </div>
      <p id={statusId} role="status" className="font-medium empty:hidden">
        {MESSAGE[state] ?? ""}
      </p>
    </div>
  );
}

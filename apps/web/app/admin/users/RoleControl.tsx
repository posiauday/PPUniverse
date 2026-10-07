"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { ROLES, ROLE_LABEL, type Role } from "../../../lib/role-labels";

const PROBLEM: Record<string, string> = {
  "last-admin": "The last admin can't be made something else.",
  self: "You can't change your own role.",
  same: "That's already their role.",
};

/** Choose a role and save it (MVP-047). The page refreshes after a change. */
export function RoleControl({ userId, role, who }: { userId: string; role: Role; who: string }) {
  const router = useRouter();
  const [choice, setChoice] = useState<Role>(role);
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [message, setMessage] = useState("");
  const selectId = useId();

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "busy" || choice === role) return;
    if (
      choice === "ADMIN" &&
      !window.confirm(`Make ${who} an admin? They'll be able to do everything you can.`)
    ) {
      return;
    }
    setState("busy");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: choice }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? String(response.status));
      setState("idle");
      setMessage("Saved.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(PROBLEM[(error as Error).message] ?? "That didn't work. Please try again.");
    }
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-center gap-2">
      <label htmlFor={selectId} className="sr-only">
        Role for {who}
      </label>
      <select
        id={selectId}
        value={choice}
        onChange={(event) => setChoice(event.target.value as Role)}
        className="h-11 rounded-xl border-[1.5px] border-muted-foreground bg-card px-2"
      >
        {ROLES.map((value) => (
          <option key={value} value={value}>
            {ROLE_LABEL[value]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        aria-disabled={state === "busy" || choice === role}
        className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-foreground px-4 font-semibold"
      >
        Save<span className="sr-only"> role for {who}</span>
      </button>
      <p role="status" className="text-sm empty:hidden">
        {message}
      </p>
    </form>
  );
}

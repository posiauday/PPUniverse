"use client";

import { createContext, useContext, type ReactNode } from "react";
import { SEGOE } from "./replica";

/** Power Fx NotificationType; Information is Notify's default. */
export type NotificationType = "Information" | "Success" | "Warning" | "Error";
export type Notify = (message: string, type?: NotificationType) => void;

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

/** Notify's default timeout (Power Fx reference: 10 seconds). */
export const NOTIFY_TIMEOUT_MS = 10_000;

const NotifyContext = createContext<Notify>(() => {});
export const NotifyProvider = NotifyContext.Provider;

/** Notify() for a replica: the banner across the top of the preview screen. */
export function useNotify(): Notify {
  return useContext(NotifyContext);
}

/** Blue, green, orange and red, as Power Apps colours them; white text is above 4.5:1 on each. */
const BANNER: Record<NotificationType, { fill: string; icon: ReactNode }> = {
  Information: {
    fill: "bg-[#0f6cbd]",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7.5v.5" />
      </>
    ),
  },
  Success: {
    fill: "bg-[#107c10]",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12l3 3 5-6" />
      </>
    ),
  },
  Warning: {
    fill: "bg-[#b54d00]",
    icon: (
      <>
        <path d="M12 3l10 18H2z" />
        <path d="M12 10v5M12 18v.5" />
      </>
    ),
  },
  Error: {
    fill: "bg-[#c50f1f]",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9l6 6M15 9l-6 6" />
      </>
    ),
  },
};

/**
 * The banner Notify shows across the top of the screen, over everything else,
 * until it times out or is closed. A newer message replaces it. The live
 * region is always there, so screen readers announce each message.
 */
export function NotificationBanner({
  notification,
  onClose,
}: {
  notification: Notification | null;
  onClose: () => void;
}) {
  const look = notification ? BANNER[notification.type] : null;
  return (
    <div role="status" className="absolute inset-x-0 top-0 z-30">
      {notification && look ? (
        <div
          key={notification.id}
          className={`flex min-h-11 items-center gap-2.5 pr-1 pl-3 text-sm font-semibold text-white shadow-md [--color-ring:#ffffff] motion-safe:animate-[lcs-banner_280ms_var(--ease-out-soft)] ${SEGOE} ${look.fill}`}
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {look.icon}
          </svg>
          <span className="min-w-0 flex-1 py-2 break-words">{notification.message}</span>
          <button
            type="button"
            aria-label="Close notification"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded hover:bg-white/15"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}

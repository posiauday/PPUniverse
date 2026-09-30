import type { EmailAdapter, EmailMessage } from "./email-adapter.js";

export interface ResendEmailAdapterConfig {
  apiKey: string;
  from: string;
}

/**
 * The real vendor adapter (MVP-018, FR-013; docs/final-decisions.md names
 * Resend as the decided vendor). Provider access is entirely contained
 * here — a single JSON POST to Resend's plain REST API via `fetch`, no SDK
 * dependency, matching the constructor-config shape
 * SentryErrorMonitoringAdapter already established
 * (packages/adapters/error-monitoring). No feature code calls Resend
 * directly; every caller goes through the EmailAdapter interface.
 *
 * Only ever constructed when RESEND_API_KEY is set (apps/web/lib/auth.ts,
 * packages/adapters/notifications) — without a verified sending domain
 * (open question 1, unresolved) this would fail at the vendor, not before;
 * nothing in this codebase selects it unconditionally.
 */
export class ResendEmailAdapter implements EmailAdapter {
  constructor(private readonly config: ResendEmailAdapterConfig) {}

  async send(message: EmailMessage): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.config.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
      }),
    });

    if (!response.ok) {
      // Never include the response body: it may echo back the recipient
      // address or message content (data minimisation — no address or
      // body in logs, docs/final-decisions.md "MVP-018 open question 49").
      throw new Error(`Resend send failed with status ${response.status}`);
    }
  }
}

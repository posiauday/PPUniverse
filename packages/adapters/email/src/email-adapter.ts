/**
 * Minimal transactional-email boundary (ADR 003). Scoped to exactly what
 * MVP-002 needs (send one message); templates, provider integration, and
 * preference-aware suppression are MVP-018's scope (docs/13 §1) — this
 * interface is the seam MVP-018 implements a real vendor adapter against.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailAdapter {
  send(message: EmailMessage): Promise<void>;
}

/**
 * Dev/test default: logs instead of sending. Never used in production — a
 * real vendor-backed EmailAdapter is required before launch (MVP-018,
 * docs/open-questions.md item 19).
 */
export class ConsoleEmailAdapter implements EmailAdapter {
  async send(message: EmailMessage): Promise<void> {
    console.log(`[email:dev] to=${message.to} subject=${JSON.stringify(message.subject)}`);
    console.log(`[email:dev] body=${message.text}`);
    await Promise.resolve();
  }
}

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
 * Dev/test transport: logs instead of sending, including the body, so a
 * developer can follow a sign-in link locally. The body of a sign-in email
 * IS a credential, so this must never run where logs are shared: it is only
 * selected outside production, or when a test harness opts in explicitly
 * (see selectEmailAdapter and BUG-019).
 */
export class ConsoleEmailAdapter implements EmailAdapter {
  async send(message: EmailMessage): Promise<void> {
    console.log(`[email:dev] to=${message.to} subject=${JSON.stringify(message.subject)}`);
    console.log(`[email:dev] body=${message.text}`);
    await Promise.resolve();
  }
}

/**
 * Production with no email provider configured (BUG-019): every send fails,
 * so the caller records a failed send and the person is told the email could
 * not be sent. Nothing about the message is logged -- not the recipient, not
 * the subject, and above all not the body, which for a sign-in email is a
 * working credential.
 */
export class UnconfiguredEmailAdapter implements EmailAdapter {
  async send(_message: EmailMessage): Promise<void> {
    await Promise.resolve();
    throw new Error("Email is not configured: set RESEND_API_KEY to send email.");
  }
}

/**
 * Chooses the transport (BUG-019):
 * - a provider key: the real provider;
 * - otherwise, outside production, or when `logTransport` is explicitly
 *   requested (the accessibility gate's production-build server sets
 *   EMAIL_TRANSPORT=log): the console transport;
 * - otherwise (production, no key): fail closed, logging nothing.
 */
export function selectEmailAdapter(options: {
  provider: EmailAdapter | null;
  production: boolean;
  logTransport: boolean;
}): EmailAdapter {
  if (options.provider) return options.provider;
  if (!options.production || options.logTransport) return new ConsoleEmailAdapter();
  return new UnconfiguredEmailAdapter();
}

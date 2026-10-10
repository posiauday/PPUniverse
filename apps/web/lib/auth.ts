import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@ppu/db";
import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { EMAIL_FROM, notificationService } from "./email";
import { EMAILS, renderEmail } from "./email-templates";
import {
  googleCredentials,
  googleEmailVerified,
  googleProvider,
  withoutStoredTokens,
} from "./google-auth";
import { confirmLinkFrom } from "./signin-confirm";

// Migrated onto the real vendor abstraction (MVP-018, FR-013;
// docs/final-decisions.md, "MVP-018 open question 49") — see ./email for the
// Resend-or-console selection, shared with every other send site so there
// is never a second parallel sending path.

// MVP-035: on only when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.
const google = googleCredentials();

export const authOptions: NextAuthOptions = {
  // Linking a Google account stores who it is, never Google's tokens.
  adapter: withoutStoredTokens(PrismaAdapter(prisma)),
  session: { strategy: "database" },
  // A brand-new account from an emailed link or Google lands on the welcome
  // page first, to accept the Terms of use and the Privacy notice
  // (docs/final-decisions.md, 2026-10-08, "Accounts accept the Terms when
  // they're made"). Auth.js adds the page they were going to as callbackUrl.
  pages: { signIn: "/signin", newUser: "/account/welcome" },
  callbacks: {
    // Google only with a verified email (site review, 2026-10-10; lib/google-auth.ts).
    signIn: ({ account, profile }) => googleEmailVerified(account, profile),
    session: ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  providers: [
    EmailProvider({
      // Unused: sendVerificationRequest below fully overrides delivery, but
      // next-auth's EmailConfig type still expects a server value.
      server: { host: "localhost", port: 1025, auth: { user: "", pass: "" } },
      from: EMAIL_FROM,
      sendVerificationRequest: async ({ identifier, url: callbackUrl }) => {
        // MVP-034: the email links to a confirmation page with a button, not
        // straight to Auth.js's callback, so a link scanner can't use the
        // one-time token up (lib/signin-confirm.ts).
        const url = confirmLinkFrom(callbackUrl);
        // A brand-new sign-up may have no User row yet at this point in the
        // flow (the database-strategy adapter creates one on verification,
        // not on request) — looked up, not assumed; left null rather than
        // ever storing the raw address (data minimisation).
        const existingUser = await prisma.user.findUnique({ where: { email: identifier } });
        // sendTransactional re-throws on failure — preserved deliberately,
        // so next-auth's own existing error-page behaviour (and the
        // accessibility gate's signin-send-failed state) are unchanged.
        await notificationService.sendTransactional("SIGNIN_LINK", existingUser?.id ?? null, {
          to: identifier,
          // MVP-044: the branded layout; the logo comes from the link's own origin.
          ...renderEmail(EMAILS.signInLink(url), new URL(url).origin),
        });
      },
    }),
    ...(google ? [googleProvider(google)] : []),
  ],
};

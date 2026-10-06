import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@ppu/db";
import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { EMAIL_FROM, notificationService } from "./email";
import { googleCredentials, googleProvider, withoutStoredTokens } from "./google-auth";
import { SITE_NAME } from "./seo/site";
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
  pages: { signIn: "/signin" },
  callbacks: {
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
          subject: `Sign in to ${SITE_NAME}`,
          text: `Open this link, then press "Sign me in" (the link expires in 24 hours and works once): ${url}`,
          html: `<p>Open this link, then press <strong>Sign me in</strong> (the link expires in 24 hours and works once): <a href="${url.replace(/&/g, "&amp;")}">${url.replace(/&/g, "&amp;")}</a></p>`,
        });
      },
    }),
    ...(google ? [googleProvider(google)] : []),
  ],
};

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@ppu/db";
import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { EMAIL_FROM, notificationService } from "./email";

// Migrated onto the real vendor abstraction (MVP-018, FR-013;
// docs/final-decisions.md, "MVP-018 open question 49") — see ./email for the
// Resend-or-console selection, shared with every other send site so there
// is never a second parallel sending path.

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
      sendVerificationRequest: async ({ identifier, url }) => {
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
          subject: "Sign in to Power Platform Universe",
          text: `Sign in by opening this link (expires shortly): ${url}`,
          html: `<p>Sign in by opening this link (expires shortly): <a href="${url}">${url}</a></p>`,
        });
      },
    }),
  ],
};

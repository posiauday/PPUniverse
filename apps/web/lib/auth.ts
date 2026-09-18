import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@ppu/db";
import { ConsoleEmailAdapter } from "@ppu/adapter-email";
import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";

/**
 * Dev/test default (ADR 004 amendment): logs the verification link instead
 * of sending it. Replaced by a real vendor EmailAdapter in MVP-018.
 */
const emailAdapter = new ConsoleEmailAdapter();

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
      from: process.env["EMAIL_FROM"] ?? "no-reply@example.com",
      sendVerificationRequest: async ({ identifier, url }) => {
        await emailAdapter.send({
          to: identifier,
          subject: "Sign in to Power Platform Universe",
          text: `Sign in by opening this link (expires shortly): ${url}`,
          html: `<p>Sign in by opening this link (expires shortly): <a href="${url}">${url}</a></p>`,
        });
      },
    }),
  ],
};

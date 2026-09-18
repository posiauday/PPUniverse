import { cookies } from "next/headers";
import { prisma } from "@ppu/db";

const SESSION_COOKIE_NAMES = ["__Secure-next-auth.session-token", "next-auth.session-token"];

/**
 * Resolves the DB Session row id behind the request's session cookie.
 * getServerSession() confirms *whether* the caller is authenticated but
 * doesn't expose the underlying session id, and we need it to implement
 * "revoke sessions other than the current one" (see
 * packages/domain/identity's session-authorization rule).
 */
export async function getCurrentSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  for (const name of SESSION_COOKIE_NAMES) {
    const token = cookieStore.get(name)?.value;
    if (token) {
      const session = await prisma.session.findUnique({ where: { sessionToken: token } });
      if (session) {
        return session.id;
      }
    }
  }
  return null;
}

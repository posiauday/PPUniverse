import type { PasswordAuthStore, PasswordTokenPurpose, StoredToken } from "./password-auth.js";
import type { ThrottleState } from "./sign-in-throttle.js";

interface MemoryToken extends StoredToken {
  tokenHash: string;
  purpose: PasswordTokenPurpose;
  expiresAt: Date;
  usedAt: Date | null;
}

/** Test double — no infrastructure dependency. Not for production use. */
export class InMemoryPasswordAuthStore implements PasswordAuthStore {
  users: { id: string; email: string; emailVerified: Date | null }[] = [];
  credentials = new Map<string, string>();
  tokens: MemoryToken[] = [];
  sessions: { userId: string; sessionToken: string; expires: Date }[] = [];
  throttles = new Map<string, ThrottleState>();
  private nextId = 1;

  async findUserByEmail(email: string) {
    return Promise.resolve(this.users.find((u) => u.email === email) ?? null);
  }

  async createOrVerifyUser(email: string, now: Date) {
    let user = this.users.find((u) => u.email === email);
    if (!user) {
      user = { id: `user-${this.nextId++}`, email, emailVerified: now };
      this.users.push(user);
    } else {
      user.emailVerified ??= now;
    }
    return Promise.resolve({ id: user.id });
  }

  async getCredential(userId: string) {
    return Promise.resolve(this.credentials.get(userId) ?? null);
  }

  async setCredential(userId: string, hash: string) {
    this.credentials.set(userId, hash);
    return Promise.resolve();
  }

  async createToken(token: Omit<MemoryToken, "usedAt">) {
    this.tokens.push({ ...token, usedAt: null });
    return Promise.resolve();
  }

  private find(tokenHash: string, purpose: PasswordTokenPurpose, now: Date) {
    return this.tokens.find(
      (t) => t.tokenHash === tokenHash && t.purpose === purpose && !t.usedAt && t.expiresAt > now,
    );
  }

  async peekToken(tokenHash: string, purpose: PasswordTokenPurpose, now: Date) {
    const token = this.find(tokenHash, purpose, now);
    return Promise.resolve(token ? { email: token.email, pendingHash: token.pendingHash } : null);
  }

  async consumeToken(tokenHash: string, purpose: PasswordTokenPurpose, now: Date) {
    const token = this.find(tokenHash, purpose, now);
    if (!token) return Promise.resolve(null);
    token.usedAt = now;
    return Promise.resolve({ email: token.email, pendingHash: token.pendingHash });
  }

  async createSession(userId: string, sessionToken: string, expires: Date) {
    this.sessions.push({ userId, sessionToken, expires });
    return Promise.resolve();
  }

  async deleteSessions(userId: string) {
    this.sessions = this.sessions.filter((s) => s.userId !== userId);
    return Promise.resolve();
  }

  async getThrottle(key: string) {
    return Promise.resolve(this.throttles.get(key) ?? null);
  }

  async saveThrottle(key: string, state: ThrottleState) {
    this.throttles.set(key, state);
    return Promise.resolve();
  }

  async clearThrottle(key: string) {
    this.throttles.delete(key);
    return Promise.resolve();
  }
}

import type { SessionSummary } from "./types.js";

export interface SessionRepository {
  listByUser(userId: string): Promise<SessionSummary[]>;
  findById(id: string): Promise<SessionSummary | null>;
  deleteById(id: string): Promise<void>;
}

/** Test double — no infrastructure dependency. Not for production use. */
export class InMemorySessionRepository implements SessionRepository {
  constructor(private sessions: SessionSummary[] = []) {}

  async listByUser(userId: string): Promise<SessionSummary[]> {
    return Promise.resolve(this.sessions.filter((s) => s.userId === userId));
  }

  async findById(id: string): Promise<SessionSummary | null> {
    return Promise.resolve(this.sessions.find((s) => s.id === id) ?? null);
  }

  async deleteById(id: string): Promise<void> {
    this.sessions = this.sessions.filter((s) => s.id !== id);
    return Promise.resolve();
  }
}

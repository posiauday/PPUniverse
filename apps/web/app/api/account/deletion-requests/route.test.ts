import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const getLatestDeletionRequestForUser = vi.fn();
const createDeletionRequest = vi.fn();
const findUnique = vi.fn();
const sendTransactional = vi.fn();

vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSession(...args),
}));
vi.mock("@ppu/adapter-privacy", () => ({
  PrismaPrivacyRepository: class {
    getLatestDeletionRequestForUser(...args: unknown[]) {
      return getLatestDeletionRequestForUser(...args);
    }
    createDeletionRequest(...args: unknown[]) {
      return createDeletionRequest(...args);
    }
  },
}));
vi.mock("@ppu/db", () => ({
  prisma: { user: { findUnique: (...args: unknown[]) => findUnique(...args) } },
}));
vi.mock("../../../../lib/email", () => ({
  notificationService: { sendTransactional: (...args: unknown[]) => sendTransactional(...args) },
  EMAIL_FROM: "no-reply@example.test",
}));

const { POST } = await import("./route");

function makeRequest() {
  return new Request("http://localhost/api/account/deletion-requests", { method: "POST" });
}

/**
 * The email side effect added by MVP-018 (docs/final-decisions.md, "MVP-018
 * open question 49", constraint 3): "a send failure MUST NOT fail the
 * request, roll it back, or change its state." Tested directly, since this
 * is the one place this story modifies completed MVP-020 code and the
 * property is easy to get subtly wrong (a forgotten try/catch would make
 * the whole request fail whenever the email provider is down).
 */
describe("POST /api/account/deletion-requests", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    getLatestDeletionRequestForUser.mockReset();
    createDeletionRequest.mockReset();
    findUnique.mockReset();
    sendTransactional.mockReset();

    getServerSession.mockResolvedValue({ user: { id: "user-1", email: "user@example.test" } });
    getLatestDeletionRequestForUser.mockResolvedValue(null);
    createDeletionRequest.mockResolvedValue({
      id: "req-1",
      userId: "user-1",
      createdAt: new Date(),
      events: [{ id: "evt-1", toState: "SUBMITTED" }],
    });
    findUnique.mockResolvedValue({ email: "user@example.test" });
  });

  it("returns 401 without a session", async () => {
    getServerSession.mockResolvedValue(null);
    const response = await POST(makeRequest());
    expect(response.status).toBe(401);
    expect(createDeletionRequest).not.toHaveBeenCalled();
  });

  it("still returns 201 and the created request when the email send fails", async () => {
    sendTransactional.mockRejectedValue(new Error("provider down"));

    const response = await POST(makeRequest());

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({ id: "req-1", state: "SUBMITTED" });
    expect(sendTransactional).toHaveBeenCalledTimes(1);
    expect(sendTransactional).toHaveBeenCalledWith(
      "DELETION_REQUEST_SUBMITTED",
      "user-1",
      expect.objectContaining({ to: "user@example.test" }),
    );
  });

  it("returns 201 when the email send succeeds", async () => {
    sendTransactional.mockResolvedValue({ status: "SENT" });

    const response = await POST(makeRequest());

    expect(response.status).toBe(201);
    expect(sendTransactional).toHaveBeenCalledTimes(1);
  });

  it("does not attempt to send when no recipient user row is found", async () => {
    findUnique.mockResolvedValue(null);

    const response = await POST(makeRequest());

    expect(response.status).toBe(201);
    expect(sendTransactional).not.toHaveBeenCalled();
  });

  it("returns 409 without ever attempting a send when a request is already active", async () => {
    getLatestDeletionRequestForUser.mockResolvedValue({
      id: "existing",
      userId: "user-1",
      createdAt: new Date(),
      events: [{ id: "evt-0", toState: "SUBMITTED" }],
    });

    const response = await POST(makeRequest());

    expect(response.status).toBe(409);
    expect(createDeletionRequest).not.toHaveBeenCalled();
    expect(sendTransactional).not.toHaveBeenCalled();
  });
});

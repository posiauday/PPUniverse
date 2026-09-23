import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyUnsubscribeLinkToken = vi.fn();
const recordConsent = vi.fn();

vi.mock("../../../lib/unsubscribe", () => ({
  verifyUnsubscribeLinkToken: (...args: unknown[]) => verifyUnsubscribeLinkToken(...args),
}));
vi.mock("@ppu/adapter-privacy", () => ({
  PrismaPrivacyRepository: class {
    recordConsent(...args: unknown[]) {
      return recordConsent(...args);
    }
  },
}));
vi.mock("@ppu/db", () => ({ prisma: {} }));

const { POST } = await import("./route");

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Deliberately not session-gated (MVP-018, question 5 of the pre-work
 * analysis): authorization is possession of a valid token. Tested directly
 * at the HTTP layer, matching the same rigor applied to MVP-020's admin
 * route — this is the one new unauthenticated write surface this story adds.
 */
describe("POST /api/unsubscribe", () => {
  beforeEach(() => {
    verifyUnsubscribeLinkToken.mockReset();
    recordConsent.mockReset();
  });

  it("returns 400 with a generic message for an invalid token, and never writes", async () => {
    verifyUnsubscribeLinkToken.mockReturnValue(null);

    const response = await POST(makeRequest({ token: "garbage" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("INVALID_TOKEN");
    expect(body.message).toBe("This link is no longer valid.");
    expect(recordConsent).not.toHaveBeenCalled();
  });

  it("returns 400 when no token is provided", async () => {
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
    expect(verifyUnsubscribeLinkToken).not.toHaveBeenCalled();
  });

  it("records a withdrawal for a valid token and returns 204", async () => {
    verifyUnsubscribeLinkToken.mockReturnValue({ userId: "user-1", category: "MARKETING_EMAIL" });
    recordConsent.mockResolvedValue({});

    const response = await POST(makeRequest({ token: "a-valid-token" }));

    expect(response.status).toBe(204);
    expect(recordConsent).toHaveBeenCalledWith({
      userId: "user-1",
      category: "MARKETING_EMAIL",
      granted: false,
      policyVersionId: null,
    });
  });
});

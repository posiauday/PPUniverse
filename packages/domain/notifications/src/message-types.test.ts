import { describe, expect, it } from "vitest";
import { isTransactionalMessageType } from "./message-types.js";

describe("isTransactionalMessageType", () => {
  it("SIGNIN_LINK is transactional", () => {
    expect(isTransactionalMessageType("SIGNIN_LINK")).toBe(true);
  });

  it("DELETION_REQUEST_SUBMITTED is transactional", () => {
    expect(isTransactionalMessageType("DELETION_REQUEST_SUBMITTED")).toBe(true);
  });
});

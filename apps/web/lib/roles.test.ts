import { describe, expect, it } from "vitest";
import { checkRoleChange } from "./roles";
import { isRole } from "./role-labels";

describe("checkRoleChange (MVP-047)", () => {
  const base = { actorId: "admin-1", targetId: "user-2", adminCount: 2 } as const;

  it("lets an admin change someone else's role", () => {
    expect(checkRoleChange({ ...base, from: "MEMBER", to: "CONTRIBUTOR" })).toBeNull();
    expect(checkRoleChange({ ...base, from: "ADMIN", to: "MEMBER" })).toBeNull();
  });

  it("refuses an admin's own role, a no-op, and demoting the last admin", () => {
    expect(checkRoleChange({ ...base, targetId: "admin-1", from: "ADMIN", to: "MEMBER" })).toBe(
      "self",
    );
    expect(checkRoleChange({ ...base, from: "MEMBER", to: "MEMBER" })).toBe("same");
    expect(checkRoleChange({ ...base, adminCount: 1, from: "ADMIN", to: "CONTRIBUTOR" })).toBe(
      "last-admin",
    );
  });

  it("knows the three roles and nothing else", () => {
    expect(["MEMBER", "CONTRIBUTOR", "ADMIN"].every(isRole)).toBe(true);
    expect(isRole("OWNER")).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });
});

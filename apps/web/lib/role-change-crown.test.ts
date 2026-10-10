import { beforeEach, describe, expect, it, vi } from "vitest";

/** changeRole's database writes, with the transaction faked (site review, 2026-10-10). */
const tx = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  roleChangeEvent: { create: vi.fn() },
}));
vi.mock("@ppu/db", () => ({
  prisma: { $transaction: (run: (client: typeof tx) => unknown) => run(tx) },
}));

const { changeRole } = await import("./roles");

beforeEach(() => {
  vi.clearAllMocks();
  tx.user.count.mockResolvedValue(2);
});

describe("changeRole and the admins-only crown", () => {
  it("swaps a demoted admin's crown for a critter, only if they wore it", async () => {
    tx.user.findUnique.mockResolvedValue({ role: "ADMIN" });
    expect(await changeRole("admin-1", "admin-2", "MEMBER")).toEqual({ ok: true, from: "ADMIN" });
    expect(tx.user.updateMany).toHaveBeenCalledOnce();
    const call = tx.user.updateMany.mock.calls[0]![0];
    expect(call.where).toEqual({ id: "admin-2", avatarSeed: "crown" });
    expect(call.data.avatarSeed).toMatch(/^[a-z0-9]{10}$/);
  });

  it("leaves the avatar alone for any other change", async () => {
    tx.user.findUnique.mockResolvedValue({ role: "MEMBER" });
    expect(await changeRole("admin-1", "user-2", "ADMIN")).toEqual({ ok: true, from: "MEMBER" });
    expect(tx.user.updateMany).not.toHaveBeenCalled();
  });
});

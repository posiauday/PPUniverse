import { beforeEach, describe, expect, it, vi } from "vitest";
import { PricedProductNotFoundError } from "@ppu/domain-commerce";

const getServerSession = vi.fn();
const findUnique = vi.fn();
const setProductPrice = vi.fn();
const clearProductPrice = vi.fn();

vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSession(...args),
}));
vi.mock("@ppu/db", () => ({
  prisma: { user: { findUnique: (...args: unknown[]) => findUnique(...args) } },
}));
vi.mock("../../../../../../lib/commerce", () => ({
  commerceRepository: {
    setProductPrice: (...args: unknown[]) => setProductPrice(...args),
    clearProductPrice: (...args: unknown[]) => clearProductPrice(...args),
  },
}));

const { PUT, DELETE } = await import("./route");
const params = Promise.resolve({ id: "product-1" });
const put = (body: unknown) =>
  PUT(
    new Request("http://localhost/api/admin/products/product-1/price", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
    { params },
  );
const del = () =>
  DELETE(new Request("http://localhost/api/admin/products/product-1/price", { method: "DELETE" }), {
    params,
  });

describe("/api/admin/products/[id]/price", () => {
  beforeEach(() => {
    for (const m of [getServerSession, findUnique, setProductPrice, clearProductPrice])
      m.mockReset();
    getServerSession.mockResolvedValue({ user: { id: "admin-1" } });
    findUnique.mockResolvedValue({ role: "ADMIN" });
  });

  it("denies no session and a MEMBER with the identical 404, for both methods", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await put({ price: "49" })).status).toBe(404);
    expect((await del()).status).toBe(404);
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findUnique.mockResolvedValue({ role: "MEMBER" });
    expect((await put({ price: "49" })).status).toBe(404);
    expect((await del()).status).toBe(404);
    expect(setProductPrice).not.toHaveBeenCalled();
    expect(clearProductPrice).not.toHaveBeenCalled();
  });

  it("parses the typed amount on the server and stores it in USD cents", async () => {
    setProductPrice.mockResolvedValue({
      productId: "product-1",
      amountCents: 1999,
      currency: "USD",
    });
    const response = await put({ price: "$19.99" });
    expect(response.status).toBe(200);
    expect(setProductPrice).toHaveBeenCalledWith("product-1", 1999, "USD");
  });

  it("rejects zero, garbage, a number instead of a string, and a missing price", async () => {
    for (const body of [{ price: "0" }, { price: "abc" }, { price: 49 }, {}]) {
      const response = await put(body);
      expect(response.status).toBe(400);
      expect((await response.json()).fieldErrors).toHaveProperty("price");
    }
    expect(setProductPrice).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown product", async () => {
    setProductPrice.mockRejectedValue(new PricedProductNotFoundError("product-1"));
    expect((await put({ price: "49" })).status).toBe(404);
  });

  it("DELETE makes the product free", async () => {
    const response = await del();
    expect(response.status).toBe(204);
    expect(clearProductPrice).toHaveBeenCalledWith("product-1");
  });
});

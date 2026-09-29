import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.fn();
const findPublishedProductBySlug = vi.fn();
const findProductPrice = vi.fn();
const findEntitlement = vi.fn();
const grantOrReuseEntitlement = vi.fn();
const recordDownload = vi.fn();

vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => getServerSession(...args),
}));
vi.mock("@ppu/db", () => ({ prisma: {} }));
vi.mock("@ppu/adapter-catalog", () => ({
  PrismaCatalogRepository: class {
    findPublishedProductBySlug = (...args: unknown[]) => findPublishedProductBySlug(...args);
  },
}));
vi.mock("@ppu/adapter-entitlements", () => ({
  PrismaEntitlementRepository: class {
    findEntitlement = (...args: unknown[]) => findEntitlement(...args);
    grantOrReuseEntitlement = (...args: unknown[]) => grantOrReuseEntitlement(...args);
    recordDownload = (...args: unknown[]) => recordDownload(...args);
  },
}));
vi.mock("../../../../../lib/commerce", () => ({
  commerceRepository: { findProductPrice: (...args: unknown[]) => findProductPrice(...args) },
}));

const { POST } = await import("./route");

const params = Promise.resolve({ slug: "some-product" });
const request = () =>
  new Request("http://localhost/api/products/some-product/entitlement", { method: "POST" });
const product = { id: "product-1", slug: "some-product", status: "PUBLISHED" };
const entitlement = {
  id: "ent-1",
  userId: "user-1",
  productId: "product-1",
  source: "FREE_POLICY",
  revokedAt: null,
};

describe("POST /api/products/[slug]/entitlement", () => {
  beforeEach(() => {
    for (const mock of [
      getServerSession,
      findPublishedProductBySlug,
      findProductPrice,
      findEntitlement,
      grantOrReuseEntitlement,
      recordDownload,
    ]) {
      mock.mockReset();
    }
    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    findPublishedProductBySlug.mockResolvedValue(product);
    grantOrReuseEntitlement.mockResolvedValue({ entitlement, reused: false });
  });

  it("requires sign-in", async () => {
    getServerSession.mockResolvedValue(null);
    const response = await POST(request(), { params });
    expect(response.status).toBe(401);
    expect(grantOrReuseEntitlement).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown or unpublished product", async () => {
    findPublishedProductBySlug.mockResolvedValue(null);
    const response = await POST(request(), { params });
    expect(response.status).toBe(404);
    expect(grantOrReuseEntitlement).not.toHaveBeenCalled();
  });

  it("grants a free product and records the download", async () => {
    findProductPrice.mockResolvedValue(null);
    const response = await POST(request(), { params });
    expect(response.status).toBe(200);
    expect(grantOrReuseEntitlement).toHaveBeenCalledWith("user-1", "product-1");
    expect(recordDownload).toHaveBeenCalledTimes(1);
  });

  it("refuses a new free grant for a priced product (409), creating nothing", async () => {
    findProductPrice.mockResolvedValue({
      productId: "product-1",
      amountCents: 4900,
      currency: "USD",
    });
    findEntitlement.mockResolvedValue(null);
    const response = await POST(request(), { params });
    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe("PRODUCT_NOT_FREE");
    expect(grantOrReuseEntitlement).not.toHaveBeenCalled();
    expect(recordDownload).not.toHaveBeenCalled();
  });

  it("lets someone who claimed it before it was priced keep access", async () => {
    findProductPrice.mockResolvedValue({
      productId: "product-1",
      amountCents: 4900,
      currency: "USD",
    });
    findEntitlement.mockResolvedValue(entitlement);
    grantOrReuseEntitlement.mockResolvedValue({ entitlement, reused: true });
    const response = await POST(request(), { params });
    expect(response.status).toBe(200);
    expect((await response.json()).reused).toBe(true);
  });
});

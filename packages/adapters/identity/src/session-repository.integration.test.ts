import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaSessionRepository } from "./session-repository.js";

/**
 * Runs only when DATABASE_URL points at a real, migrated Postgres database
 * (packages/db/prisma/schema). CI provides one via a Postgres service
 * container (.github/workflows/ci.yml). Locally, run `docker compose up -d`
 * (docker-compose.yml) and export DATABASE_URL before `pnpm test`.
 */
const hasDatabase = Boolean(process.env["DATABASE_URL"]);

describe.skipIf(!hasDatabase)("PrismaSessionRepository (integration)", () => {
  let db: import("@ppu/db").PrismaClient;
  let repo: PrismaSessionRepository;
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    const { prisma } = await import("@ppu/db");
    db = prisma;
    repo = new PrismaSessionRepository(db);

    const userA = await db.user.create({ data: { email: "session-repo-a@example.test" } });
    const userB = await db.user.create({ data: { email: "session-repo-b@example.test" } });
    userAId = userA.id;
    userBId = userB.id;
  });

  afterAll(async () => {
    await db.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
    await db.$disconnect();
  });

  it("lists only the requested user's sessions, newest first", async () => {
    const older = await db.session.create({
      data: {
        sessionToken: "token-older",
        userId: userAId,
        expires: new Date(Date.now() + 3_600_000),
        createdAt: new Date(Date.now() - 60_000),
      },
    });
    const newer = await db.session.create({
      data: {
        sessionToken: "token-newer",
        userId: userAId,
        expires: new Date(Date.now() + 3_600_000),
      },
    });
    await db.session.create({
      data: {
        sessionToken: "token-other-user",
        userId: userBId,
        expires: new Date(Date.now() + 3_600_000),
      },
    });

    const result = await repo.listByUser(userAId);

    expect(result.map((s) => s.id)).toEqual([newer.id, older.id]);
  });

  it("cascades session deletion when the owning user is deleted", async () => {
    const user = await db.user.create({ data: { email: "session-repo-cascade@example.test" } });
    const session = await db.session.create({
      data: {
        sessionToken: "token-cascade",
        userId: user.id,
        expires: new Date(Date.now() + 3_600_000),
      },
    });

    await db.user.delete({ where: { id: user.id } });

    expect(await repo.findById(session.id)).toBeNull();
  });

  it("deleteById removes exactly the targeted session", async () => {
    const session = await db.session.create({
      data: {
        sessionToken: "token-delete-me",
        userId: userAId,
        expires: new Date(Date.now() + 3_600_000),
      },
    });

    await repo.deleteById(session.id);

    expect(await repo.findById(session.id)).toBeNull();
  });
});

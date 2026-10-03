import { PrismaUpdateRepository } from "@ppu/adapter-content";
import { prisma } from "@ppu/db";

/** Platform updates (MVP-033 slice D). */
export const updateRepository = new PrismaUpdateRepository(prisma);

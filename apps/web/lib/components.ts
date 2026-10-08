import { PrismaComponentRepository } from "@ppu/adapter-content";
import { prisma } from "@ppu/db";

/** The Power Apps component library (MVP-049). */
export const componentRepository = new PrismaComponentRepository(prisma);

import { PrismaContentRepository } from "@ppu/adapter-content";
import { prisma } from "@ppu/db";

export const contentRepository = new PrismaContentRepository(prisma);

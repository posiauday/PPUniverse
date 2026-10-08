import { PrismaLearnRepository } from "@ppu/adapter-content";
import { prisma } from "@ppu/db";

/** Learn topics and lessons (MVP-048). */
export const learnRepository = new PrismaLearnRepository(prisma);

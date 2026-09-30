import { PrismaCommerceRepository } from "@ppu/adapter-commerce";
import { prisma } from "@ppu/db";

export const commerceRepository = new PrismaCommerceRepository(prisma);

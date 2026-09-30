import { PrismaCatalogRepository } from "@ppu/adapter-catalog";
import { prisma } from "@ppu/db";

export const catalogRepository = new PrismaCatalogRepository(prisma);

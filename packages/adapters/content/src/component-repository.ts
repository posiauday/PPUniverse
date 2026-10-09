import type { PrismaClient } from "@ppu/db";
import {
  canPublishComponent,
  type ComponentAccess,
  type ComponentAdminUpdate,
  type ComponentCategory,
  type ComponentCreateInput,
  type ComponentProperty,
  type ComponentRecord,
  type ComponentRepository,
  type ComponentTeaser,
  type ComponentVariation,
} from "@ppu/domain-content";

type Row = Awaited<ReturnType<PrismaClient["libraryComponent"]["findUniqueOrThrow"]>>;

function toRecord(row: Row): ComponentRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    componentName: row.componentName,
    category: row.category as ComponentCategory,
    summary: row.summary,
    guide: row.guide,
    yaml: row.yaml,
    properties: row.properties as unknown as ComponentProperty[],
    variations: row.variations as unknown as ComponentVariation[],
    access: row.access as ComponentAccess,
    version: row.version,
    needsModernControls: row.needsModernControls,
    status: row.status,
    publishedAt: row.publishedAt,
    hidden: row.hidden,
    comingSoon: row.comingSoon,
    testedAt: row.testedAt,
    testedStudioVersion: row.testedStudioVersion,
    updatedAt: row.updatedAt,
  };
}

/** The source fields, as Prisma data (JSON columns need a plain cast). */
function contentData(input: ComponentCreateInput) {
  return {
    slug: input.slug,
    title: input.title,
    componentName: input.componentName,
    category: input.category,
    summary: input.summary,
    guide: input.guide,
    yaml: input.yaml,
    properties: input.properties as unknown as object,
    variations: input.variations as unknown as object,
    access: input.access,
    version: input.version,
    needsModernControls: input.needsModernControls,
  };
}

const BY_TITLE = [{ title: "asc" as const }];

/** A draft the admin marked Coming soon, and not hidden. */
const COMING_SOON = { status: "DRAFT" as const, comingSoon: true, hidden: false };
/** Only what a teaser shows: never the YAML, guide or variations. */
const TEASER = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  category: true,
  componentName: true,
  access: true,
} as const;

/**
 * The component library's store (MVP-049). Every admin change (a test, a
 * publish, a setting) appends a ComponentEvent in the same transaction; that
 * table is the audit trail and is never updated.
 */
export class PrismaComponentRepository implements ComponentRepository {
  constructor(private readonly db: PrismaClient) {}

  async findBySlug(slug: string): Promise<ComponentRecord | null> {
    const row = await this.db.libraryComponent.findUnique({ where: { slug } });
    return row ? toRecord(row) : null;
  }

  async findById(id: string): Promise<ComponentRecord | null> {
    const row = await this.db.libraryComponent.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async create(input: ComponentCreateInput): Promise<ComponentRecord> {
    return toRecord(
      await this.db.libraryComponent.create({
        data: { ...contentData(input), authorUserId: input.authorUserId },
      }),
    );
  }

  async replaceDraft(id: string, input: ComponentCreateInput): Promise<ComponentRecord> {
    const current = await this.db.libraryComponent.findUnique({ where: { id } });
    if (!current) throw new Error(`Component ${id} not found`);
    if (current.status !== "DRAFT") throw new Error("Only a draft can be replaced from its files");
    // New YAML has not been tested: the old test record no longer applies.
    const yamlChanged = current.yaml !== input.yaml;
    return toRecord(
      await this.db.libraryComponent.update({
        where: { id },
        data: {
          ...contentData(input),
          ...(yamlChanged ? { testedAt: null, testedStudioVersion: null } : {}),
        },
      }),
    );
  }

  async listForAdmin(): Promise<ComponentRecord[]> {
    return (await this.db.libraryComponent.findMany({ orderBy: BY_TITLE })).map(toRecord);
  }

  async listPublic(): Promise<ComponentRecord[]> {
    const rows = await this.db.libraryComponent.findMany({
      where: { status: "PUBLISHED", hidden: false },
      orderBy: BY_TITLE,
    });
    return rows.map(toRecord);
  }

  async findPublicBySlug(slug: string): Promise<ComponentRecord | null> {
    const row = await this.db.libraryComponent.findFirst({
      where: { slug, status: "PUBLISHED", hidden: false },
    });
    return row ? toRecord(row) : null;
  }

  async listComingSoon(): Promise<ComponentTeaser[]> {
    return this.db.libraryComponent.findMany({
      where: COMING_SOON,
      select: TEASER,
      orderBy: BY_TITLE,
    }) as Promise<ComponentTeaser[]>;
  }

  async findComingSoonBySlug(slug: string): Promise<ComponentTeaser | null> {
    return this.db.libraryComponent.findFirst({
      where: { ...COMING_SOON, slug },
      select: TEASER,
    }) as Promise<ComponentTeaser | null>;
  }

  async updateSettings(
    id: string,
    change: ComponentAdminUpdate,
    actorUserId: string,
  ): Promise<ComponentRecord> {
    const row = await this.db.$transaction(async (tx) => {
      const current = await tx.libraryComponent.findUnique({ where: { id } });
      if (!current) throw new Error(`Component ${id} not found`);
      const data: { access?: ComponentAccess; hidden?: boolean; comingSoon?: boolean } = {};
      const detail: Record<string, { from: string | boolean; to: string | boolean }> = {};
      if (change.access !== undefined && change.access !== current.access) {
        data.access = change.access;
        detail["access"] = { from: current.access, to: change.access };
      }
      if (change.hidden !== undefined && change.hidden !== current.hidden) {
        data.hidden = change.hidden;
        detail["hidden"] = { from: current.hidden, to: change.hidden };
      }
      if (change.comingSoon !== undefined && change.comingSoon !== current.comingSoon) {
        data.comingSoon = change.comingSoon;
        detail["comingSoon"] = { from: current.comingSoon, to: change.comingSoon };
      }
      if (Object.keys(data).length === 0) return current;
      const updated = await tx.libraryComponent.update({ where: { id }, data });
      await tx.componentEvent.create({
        data: { componentId: id, actorUserId, action: "SETTINGS_CHANGED", detail },
      });
      return updated;
    });
    return toRecord(row);
  }

  async markTested(id: string, studioVersion: string, actorUserId: string): Promise<ComponentRecord> {
    const testedAt = new Date();
    const row = await this.db.$transaction(async (tx) => {
      const updated = await tx.libraryComponent.update({
        where: { id },
        data: { testedAt, testedStudioVersion: studioVersion.trim() },
      });
      await tx.componentEvent.create({
        data: {
          componentId: id,
          actorUserId,
          action: "TESTED",
          detail: { studioVersion: studioVersion.trim(), version: updated.version },
        },
      });
      return updated;
    });
    return toRecord(row);
  }

  async publish(id: string, actorUserId: string): Promise<ComponentRecord> {
    const row = await this.db.$transaction(async (tx) => {
      const current = await tx.libraryComponent.findUnique({ where: { id } });
      if (!current) throw new Error(`Component ${id} not found`);
      if (!canPublishComponent(current)) {
        throw new Error("Only a tested draft can be published");
      }
      const updated = await tx.libraryComponent.update({
        where: { id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
      await tx.componentEvent.create({
        data: { componentId: id, actorUserId, action: "PUBLISHED", detail: { version: current.version } },
      });
      return updated;
    });
    return toRecord(row);
  }
}

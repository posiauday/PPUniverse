import { prisma } from "@ppu/db";
import { logger } from "@ppu/telemetry";
import { cache } from "react";

/**
 * Site switches the product owner flips in /admin/settings
 * (docs/final-decisions.md, 2026-10-09, "Component library: a switch in the
 * admin, and Coming soon"). Each switch is saved in the database; until it is
 * first flipped, its environment variable decides, so nothing changes on
 * deploy. Every change is recorded for the audit log.
 */
export const SITE_SWITCHES = {
  components: {
    name: "Component library",
    env: "FEATURE_COMPONENTS",
    on: "The component library (/components) is public, with a Components link in the top bar and footer.",
    off: "The component library pages answer 404 and aren't linked. Test, mark Coming soon and publish components in the admin first.",
  },
} as const;

export type SiteSwitchKey = keyof typeof SITE_SWITCHES;

export function isSiteSwitchKey(value: unknown): value is SiteSwitchKey {
  return typeof value === "string" && Object.hasOwn(SITE_SWITCHES, value);
}

/** A switch's setting: the admin's choice once made, else its environment variable. */
export function resolveSwitch(saved: boolean | undefined, envValue: string | undefined): boolean {
  return saved ?? envValue === "on";
}

/** The saved switches, read once per request. If they can't be read, the environment decides. */
const savedSwitches = cache(async (): Promise<Map<string, boolean>> => {
  try {
    const rows = await prisma.siteSwitch.findMany({ select: { key: true, enabled: true } });
    return new Map(rows.map((row) => [row.key, row.enabled]));
  } catch (error) {
    logger.warn("site_switches.read_failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
    return new Map();
  }
});

export async function siteSwitchOn(key: SiteSwitchKey): Promise<boolean> {
  return resolveSwitch((await savedSwitches()).get(key), process.env[SITE_SWITCHES[key].env]);
}

/** The component library: /components, its pages, sitemap entries and links. */
export function componentsLibraryOn(): Promise<boolean> {
  return siteSwitchOn("components");
}

export interface SiteSwitchState {
  key: SiteSwitchKey;
  name: string;
  on: boolean;
  detail: string;
  /** "admin" once it has been flipped in the admin, otherwise the environment variable decides. */
  source: "admin" | "environment";
  envName: string;
}

/** Every switch, for the admin's Settings page. */
export async function listSiteSwitches(): Promise<SiteSwitchState[]> {
  const saved = await savedSwitches();
  return (Object.keys(SITE_SWITCHES) as SiteSwitchKey[]).map((key) => {
    const spec = SITE_SWITCHES[key];
    const on = resolveSwitch(saved.get(key), process.env[spec.env]);
    return {
      key,
      name: spec.name,
      on,
      detail: on ? spec.on : spec.off,
      source: saved.has(key) ? "admin" : "environment",
      envName: spec.env,
    };
  });
}

/** Flips a switch and records who did it, in one transaction. */
export async function setSiteSwitch(
  key: SiteSwitchKey,
  enabled: boolean,
  actorUserId: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.siteSwitch.upsert({
      where: { key },
      create: { key, enabled, updatedByUserId: actorUserId },
      update: { enabled, updatedByUserId: actorUserId },
    }),
    prisma.siteSwitchEvent.create({ data: { key, enabled, actorUserId } }),
  ]);
}

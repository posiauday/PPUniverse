import {
  EVIDENCE_STATUSES,
  EVIDENCE_STATUS_DEFINITIONS,
  EVIDENCE_STATUS_LABELS,
  PLATFORM_AREA_LABELS,
  formatReleaseWave,
  formatVerifiedDate,
} from "./compatibility.js";
import { SUPPORT_STATUS_LABELS, safeSupportChannelHref } from "./support.js";
import { normalizeDisplayText } from "./text.js";
import type { CompatibilityEvidenceStatus, ProductDetail } from "./types.js";

export interface EvidenceLegendItem {
  status: CompatibilityEvidenceStatus;
  label: string;
  definition: string;
}

export interface CompatibilityRowView {
  id: string;
  platformAreaLabel: string;
  minimumReleaseWaveLabel: string;
  evidenceStatus: CompatibilityEvidenceStatus;
  evidenceStatusLabel: string;
  evidenceSummary: string | null;
  lastVerified: { iso: string; label: string } | null;
  notes: string | null;
}

export interface ProductEvidenceView {
  licenses: { slug: string; name: string; description: string }[];
  version: string | null;
  support: { statusLabel: string; channelText: string | null; channelHref: string | null } | null;
  compatibility: CompatibilityRowView[];
  evidenceLegend: EvidenceLegendItem[];
  messages: {
    licenseEmpty: string;
    versionEmpty: string;
    supportEmpty: string;
    compatibilityEmpty: string;
    lastVerifiedUnavailable: string;
    minimumReleaseWaveNote: string;
  };
}

/** The compatibility empty-state text is the product owner's exact wording (docs/final-decisions.md, 2026-09-21). */
export const EVIDENCE_MESSAGES: ProductEvidenceView["messages"] = {
  licenseEmpty: "License information has not yet been provided.",
  versionEmpty: "Version information has not yet been provided.",
  supportEmpty: "Support information has not yet been provided.",
  compatibilityEmpty: "Compatibility information has not yet been provided.",
  lastVerifiedUnavailable: "Not independently verified",
  minimumReleaseWaveNote:
    "The minimum release wave is the earliest release wave for which the product claims compatibility. It is not proof that the product works with every later release.",
};

export const EVIDENCE_LEGEND: readonly EvidenceLegendItem[] = EVIDENCE_STATUSES.map((status) => ({
  status,
  label: EVIDENCE_STATUS_LABELS[status],
  definition: EVIDENCE_STATUS_DEFINITIONS[status],
}));

export function presentProductEvidence(
  detail: Pick<ProductDetail, "licenses" | "currentVersion" | "support" | "compatibility">,
): ProductEvidenceView {
  return {
    licenses: detail.licenses.map((license) => ({
      slug: license.slug,
      name: license.name,
      description: license.description,
    })),
    version: normalizeDisplayText(detail.currentVersion),
    support: detail.support
      ? {
          statusLabel: SUPPORT_STATUS_LABELS[detail.support.status],
          channelText: normalizeDisplayText(detail.support.channel),
          channelHref: safeSupportChannelHref(detail.support.channel),
        }
      : null,
    compatibility: detail.compatibility.map((entry) => {
      const verifiedLabel = entry.lastVerifiedAt ? formatVerifiedDate(entry.lastVerifiedAt) : null;
      return {
        id: entry.id,
        platformAreaLabel: PLATFORM_AREA_LABELS[entry.platformArea],
        minimumReleaseWaveLabel: formatReleaseWave(entry.minReleaseYear, entry.minReleaseWave),
        evidenceStatus: entry.evidenceStatus,
        evidenceStatusLabel: EVIDENCE_STATUS_LABELS[entry.evidenceStatus],
        evidenceSummary: normalizeDisplayText(entry.evidenceSummary),
        lastVerified:
          entry.lastVerifiedAt && verifiedLabel
            ? { iso: entry.lastVerifiedAt, label: verifiedLabel }
            : null,
        notes: normalizeDisplayText(entry.notes),
      };
    }),
    evidenceLegend: [...EVIDENCE_LEGEND],
    messages: EVIDENCE_MESSAGES,
  };
}

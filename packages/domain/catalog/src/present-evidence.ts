import {
  ASSIGNABLE_EVIDENCE_STATUSES,
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

/**
 * The public legend lists only the two assignable statuses (TD-008;
 * docs/final-decisions.md, 2026-09-21). TESTED never appears here even
 * though the enum value exists -- displaying it would tell buyers "Tested"
 * is meaningful when no product can be assigned it yet. NOT_VERIFIED is
 * legacy and never displayed either.
 */
export const EVIDENCE_LEGEND: readonly EvidenceLegendItem[] = ASSIGNABLE_EVIDENCE_STATUSES.map(
  (status) => ({
    status,
    label: EVIDENCE_STATUS_LABELS[status],
    definition: EVIDENCE_STATUS_DEFINITIONS[status],
  }),
);

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
    // TD-008, "fail closed": a TESTED or NOT_VERIFIED row is reserved/legacy
    // and must never render in the public matrix, even if one exists in the
    // database from before this vocabulary was corrected. Nothing can write
    // either status going forward (validateCompatibilityEntry rejects both),
    // so this filter only ever matters for pre-existing data, if any -- none
    // is known to exist (verified empty at MVP-005; see TD-008.md section 5).
    compatibility: detail.compatibility
      .filter((entry) =>
        (ASSIGNABLE_EVIDENCE_STATUSES as readonly CompatibilityEvidenceStatus[]).includes(
          entry.evidenceStatus,
        ),
      )
      .map((entry) => {
        const verifiedLabel = entry.lastVerifiedAt
          ? formatVerifiedDate(entry.lastVerifiedAt)
          : null;
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

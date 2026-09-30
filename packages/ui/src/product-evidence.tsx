import type { ProductEvidenceView } from "@ppu/domain-catalog";
import { Badge } from "./badge.js";

export interface ProductEvidenceProps {
  evidence: ProductEvidenceView;
}

const SECTION_HEADING = "text-xl font-semibold";
const HEADER_CELL = "px-3 py-2 text-left font-semibold";
const BODY_CELL = "px-3 py-3 align-top";

/**
 * License, version, support and compatibility for a product (MVP-005, FR-003).
 * Purely presentational: every string, label, date and link decision is made by
 * `presentProductEvidence` in @ppu/domain-catalog, so the rules stay testable
 * outside React and this component can't drift from them.
 *
 * Accessibility notes (WCAG 2.2 AA):
 * - One <h2> per section, and a real <table> for the compatibility matrix
 *   (caption, scoped column headers, and the platform area as the row header).
 * - Evidence status is always written out as text; it is never conveyed by
 *   colour alone, and all three states share one visual style.
 * - Definitions are visible text (a <dl>), never a hover-only tooltip.
 * - On narrow screens the table scrolls sideways inside a labelled region that
 *   is keyboard-focusable, so keyboard-only users can scroll it too.
 */
export function ProductEvidence({ evidence }: ProductEvidenceProps) {
  const { licenses, version, support, compatibility, evidenceLegend, messages } = evidence;

  return (
    <div className="mt-8 space-y-10">
      <section>
        <h2 className={SECTION_HEADING}>License</h2>
        {licenses.length === 0 ? (
          <p className="mt-3 text-muted-foreground">{messages.licenseEmpty}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {licenses.map((license) => (
              <li key={license.slug}>
                <span className="font-medium">{license.name}</span>
                <span className="block text-muted-foreground">{license.description}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className={SECTION_HEADING}>Version</h2>
        {version ? (
          <p className="mt-3">
            Current version: <span className="font-medium">{version}</span>
          </p>
        ) : (
          <p className="mt-3 text-muted-foreground">{messages.versionEmpty}</p>
        )}
      </section>

      <section>
        <h2 className={SECTION_HEADING}>Support</h2>
        {support ? (
          <div className="mt-3 space-y-1">
            <p className="font-medium">{support.statusLabel}</p>
            {support.channelText ? (
              <p>
                <span className="text-muted-foreground">Support channel: </span>
                {support.channelHref ? (
                  <a
                    href={support.channelHref}
                    rel="nofollow ugc noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    {support.channelText}
                  </a>
                ) : (
                  <span>{support.channelText}</span>
                )}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-muted-foreground">{messages.supportEmpty}</p>
        )}
      </section>

      <section>
        <h2 className={SECTION_HEADING}>Compatibility</h2>
        {compatibility.length === 0 ? (
          <p className="mt-3 text-muted-foreground">{messages.compatibilityEmpty}</p>
        ) : (
          <>
            <p className="mt-3 text-sm text-muted-foreground">{messages.minimumReleaseWaveNote}</p>

            <div
              role="region"
              aria-label="Compatibility matrix, scrollable"
              tabIndex={0}
              className="mt-4 overflow-x-auto rounded-card border border-border"
            >
              <table className="w-full min-w-[44rem] border-collapse text-sm">
                <caption className="sr-only">
                  Compatibility by platform area: minimum release wave, evidence status, date last
                  verified and notes
                </caption>
                <thead className="bg-muted">
                  <tr>
                    <th scope="col" className={HEADER_CELL}>
                      Platform Area
                    </th>
                    <th scope="col" className={HEADER_CELL}>
                      Minimum Release Wave
                    </th>
                    <th scope="col" className={HEADER_CELL}>
                      Evidence Status
                    </th>
                    <th scope="col" className={HEADER_CELL}>
                      Last Verified
                    </th>
                    <th scope="col" className={HEADER_CELL}>
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {compatibility.map((row) => (
                    <tr key={row.id}>
                      <th
                        scope="row"
                        className={`${BODY_CELL} text-left font-medium whitespace-nowrap`}
                      >
                        {row.platformAreaLabel}
                      </th>
                      <td className={`${BODY_CELL} whitespace-nowrap`}>
                        {row.minimumReleaseWaveLabel}
                      </td>
                      <td className={`${BODY_CELL} min-w-40`}>
                        <Badge variant="outline">{row.evidenceStatusLabel}</Badge>
                        {row.evidenceSummary ? (
                          <p className="mt-2 text-muted-foreground">
                            <span className="font-medium">Evidence summary:</span>{" "}
                            {row.evidenceSummary}
                          </p>
                        ) : null}
                      </td>
                      <td className={BODY_CELL}>
                        {row.lastVerified ? (
                          <time dateTime={row.lastVerified.iso}>{row.lastVerified.label}</time>
                        ) : (
                          messages.lastVerifiedUnavailable
                        )}
                      </td>
                      <td className={`${BODY_CELL} min-w-44`}>
                        {row.notes ?? <span className="text-muted-foreground">No notes</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mt-6 text-base font-semibold">What the evidence statuses mean</h3>
            <dl className="mt-2 space-y-2 text-sm">
              {evidenceLegend.map((item) => (
                <div key={item.status}>
                  <dt className="font-medium">{item.label}</dt>
                  <dd className="text-muted-foreground">{item.definition}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </section>
    </div>
  );
}

/** The LowCodeStacks mark: three stacked bars -- violet, coral and lime -- that
 * narrow towards the top (MVP-031, Daylight). Decorative -- always paired with
 * the visible name. Fixed colours: they read on both themes. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <rect x="2" y="18" width="24" height="7" rx="3.5" fill="#6c47ff" />
      <rect x="5" y="10.5" width="18" height="7" rx="3.5" fill="#ff7a59" />
      <rect x="8" y="3" width="12" height="7" rx="3.5" fill="#a3e635" />
    </svg>
  );
}

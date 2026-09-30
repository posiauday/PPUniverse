/** The LowCodeStacks mark: three stacked bars on a teal tile (MVP-027). Decorative -- always paired with the visible name. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="7" fill="#0b5c5c" />
      <rect x="7" y="8" width="18" height="4" rx="2" fill="#f5b83d" />
      <rect x="7" y="14" width="18" height="4" rx="2" fill="#6fd3c4" />
      <rect x="7" y="20" width="18" height="4" rx="2" fill="#ffffff" />
    </svg>
  );
}

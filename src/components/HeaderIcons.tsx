// Small filled glyphs drawn for the header (no thin-stroke icon set here)
type IconProps = { className?: string };

/* filled handset */
export const HandsetIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M6.6 2.6c.8-.5 1.8-.3 2.4.5l2.1 3c.5.8.4 1.8-.2 2.5l-1.4 1.5c.9 1.9 2.3 3.5 4 4.7l1.6-1.3c.7-.6 1.7-.6 2.4 0l2.9 2.3c.8.6.9 1.7.3 2.5l-1.4 1.8c-1 1.3-2.8 1.8-4.3 1.1C9.4 18.9 5.1 14.6 2.9 9c-.6-1.6-.1-3.4 1.3-4.4Z" />
  </svg>
);

/* chevron for the mega-menu trigger */
export const ChevronIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="m2.5 4.5 3.5 3.5 3.5-3.5" />
  </svg>
);

/* two-bar menu glyph */
export const MenuIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 22 22" fill="currentColor" className={className} aria-hidden="true">
    <rect x="2" y="6" width="18" height="2" rx="1" />
    <rect x="2" y="14" width="18" height="2" rx="1" />
  </svg>
);

export const CrossIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M3 3l10 10M13 3L3 13" />
  </svg>
);

export const ArrowIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

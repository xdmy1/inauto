/* eslint-disable @next/next/no-img-element */
// Original INAUTO.MD logo (red car + INAUTO.MD + "Noi avem mașina ta").
// logo.png       — recolored for light backgrounds (white text → ink)
// logo-white.png — untouched original, for dark backgrounds

export function Logo({
  className,
  markClassName = "h-12 w-auto",
  variant = "light",
}: {
  className?: string;
  markClassName?: string;
  /** background the logo sits on */
  variant?: "light" | "dark";
}) {
  return (
    <img
      src={variant === "dark" ? "/images/logo-white.png" : "/images/logo.png"}
      alt="INAUTO.MD — Noi avem mașina ta"
      width={195}
      height={75}
      className={`${markClassName} ${className ?? ""}`}
    />
  );
}

// decorative fallback silhouette (card/gallery placeholders only)
export function CarMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 132 44"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M4 32c0-4 4-7 11-9l11-3 12-9c3-2 6-3 10-3h14c5 0 9 1 13 4l10 7 15 3c6 2 10 5 10 8 0 2-2 3-4 3h-7a11 11 0 0 0-22 0H43a11 11 0 0 0-22 0h-9c-5 0-8-1-8-1Z" />
      <path
        fillRule="evenodd"
        d="M32 25a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
      />
      <path
        fillRule="evenodd"
        d="M100 25a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
      />
    </svg>
  );
}

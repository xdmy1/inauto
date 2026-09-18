// Car body silhouettes drawn for INAUTO — filled side profiles, one weight,
// no stroke glyphs. viewBox 64×28, colour from currentColor.
type P = { className?: string };

function Wheels({ x1, x2 }: { x1: number; x2: number }) {
  return (
    <>
      <circle cx={x1} cy="22" r="4.6" fill="currentColor" />
      <circle cx={x1} cy="22" r="2" fill="#fff" />
      <circle cx={x2} cy="22" r="4.6" fill="currentColor" />
      <circle cx={x2} cy="22" r="2" fill="#fff" />
    </>
  );
}

const Svg = ({ className, children }: P & { children: React.ReactNode }) => (
  <svg viewBox="0 0 64 28" className={className ?? "h-7 w-16"} aria-hidden="true">
    {children}
  </svg>
);

export const SedanIcon = (p: P) => (
  <Svg {...p}>
    <path
      d="M4 20c0-2 1-3.5 3-4l7-1.5 8-6.5c1-.8 2-1 3.5-1h12c1.5 0 2.5.4 3.5 1.3l6.5 5.7 9 1.5c2 .4 3 1.6 3 3.4v2.6c0 1-.7 1.5-1.7 1.5H5.7C4.7 23 4 22.4 4 21.4Zm10.5-5h10V9.5h-3.8c-.7 0-1.2.2-1.7.6ZM27 15h13l-4.6-4.9c-.4-.4-.9-.6-1.5-.6H27Z"
      fill="currentColor"
      fillRule="evenodd"
    />
    <Wheels x1={16} x2={49} />
  </Svg>
);

export const HatchbackIcon = (p: P) => (
  <Svg {...p}>
    <path
      d="M4 20c0-2 1.2-3.4 3-3.9l7-1.6 7.5-6.3c1-.8 2-1.2 3.5-1.2h14c2 0 3.5.8 4.5 2.4l4.2 6.7 5 .9c2 .4 3.3 1.6 3.3 3.5v2.3c0 1-.7 1.6-1.7 1.6H5.7C4.7 23 4 22.4 4 21.4Zm10.5-5.2h10V9.3h-3.5c-.8 0-1.3.2-1.8.7ZM27 14.8h14.2l-3.6-5.3c-.3-.4-.8-.6-1.3-.6H27Z"
      fill="currentColor"
      fillRule="evenodd"
    />
    <Wheels x1={16} x2={48} />
  </Svg>
);

export const WagonIcon = (p: P) => (
  <Svg {...p}>
    <path
      d="M4 20c0-2 1.2-3.4 3-3.9l6-1.4 7.5-6.5c1-.8 2-1.2 3.5-1.2h27c1.8 0 3 1 3.6 2.6l2.3 6.4 1.4.3c1.6.4 2.7 1.6 2.7 3.3v2.4c0 1-.7 1.6-1.7 1.6H5.7C4.7 23 4 22.4 4 21.4Zm9.5-5.4h10V9.3h-3.7c-.8 0-1.3.2-1.8.7ZM26 14.6h24.5l-2-4.8c-.3-.6-.8-.9-1.4-.9H26Z"
      fill="currentColor"
      fillRule="evenodd"
    />
    <Wheels x1={15} x2={49} />
  </Svg>
);

export const SuvIcon = (p: P) => (
  <Svg {...p}>
    <path d="M17 5.5h26l-.4-1.4H17.4Z" fill="currentColor" />
    <path
      d="M3 19c0-1.8 1-3.2 2.8-3.7l5.2-1.3 5.5-6.7c1-1.1 2.2-1.6 3.7-1.6h22.5c1.8 0 3 .8 3.8 2.3l3.2 6 6 1.2c2.2.4 3.3 1.7 3.3 3.6v2.6c0 1-.7 1.6-1.7 1.6H4.7C3.7 23 3 22.4 3 21.4Zm10.3-5h10.2V8h-3.5c-.9 0-1.5.3-2.1 1ZM26 14h17.5l-3-5.2c-.3-.5-.8-.8-1.4-.8H26Z"
      fill="currentColor"
      fillRule="evenodd"
    />
    <Wheels x1={15} x2={49} />
  </Svg>
);

export const MinivanIcon = (p: P) => (
  <Svg {...p}>
    <path
      d="M4 20c0-2 1-3.4 2.8-3.9l3.2-.8 6-8.6c1-1.3 2.3-2 4-2h30c2.2 0 3.6 1 4.4 3l2.9 7.1c1.8.5 2.7 1.7 2.7 3.5v2.1c0 1-.7 1.6-1.7 1.6H5.7C4.7 23 4 22.4 4 21.4Zm8.3-5.3h11V7.2h-4c-1 0-1.6.3-2.2 1.1ZM26 14.7h25l-2.5-6.4c-.3-.7-.8-1.1-1.6-1.1H26Z"
      fill="currentColor"
      fillRule="evenodd"
    />
    <Wheels x1={15} x2={49} />
  </Svg>
);

export const CoupeIcon = (p: P) => (
  <Svg {...p}>
    <path
      d="M4 20.5c0-2 1.2-3.5 3.2-4l8.8-2 8-5.6c1.3-.9 2.6-1.4 4.2-1.4h9c2 0 3.6.6 5 1.9l5.5 5.1 8.5 1.8c2 .5 3.3 1.7 3.3 3.6v1.5c0 1-.7 1.6-1.7 1.6H5.7C4.7 23 4 22.4 4 21.4Zm13-5.7h9.5V9.6h-2c-.8 0-1.5.3-2.2.8ZM29 14.8h13.4l-4.2-3.9c-.7-.6-1.5-.9-2.4-.9H29Z"
      fill="currentColor"
      fillRule="evenodd"
    />
    <Wheels x1={16} x2={49} />
  </Svg>
);

export const CabrioIcon = (p: P) => (
  <Svg {...p}>
    <path
      d="M4 20.5c0-2 1.2-3.5 3.2-4l9.3-2 6-2.5h13l3.5 2.5 9.5 2c2 .5 3.3 1.7 3.3 3.6v1.5c0 1-.7 1.6-1.7 1.6H5.7C4.7 23 4 22.4 4 21.4Zm11-8.3 6.5-2.7c.9-.4 1.7-.5 2.6-.5h11.4l3 3.1H15Z"
      fill="currentColor"
      fillRule="evenodd"
    />
    <Wheels x1={16} x2={49} />
  </Svg>
);

export const VanIcon = (p: P) => (
  <Svg {...p}>
    <path
      d="M4 20c0-1.5.6-2.6 1.8-3.3l1.2-.6 5-9.4c.8-1.4 2-2.2 3.7-2.2H52c1.7 0 2.8 1.1 2.8 2.8v13.4c0 1.2-.8 2.3-2 2.3H5.7C4.7 23 4 22.4 4 21.4Zm9.5-5.3h9.7V7.2h-3.8c-.9 0-1.5.4-2 1.2Z"
      fill="currentColor"
      fillRule="evenodd"
    />
    <Wheels x1={15} x2={47} />
  </Svg>
);

export const PickupIcon = (p: P) => (
  <Svg {...p}>
    <path
      d="M3 19.5c0-1.8 1-3.2 2.8-3.7l4.7-1.2 5.5-7c.9-1.1 2-1.6 3.5-1.6h10c1.6 0 2.8.7 3.6 2.1l3.4 6.3H58c1.6 0 2.6 1 2.6 2.5v4.6c0 1-.7 1.6-1.7 1.6H4.7C3.7 23 3 22.4 3 21.4Zm10.3-5.3h9.5V8.3h-2.8c-.9 0-1.5.3-2.1 1ZM25.5 14.2h9.7l-3-4.9c-.3-.5-.8-.8-1.4-.8h-5.3Z"
      fill="currentColor"
      fillRule="evenodd"
    />
    <path d="M36 10h22v3H36Z" fill="currentColor" opacity=".35" />
    <Wheels x1={15} x2={50} />
  </Svg>
);

export const BODY_ICONS = {
  sedan: SedanIcon,
  hatchback: HatchbackIcon,
  wagon: WagonIcon,
  suv: SuvIcon,
  coupe: CoupeIcon,
  cabrio: CabrioIcon,
  minivan: MinivanIcon,
  van: VanIcon,
  pickup: PickupIcon,
} as const;

// Spot illustrations drawn for INAUTO — grey fills, red accent, thin dark
// outline, a hint of depth. Replaces generic stroke-icon badges.
const INK = "#232633";
const GREY = "#d8dbe4";
const GREY_LIGHT = "#eceef3";
const GREY_DEEP = "#b9bdcc";
const RED = "#e0192b";
const RED_LIGHT = "#f04a58";

type P = { className?: string };
const base = "h-9 w-9";

/** light-grey rounded square holding the illustration */
export function IconSpot({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-paper">
      {children}
    </span>
  );
}

/** speedometer — real mileage */
export function OdometerIllo({ className }: P) {
  return (
    <svg viewBox="0 0 48 48" className={className ?? base} aria-hidden="true">
      <path
        d="M9 31a15 15 0 0 1 30 0v1.5a1.5 1.5 0 0 1-1.5 1.5h-27A1.5 1.5 0 0 1 9 32.5Z"
        fill={GREY_LIGHT}
        stroke={INK}
        strokeWidth="1.3"
      />
      <path
        d="M10.5 31a13.5 13.5 0 0 1 5-10.4A13.5 13.5 0 0 0 12 31v1.5h-1.5Z"
        fill={GREY}
      />
      <g stroke={INK} strokeWidth="1.2" strokeLinecap="round">
        <path d="M13.5 27.5l2.6 1" />
        <path d="M24 19.5v2.8" />
        <path d="M34.5 27.5l-2.6 1" />
      </g>
      <path
        d="M24 31 32.2 22.6"
        stroke={RED}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="24" cy="31" r="2.6" fill={RED_LIGHT} stroke={INK} strokeWidth="1.2" />
      <rect x="12" y="36.5" width="24" height="3.4" rx="1.7" fill={GREY} stroke={INK} strokeWidth="1.1" />
    </svg>
  );
}

/** banknote + coin — down payment from 100 € */
export function CoinsIllo({ className }: P) {
  return (
    <svg viewBox="0 0 48 48" className={className ?? base} aria-hidden="true">
      <rect
        x="7"
        y="15"
        width="26"
        height="16"
        rx="2"
        fill={GREY}
        stroke={INK}
        strokeWidth="1.3"
      />
      <rect x="10.5" y="18.5" width="19" height="9" rx="1.4" fill={GREY_LIGHT} stroke={INK} strokeWidth="1" />
      <circle cx="20" cy="23" r="3" fill={GREY} stroke={INK} strokeWidth="1" />
      <ellipse cx="33.5" cy="33.5" rx="7.5" ry="6.8" fill={GREY_DEEP} stroke={INK} strokeWidth="1.2" />
      <circle cx="33.5" cy="32.5" r="7" fill={RED_LIGHT} stroke={INK} strokeWidth="1.3" />
      <circle cx="33.5" cy="32.5" r="4.8" fill={RED} />
      <text
        x="33.5"
        y="36"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="9"
        fontWeight="700"
        fill="#fff"
      >
        €
      </text>
    </svg>
  );
}

/** steering wheel — test drive */
export function SteeringIllo({ className }: P) {
  return (
    <svg viewBox="0 0 48 48" className={className ?? base} aria-hidden="true">
      <circle cx="24" cy="24" r="15" fill={GREY} stroke={INK} strokeWidth="1.3" />
      <path
        d="M35.5 33a15 15 0 0 1-21.6 1.6A15 15 0 0 0 37 28.4Z"
        fill={GREY_DEEP}
        opacity="0.55"
      />
      <circle cx="24" cy="24" r="9" fill="#fff" stroke={INK} strokeWidth="1.2" />
      <path
        d="M9.4 22.2c4.6-1.8 24.6-1.8 29.2 0M24 33v6.2"
        stroke={INK}
        strokeWidth="1.2"
        fill="none"
      />
      <path d="M15.3 24.3h17.4L30 28h-12Z" fill={GREY_LIGHT} stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
      <circle cx="24" cy="26" r="3.6" fill={RED_LIGHT} stroke={INK} strokeWidth="1.2" />
      <path d="M22.4 24.9a2.2 2.2 0 0 1 3.2 0" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** contract with seal — papers done on the spot */
export function ContractIllo({ className }: P) {
  return (
    <svg viewBox="0 0 48 48" className={className ?? base} aria-hidden="true">
      <rect
        x="15"
        y="7.5"
        width="21"
        height="27"
        rx="2"
        fill={GREY}
        stroke={INK}
        strokeWidth="1.2"
        transform="rotate(4 25.5 21)"
      />
      <rect x="10" y="10" width="21" height="29" rx="2" fill="#fff" stroke={INK} strokeWidth="1.3" />
      <path d="M25 10h6v6" fill={GREY_LIGHT} />
      <path d="M25 10l6 6h-6Z" fill={GREY} stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
      <g stroke={GREY_DEEP} strokeWidth="1.6" strokeLinecap="round">
        <path d="M14.5 19h12" />
        <path d="M14.5 23.5h12" />
        <path d="M14.5 28h8" />
      </g>
      <circle cx="30" cy="34" r="6" fill={RED_LIGHT} stroke={INK} strokeWidth="1.3" />
      <circle cx="30" cy="34" r="4.1" fill={RED} />
      <path
        d="m27.9 34.1 1.5 1.5 2.8-3"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

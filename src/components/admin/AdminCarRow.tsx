import Link from "next/link";
import { fmtEngine, fmtKm, fmtPrice } from "@/lib/cars";
import { imageUrl } from "@/lib/images";
import { nnnAdvertUrl } from "@/lib/nnn/client";
import { daysLeft, fmtDateTime } from "@/lib/adminDates";
import { deleteCarAction } from "@/app/(admin)/admin/actions";
import { StatusSelect } from "./StatusSelect";
import { ConfirmSubmit } from "./ConfirmSubmit";

export type AdminCar = {
  id: string;
  slug: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  oldPrice: number | null;
  mileage: number;
  fuel: string;
  transmission: string;
  engineCc: number | null;
  status: string;
  featured: boolean;
  image: string | null;
  createdAt: string;
  advert: {
    advertId: string | null;
    source: string;
    state: string;
    nnnState: string | null;
    lastError: string | null;
    views: number | null;
    expiresAt: string | null;
    importedAt: string;
  } | null;
};

const FUEL: Record<string, string> = {
  petrol: "Benzină",
  diesel: "Diesel",
  hybrid: "Hibrid",
  phev: "Plug-in hibrid",
  electric: "Electric",
  gas: "Gaz/benzină",
};
const GEARBOX: Record<string, string> = {
  automatic: "automată",
  manual: "manuală",
  robotic: "robot",
  cvt: "variator",
};

/** one plain sentence about where the car stands on 999.md */
function nnnLine(a: NonNullable<AdminCar["advert"]>) {
  if (a.state === "ERROR") return { text: "Eroare la 999.md", warn: true };
  if (a.nnnState === "deleted") return { text: "Șters de pe 999.md", warn: true };
  if (a.nnnState === "hidden") return { text: "Ascuns pe 999.md", warn: false };
  if (a.nnnState === "expired") return { text: "Expirat pe 999.md", warn: true };
  if (a.nnnState && a.nnnState !== "public") return { text: `999.md: ${a.nnnState}`, warn: true };
  if (a.state === "DRY_RUN") return { text: "999.md: simulare", warn: false };
  if (a.state === "PENDING") return { text: "Se publică pe 999.md…", warn: false };
  return null;
}

export function AdminCarRow({ car }: { car: AdminCar }) {
  const a = car.advert;
  const real = !!a?.advertId && a.advertId !== "DRY-RUN";
  const status = a ? nnnLine(a) : null;
  const specs = [
    fmtKm(car.mileage),
    car.engineCc ? fmtEngine(car.engineCc) : null,
    FUEL[car.fuel] ?? car.fuel,
    GEARBOX[car.transmission] ? `cutie ${GEARBOX[car.transmission]}` : null,
  ].filter(Boolean);

  return (
    <li className="grid grid-cols-[88px_1fr] gap-x-3.5 gap-y-3 px-4 py-3.5 sm:grid-cols-[112px_1fr_auto] sm:items-center sm:px-5">
      <Link href={`/admin/cars/${car.id}`} className="row-span-1 block">
        {car.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(car.image, "sm")}
            alt=""
            loading="lazy"
            className="aspect-[4/3] w-full rounded-lg bg-line object-cover"
          />
        ) : (
          <span className="flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-line text-xs text-ink-faint">
            fără poză
          </span>
        )}
      </Link>

      <div className="min-w-0">
        <Link
          href={`/admin/cars/${car.id}`}
          className="font-display text-[15px] font-bold leading-snug hover:text-accent"
        >
          {car.brand} {car.model} <span className="text-ink-soft">{car.year}</span>
        </Link>
        <p className="mt-0.5 text-[13px] text-ink-soft">{specs.join(" · ")}</p>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-[15px] font-bold tabular-nums">
          {fmtPrice(car.price)}
          {car.oldPrice && car.oldPrice > car.price && (
            <span className="text-xs font-normal text-ink-faint line-through">
              {fmtPrice(car.oldPrice)}
            </span>
          )}
          {car.featured && (
            <span className="rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-semibold text-white">
              promovată
            </span>
          )}
        </p>
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-faint">
          {a?.source === "nnn" ? (
            <span>Adusă de pe 999.md {fmtDateTime(a.importedAt)}</span>
          ) : (
            <span>Adăugată pe site {fmtDateTime(car.createdAt)}</span>
          )}
          {real && (
            <a
              href={nnnAdvertUrl(a!.advertId!)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink-soft underline decoration-line underline-offset-2 hover:text-accent"
            >
              anunțul #{a!.advertId} ↗
            </a>
          )}
          {a?.views != null && <span>{a.views.toLocaleString("ro-RO")} vizualizări pe 999</span>}
          {a?.expiresAt && a.nnnState === "public" && (
            <span>expiră {daysLeft(a.expiresAt)}</span>
          )}
          {status && (
            <span
              className={status.warn ? "font-semibold text-accent-deep" : "font-medium text-ink-soft"}
              title={a?.lastError ?? undefined}
            >
              {status.text}
            </span>
          )}
        </p>
      </div>

      <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1 sm:justify-end">
        <StatusSelect carId={car.id} status={car.status} />
        <Link
          href={`/admin/cars/${car.id}`}
          className="chip-3d flex h-10 items-center rounded-lg px-3 text-[13px] font-semibold"
        >
          Editează
        </Link>
        <a
          href={`/auto/${car.slug}`}
          target="_blank"
          className="chip-3d hidden h-10 items-center rounded-lg px-3 text-[13px] font-semibold text-ink-soft sm:flex"
          title="Vezi pe site"
        >
          Pe site ↗
        </a>
        <form action={deleteCarAction}>
          <input type="hidden" name="carId" value={car.id} />
          <ConfirmSubmit
            message={`Ștergi definitiv ${car.brand} ${car.model} ${car.year}? Nu se poate anula.`}
            className="flex h-10 items-center rounded-lg px-2.5 text-[13px] font-semibold text-ink-faint hover:text-accent"
          >
            Șterge
          </ConfirmSubmit>
        </form>
      </div>
    </li>
  );
}

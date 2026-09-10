import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fmtPrice } from "@/lib/cars";
import { imageUrl } from "@/lib/images";
import { CarMark } from "./Logo";

export type CarCardData = {
  slug: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  oldPrice: number | null;
  downPayment: number | null;
  fuel: string;
  transmission: string;
  drivetrain: string | null;
  engineCc: number | null;
  powerHp: number | null;
  mileage: number;
  status: string;
  images: { path: string }[];
};

export async function CarCard({ car }: { car: CarCardData }) {
  const t = await getTranslations();
  const img = car.images[0];

  const specs = [
    `${car.mileage.toLocaleString("ro-RO")} km`,
    car.engineCc ? `${car.engineCc} cm³` : null,
    t(`options.fuel.${car.fuel}`).toLowerCase(),
    car.powerHp ? `${car.powerHp} cp` : null,
    t(`options.transmission.${car.transmission}`).toLowerCase(),
    car.drivetrain === "awd" ? "4×4" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      href={`/auto/${car.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-card shadow-card transition-shadow hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-line/50">
        {img ? (
          <img
            src={imageUrl(img.path, "sm")}
            alt={`${car.brand} ${car.model} ${car.year}`}
            width={640}
            height={480}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-line">
            <CarMark className="h-12 w-auto" />
          </div>
        )}
        {car.oldPrice && car.oldPrice > car.price && (
          <span className="tag-red absolute left-0 top-3 rounded-r-md py-1 pl-3 pr-2.5 text-xs font-bold uppercase tracking-wide">
            {t("common.priceDrop")}
          </span>
        )}
        {(car.status === "RESERVED" || car.status === "SOLD") && (
          <span className="absolute right-3 top-3 rounded bg-ink/85 px-2.5 py-1 text-xs font-semibold text-white">
            {car.status === "SOLD" ? t("common.sold") : t("common.reserved")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] font-bold leading-snug">
          {car.brand} {car.model}{" "}
          <span className="font-medium text-ink-faint">{car.year}</span>
        </h3>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">
          {specs}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          {car.downPayment != null ? (
            <span className="chip-3d rounded-md px-2 py-1 text-[11px] font-semibold text-ink-soft">
              {t("common.downPayment")}{" "}
              <span className="text-ink">{fmtPrice(car.downPayment)}</span>
            </span>
          ) : (
            <span />
          )}
          <div className="text-right">
            {car.oldPrice && car.oldPrice > car.price && (
              <div className="text-xs text-ink-faint line-through">
                {fmtPrice(car.oldPrice)}
              </div>
            )}
            <div className="tag-red rounded-md px-2.5 py-1 text-[15px] font-bold">
              {fmtPrice(car.price)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

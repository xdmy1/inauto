import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fmtKm, fmtPrice } from "@/lib/cars";
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
  mileage: number;
  status: string;
  images: { path: string }[];
};

export async function CarCard({ car }: { car: CarCardData }) {
  const t = await getTranslations();
  const img = car.images[0];

  return (
    <Link
      href={`/auto/${car.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-line/50">
        {img ? (
          // pre-sized 640×480 webp generated at upload time
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
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-white">
            −{Math.round((1 - car.price / car.oldPrice) * 100)}%
          </span>
        )}
        {(car.status === "RESERVED" || car.status === "SOLD") && (
          <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-semibold text-white">
            {car.status === "SOLD" ? t("common.sold") : t("common.reserved")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-bold leading-snug">
          {car.brand} {car.model}
          <span className="ml-1.5 font-semibold text-ink-faint">{car.year}</span>
        </h3>

        <p className="mt-1 text-[13px] text-ink-soft">
          {t(`options.fuel.${car.fuel}`)} · {fmtKm(car.mileage)} ·{" "}
          {t(`options.transmission.${car.transmission}`)}
        </p>

        <div className="mt-3 flex items-end justify-between gap-2 pt-1">
          <div>
            {car.oldPrice && car.oldPrice > car.price && (
              <div className="text-xs text-ink-faint line-through">
                {fmtPrice(car.oldPrice)}
              </div>
            )}
            <div className="font-display text-lg font-extrabold tracking-tight text-accent">
              {fmtPrice(car.price)}
            </div>
          </div>
          {car.downPayment != null && (
            <div className="rounded-lg bg-accent-soft px-2 py-1 text-right">
              <div className="text-[10px] font-medium uppercase tracking-wide text-accent-deep/70">
                {t("common.downPayment")}
              </div>
              <div className="text-xs font-bold text-accent-deep">
                {fmtPrice(car.downPayment)}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fmtEngine, fmtPrice, isNewListing } from "@/lib/cars";
import { imageSrcSet, imageUrl } from "@/lib/images";
import { CarMark } from "./Logo";
import { CameraIcon } from "./icons";

export type CarCardData = {
  slug: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  oldPrice: number | null;
  downPayment: number | null;
  monthlyRate?: number | null;
  fuel: string;
  transmission: string;
  drivetrain: string | null;
  engineCc: number | null;
  powerHp: number | null;
  mileage: number;
  status: string;
  createdAt?: Date;
  images: { path: string }[];
  _count?: { images: number };
};

// Dense dealership card: photo with stamps, title + year chip, one spec line,
// red price box + financing hint. Same shape everywhere on the site.
export async function CarCard({
  car,
  priority = false,
}: {
  car: CarCardData;
  priority?: boolean;
}) {
  const t = await getTranslations();
  const img = car.images[0];
  const photos = car._count?.images ?? car.images.length;
  const discounted = !!car.oldPrice && car.oldPrice > car.price;
  const fresh = car.createdAt ? isNewListing(car.createdAt) : false;
  const unavailable = car.status === "RESERVED" || car.status === "SOLD";

  const specs = [
    `${car.mileage.toLocaleString("ro-RO")} km`,
    car.engineCc ? fmtEngine(car.engineCc) : null,
    t(`options.fuel.${car.fuel}`),
    car.powerHp ? `${car.powerHp} CP` : null,
    t(`options.transmission.${car.transmission}`),
    car.drivetrain === "awd" ? "4x4" : null,
  ].filter(Boolean);

  return (
    <Link
      href={`/auto/${car.slug}`}
      data-reveal
      className="card group flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-line/50">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(img.path, "md")}
            srcSet={imageSrcSet(img.path)}
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
            alt={`${car.brand} ${car.model} ${car.year}`}
            width={640}
            height={480}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] ${
              unavailable ? "grayscale-[35%]" : ""
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-line">
            <CarMark className="h-12 w-auto" />
          </div>
        )}

        {/* stamps */}
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {discounted && (
            <span className="photo-badge tag-red">{t("common.priceDrop")}</span>
          )}
          {!discounted && fresh && (
            <span className="photo-badge photo-badge-white">{t("common.new")}</span>
          )}
        </div>
        {photos > 1 && (
          <span className="photo-badge photo-badge-ink absolute bottom-2.5 right-2.5 normal-case tracking-normal">
            <CameraIcon className="h-3 w-3" />
            {photos}
          </span>
        )}
        {unavailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/45">
            <span className="rounded-md bg-card px-3 py-1.5 font-display text-sm font-extrabold uppercase tracking-wide text-ink">
              {car.status === "SOLD" ? t("common.sold") : t("common.reserved")}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[15.5px] font-bold leading-snug tracking-tight">
            {car.brand} {car.model}
          </h3>
          <span className="year-chip">{car.year}</span>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">
          {specs.join(" · ")}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3.5">
          <div className="flex flex-col items-start">
            {discounted && (
              <span className="mb-0.5 text-[11.5px] text-ink-faint line-through">
                {fmtPrice(car.oldPrice!)}
              </span>
            )}
            <span className="price-box">{fmtPrice(car.price)}</span>
          </div>
          {(car.downPayment != null || car.monthlyRate) && (
            <div className="text-right text-[11.5px] leading-tight text-ink-soft">
              {car.downPayment != null && (
                <div>
                  {t("common.downPayment")}{" "}
                  <b className="font-semibold text-ink">{fmtPrice(car.downPayment)}</b>
                </div>
              )}
              {car.monthlyRate ? (
                <div className="mt-0.5">
                  <b className="font-semibold text-ink">{fmtPrice(car.monthlyRate)}</b>
                  {t("common.perMonth")}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

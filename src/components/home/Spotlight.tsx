import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { fmtEngine, fmtKm, fmtPrice } from "@/lib/cars";
import { imageUrl } from "@/lib/images";
import { site, telHref } from "@/lib/site";
import { ArrowRightIcon, PhoneIcon } from "../icons";

export type SpotlightCar = {
  slug: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  oldPrice: number | null;
  downPayment: number | null;
  monthlyRate: number | null;
  body: string;
  fuel: string;
  transmission: string;
  drivetrain: string | null;
  mileage: number;
  engineCc: number | null;
  powerHp: number | null;
  color: string | null;
  images: { path: string }[];
};

// One car, big — the "exclusive" block on cipauto, our featured car here.
export async function Spotlight({ car }: { car: SpotlightCar }) {
  const t = await getTranslations();
  const discounted = !!car.oldPrice && car.oldPrice > car.price;
  const [main, ...rest] = car.images;

  const specs = [
    [t("common.year"), String(car.year)],
    [t("common.mileage"), fmtKm(car.mileage)],
    [t("common.engine"), car.engineCc ? `${fmtEngine(car.engineCc)}${car.powerHp ? ` · ${car.powerHp} CP` : ""}` : car.powerHp ? `${car.powerHp} CP` : null],
    [t("common.fuel"), t(`options.fuel.${car.fuel}`)],
    [t("common.transmission"), t(`options.transmission.${car.transmission}`)],
    [t("common.drivetrain"), car.drivetrain ? t(`options.drivetrain.${car.drivetrain}`) : null],
    [t("common.body"), t(`options.body.${car.body}`)],
    [t("common.color"), car.color],
  ].filter((s): s is [string, string] => !!s[1]);

  return (
    <div
      data-reveal
      className="card grid grid-cols-1 overflow-hidden rounded-2xl lg:grid-cols-[1.2fr_1fr]"
    >
      <Link href={`/auto/${car.slug}`} className="group relative block bg-line/40">
        {main ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(main.path, "lg")}
            alt={`${car.brand} ${car.model} ${car.year}`}
            width={1600}
            height={1200}
            className="aspect-[4/3] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="aspect-[4/3]" />
        )}
        <span className="photo-badge tag-red absolute left-4 top-4 h-7 px-3 text-xs">
          {t("home.spotlight")}
        </span>
        {rest.length > 0 && (
          <div className="absolute bottom-4 left-4 flex gap-1.5">
            {rest.slice(0, 3).map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.path}
                src={imageUrl(img.path, "sm")}
                alt=""
                className="h-12 w-16 rounded-md border-2 border-white/90 object-cover shadow-card"
              />
            ))}
            {car.images.length > 4 && (
              <span className="photo-badge photo-badge-ink h-12 w-16 justify-center rounded-md text-sm normal-case">
                +{car.images.length - 4}
              </span>
            )}
          </div>
        )}
      </Link>

      <div className="flex flex-col p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
          {t("home.spotlightText")}
        </p>
        <h3 className="mt-2 font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
          {car.brand} {car.model}{" "}
          <span className="font-bold text-ink-faint">{car.year}</span>
        </h3>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
          {specs.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
              <dt className="text-ink-soft">{k}</dt>
              <dd className="text-right font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-2">
          <div>
            {discounted && (
              <div className="text-sm text-ink-faint line-through">{fmtPrice(car.oldPrice!)}</div>
            )}
            <span className="price-box price-box-lg">{fmtPrice(car.price)}</span>
          </div>
          <div className="pb-1 text-[13px] leading-snug text-ink-soft">
            {car.downPayment != null && (
              <div>{t("common.downFrom", { amount: fmtPrice(car.downPayment) })}</div>
            )}
            {car.monthlyRate ? (
              <div>{t("common.monthly", { amount: fmtPrice(car.monthlyRate) })}</div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link href={`/auto/${car.slug}`} className="btn-primary h-11 px-5">
            {t("common.seeCar")}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <a href={telHref(site.phones[0])} className="btn-outline h-11 px-5 tabular-nums">
            <PhoneIcon className="h-4 w-4 text-accent" />
            {site.phoneDisplay[0]}
          </a>
        </div>
      </div>
    </div>
  );
}

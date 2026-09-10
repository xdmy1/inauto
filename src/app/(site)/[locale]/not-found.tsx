import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CarMark } from "@/components/Logo";
import { ArrowRightIcon } from "@/components/icons";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="mx-auto flex max-w-[1360px] flex-col items-center px-4 pb-10 pt-20 text-center sm:px-6 sm:pt-28">
      <div className="relative">
        <span className="font-display text-[110px] font-extrabold leading-none tracking-tight text-line sm:text-[160px]">
          404
        </span>
        <CarMark className="absolute left-1/2 top-1/2 h-14 w-auto -translate-x-1/2 -translate-y-1/2 text-accent sm:h-20" />
      </div>

      <h1 className="mt-8 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-soft">
        {t("text")}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/auto" className="btn-primary">
          {t("catalog")}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
        <Link href="/" className="btn-outline">
          {t("home")}
        </Link>
      </div>
    </div>
  );
}

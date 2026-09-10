import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { site, telHref } from "@/lib/site";
import { Logo } from "./Logo";

export async function Footer() {
  const t = await getTranslations();

  return (
    <footer className="mt-24 border-t border-line bg-card">
      <div className="mx-auto max-w-[1360px] px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-ink-soft">{t("common.tagline")}</p>
          </div>

          <nav className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm" aria-label="Footer">
            <Link href="/auto" className="text-ink-soft hover:text-ink">
              {t("nav.catalog")}
            </Link>
            <Link href="/despre" className="text-ink-soft hover:text-ink">
              {t("nav.about")}
            </Link>
            <Link href="/contacte" className="text-ink-soft hover:text-ink">
              {t("nav.contact")}
            </Link>
            <Link href="/" className="text-ink-soft hover:text-ink">
              {t("nav.home")}
            </Link>
          </nav>

          <div className="text-sm text-ink-soft">
            <p>{t("footer.address")}</p>
            <p className="mt-1">
              <a href={telHref(site.phones[0])} className="font-medium text-ink hover:text-accent">
                {site.phoneDisplay[0]}
              </a>
            </p>
            <p className="mt-1">
              <a href={`mailto:${site.email}`} className="hover:text-ink">
                {site.email}
              </a>
            </p>
          </div>
        </div>

        <div className="hairline mt-10 pt-6 text-xs text-ink-faint">
          {t("footer.rights", { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}

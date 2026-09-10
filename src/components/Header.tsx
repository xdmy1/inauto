import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { site, telHref } from "@/lib/site";
import { Logo } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileMenu } from "./MobileMenu";
import { PhoneIcon } from "./icons";

export async function Header() {
  const t = await getTranslations();

  const nav = [
    { href: "/", label: t("nav.home") },
    { href: "/auto", label: t("nav.catalog") },
    { href: "/despre", label: t("nav.about") },
    { href: "/contacte", label: t("nav.contact") },
  ] as const;

  const usps = [
    t("common.tagline"),
    t("home.why.financing"),
    t("home.why.verified"),
    t("home.why.docs"),
    t("home.why.testdrive"),
    site.address.full,
    site.phoneDisplay[0],
  ];

  return (
    <>
      {/* ticker — infinite marquee */}
      <div className="overflow-hidden bg-ink text-paper">
        <div className="flex w-max animate-marquee">
          {[0, 1].map((half) => (
            <div
              key={half}
              aria-hidden={half === 1}
              className="flex h-11 items-center"
            >
              {usps.map((u) => (
                <span
                  key={u}
                  className="flex items-center whitespace-nowrap text-base font-extralight tracking-wide text-paper/85"
                >
                  <span className="px-7 text-accent" aria-hidden>
                    ·
                  </span>
                  {u}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1360px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label={site.name} className="shrink-0">
            <Logo markClassName="h-12 w-auto" />
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <LocaleSwitcher />
            <a
              href={telHref(site.phones[0])}
              className="hidden h-10 items-center gap-2 rounded-xl border border-line bg-card px-3.5 text-sm font-semibold tabular-nums transition-colors hover:border-ink-faint lg:flex"
            >
              <PhoneIcon className="h-4 w-4 text-accent" />
              {site.phoneDisplay[0]}
            </a>
            <Link
              href="/auto"
              className="hidden h-10 items-center rounded-xl bg-accent px-4 font-display text-sm font-bold text-white transition-colors hover:bg-accent-deep md:flex"
            >
              {t("nav.catalog")}
            </Link>
            <MobileMenu
              items={nav.map((n) => ({ ...n }))}
              phone={site.phoneDisplay[0]}
              phoneHref={telHref(site.phones[0])}
            />
          </div>
        </div>
      </header>
    </>
  );
}

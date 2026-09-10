import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { site, telHref } from "@/lib/site";
import { Logo } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileMenu } from "./MobileMenu";

export async function Header() {
  const t = await getTranslations("nav");

  const nav = [
    { href: "/", label: t("home") },
    { href: "/auto", label: t("catalog") },
    { href: "/despre", label: t("about") },
    { href: "/contacte", label: t("contact") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label={site.name} className="shrink-0">
          <Logo />
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

        <div className="flex items-center gap-3">
          <a
            href={telHref(site.phones[0])}
            className="hidden text-sm font-semibold tabular-nums tracking-tight lg:block"
          >
            {site.phoneDisplay[0]}
          </a>
          <LocaleSwitcher />
          <MobileMenu
            items={nav.map((n) => ({ ...n }))}
            phone={site.phoneDisplay[0]}
            phoneHref={telHref(site.phones[0])}
          />
        </div>
      </div>
    </header>
  );
}

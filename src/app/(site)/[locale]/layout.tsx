import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { site } from "@/lib/site";
import { autoDealerJsonLd, canonicalFor, localizedAlternates } from "@/lib/seo";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { ScrollReveal } from "@/components/ScrollReveal";
import "../../globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

// Rendered at request time — serverless build machines have no database
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });
  const alternates = localizedAlternates("");
  return {
    metadataBase: new URL(site.url),
    title: {
      default: t("title"),
      template: `%s | ${site.name}`,
    },
    description: t("description"),
    alternates: {
      canonical: canonicalFor(locale, ""),
      languages: alternates.languages,
    },
    openGraph: {
      siteName: site.name,
      type: "website",
      locale: locale === "ru" ? "ru_RU" : "ro_RO",
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${manrope.variable}`}
      // data-anim is set by the inline script before hydration (scroll-reveal)
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col">
        {/* marks the document before hydration so scroll-reveal can hide
            sections without a flash; without JS everything stays visible */}
        <Script id="anim-flag" strategy="beforeInteractive">
          {"document.documentElement.setAttribute('data-anim','')"}
        </Script>
        <NextIntlClientProvider>
          <ScrollReveal />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <FloatingWhatsApp />
        </NextIntlClientProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(autoDealerJsonLd()),
          }}
        />
      </body>
    </html>
  );
}

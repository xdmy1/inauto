import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Uploaded car photos are pre-sized to webp variants at upload time (sharp),
  // served from /uploads with immutable caching — no runtime optimizer needed.
  poweredByHeader: false,

  // The old inauto.md — every URL Google and the Wayback Machine still know —
  // answers with a 301 to its page on this site, so the rankings carry over.
  // Car URLs (/car/<slug>, /listings/<slug>) are resolved against the live
  // stock in src/lib/legacy.ts.
  async redirects() {
    const to = (source: string, destination: string) => ({
      source,
      destination,
      statusCode: 301 as const,
    });
    return [
      to("/about", "/despre"),
      to("/contacts", "/contacte"),
      to("/contact-us", "/contacte"),
      to("/car", "/auto"),
      to("/listings", "/auto"),
      to("/compare", "/auto"),
      // the old home page was the paginated catalog
      to("/page/:n", "/auto"),
      {
        source: "/language/change",
        has: [{ type: "query" as const, key: "lang", value: "RU|ru" }],
        destination: "/ru",
        statusCode: 301 as const,
      },
      to("/language/:path*", "/"),
      to("/currency/:path*", "/"),
    ];
  },
};

export default withNextIntl(nextConfig);

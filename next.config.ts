import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Uploaded car photos are pre-sized to webp variants at upload time (sharp),
  // served from /uploads with immutable caching — no runtime optimizer needed.
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);

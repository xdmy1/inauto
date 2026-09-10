import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE, verifySessionToken } from "./lib/session";

const intl = createIntlMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token || !(await verifySessionToken(token))) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return intl(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|uploads|.*\\..*).*)"],
};

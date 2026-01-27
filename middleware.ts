import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale, resolveLocaleFromCountry } from "@/lib/locale";

const COUNTRY_HEADERS = ["cf-ipcountry", "x-vercel-ip-country", "x-country", "x-geo-country"];

export const middleware = (request: NextRequest) => {
  const existing = request.cookies.get(LOCALE_COOKIE)?.value;
  if (normalizeLocale(existing)) {
    return NextResponse.next();
  }

  const country = COUNTRY_HEADERS.map((header) => request.headers.get(header)).find(Boolean) || undefined;
  const locale = resolveLocaleFromCountry(country) || DEFAULT_LOCALE;

  const response = NextResponse.next();
  response.cookies.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
};

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};

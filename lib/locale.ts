export type AppLocale = "en" | "uk" | "it";

export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_COOKIE = "op17_locale";

export const normalizeLocale = (value?: string | null): AppLocale | null => {
  if (!value) return null;
  const lower = value.toLowerCase().trim();
  const base = lower.split(/[-_]/)[0] || lower;
  const normalized = base === "ua" ? "uk" : base;
  if (normalized === "en" || normalized === "uk" || normalized === "it") {
    return normalized as AppLocale;
  }
  return null;
};

export const resolveLocaleFromCountry = (country?: string | null): AppLocale => {
  if (!country) return DEFAULT_LOCALE;
  const upper = country.toUpperCase();
  if (upper === "IT") return "it";
  if (upper === "UA") return "uk";
  return DEFAULT_LOCALE;
};

export const getCookieValue = (cookieHeader: string | null, name: string) => {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((part) => part.trim());
  const prefix = `${name}=`;
  const match = cookies.find((cookie) => cookie.startsWith(prefix));
  if (!match) return null;
  return decodeURIComponent(match.slice(prefix.length));
};

export const getRequestLocale = (request: Request): AppLocale => {
  const cookie = getCookieValue(request.headers.get("cookie"), LOCALE_COOKIE);
  const normalized = normalizeLocale(cookie);
  return normalized || DEFAULT_LOCALE;
};

export const getClientLocale = (): AppLocale => {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const cookie = getCookieValue(document.cookie, LOCALE_COOKIE);
  return normalizeLocale(cookie) || DEFAULT_LOCALE;
};

export const setClientLocale = (locale: AppLocale) => {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
};

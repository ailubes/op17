import { useEffect, useState } from "react";
import { AppLocale, getClientLocale, getCookieValue, LOCALE_COOKIE, normalizeLocale, setClientLocale } from "@/lib/locale";

export const useLocale = () => {
  const [locale, setLocale] = useState<AppLocale>(() => getClientLocale());

  useEffect(() => {
    const cookie = getCookieValue(document.cookie, LOCALE_COOKIE);
    const normalized = normalizeLocale(cookie);
    const resolved = normalized || getClientLocale();

    if (!normalized) {
      setClientLocale(resolved);
    }

    setLocale(resolved);
  }, []);

  return locale;
};

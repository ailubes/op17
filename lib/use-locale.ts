import { useEffect, useState } from "react";
import { AppLocale, getClientLocale } from "@/lib/locale";

export const useLocale = () => {
  const [locale, setLocale] = useState<AppLocale>(getClientLocale());

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  return locale;
};

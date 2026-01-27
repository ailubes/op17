import { cookies } from "next/headers";
import App from "../App";
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale } from "@/lib/locale";

export default function HomePage() {
  const cookieStore = cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = normalizeLocale(cookieValue) || DEFAULT_LOCALE;

  return <App initialLocale={locale} />;
}

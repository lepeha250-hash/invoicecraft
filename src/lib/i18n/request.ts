import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import en from "../../messages/en.json";
import ru from "../../messages/ru.json";

const messages = {
  en,
  ru,
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "en" | "ru")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: messages[locale as "en" | "ru"],
  };
});

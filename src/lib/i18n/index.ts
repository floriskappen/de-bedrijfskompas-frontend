import { messages } from "./messages";

export type MessageKey = keyof typeof messages.nl;

export function t(key: MessageKey, locale: string): string {
  const currentLocale = locale === "en" ? "en" : "nl";
  return messages[currentLocale][key] || messages.nl[key] || key;
}

export function getLocaleFromPath(pathname: string): "nl" | "en" {
  const cleanPath = pathname.replace(/^\/+/, ""); // remove leading slashes
  const segments = cleanPath.split("/");
  if (segments[0] === "en") {
    return "en";
  }
  return "nl";
}

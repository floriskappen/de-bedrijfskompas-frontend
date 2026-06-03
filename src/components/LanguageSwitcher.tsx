import React, { useEffect, useState } from "react";
import { t } from "../lib/i18n";

interface LanguageSwitcherProps {
  locale: "nl" | "en";
}

export default function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const [href, setHref] = useState("");

  useEffect(() => {
    const updateHref = () => {
      const url = new URL(window.location.href);
      const pathname = url.pathname;
      const search = url.search;

      let targetPath = "";
      if (locale === "nl") {
        // Switch to English: prepend /en
        if (pathname === "/") {
          targetPath = "/en/";
        } else {
          // ensure we don't duplicate slashes
          targetPath = `/en${pathname}`;
        }
      } else {
        // Switch to Dutch: remove /en prefix
        if (pathname.startsWith("/en/")) {
          targetPath = pathname.substring(3);
        } else if (pathname === "/en") {
          targetPath = "/";
        } else {
          targetPath = pathname;
        }
      }

      setHref(`${targetPath}${search}`);
    };

    updateHref();

    // Listen to selection-changed events to update the href parameter immediately
    const handleSelectionChange = () => {
      updateHref();
    };

    window.addEventListener("selection-changed", handleSelectionChange);
    return () => {
      window.removeEventListener("selection-changed", handleSelectionChange);
    };
  }, [locale]);

  return (
    <a
      href={href || "#"}
      id="language-switcher"
      className="ontwerp-button h-10"
    >
      {t("switcher_label", locale)}
    </a>
  );
}

"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function changeLang(lang: string) {
    const nextPath = `/${lang}${pathname.replace(/^\/(fr|en)/, "")}`;

    router.replace(nextPath);
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => changeLang("fr")}
        className={locale === "fr" ? "font-bold" : ""}
      >
        FR
      </button>

      <button
        type="button"
        onClick={() => changeLang("en")}
        className={locale === "en" ? "font-bold" : ""}
      >
        EN
      </button>
    </div>
  );
}

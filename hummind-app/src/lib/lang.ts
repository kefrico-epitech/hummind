"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import posthog from "posthog-js";

export function useLangHelper() {
    const locale = useLocale();
    const router = useRouter();        // ✅ App Router
    const pathname = usePathname();    // ✅ App Router

    function handleLangChange(lang: "fr" | "en") {
        if (lang === locale) return;

        const parts = pathname.split("/");
        parts[1] = lang; // remplace la locale existante
        const nextPath = parts.join("/") || `/${lang}`;

        posthog.capture("language_switched", {
            from: locale,
            to: lang,
            path: pathname,
        });

        router.push(nextPath);           // ✅ correct pour App Router
    }

    return {
        locale,
        handleLangChange,
    };
}

"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import posthog from "posthog-js";

export function usePageTracking() {
    const pathname = usePathname();
    const search = useSearchParams();
    const searchValue = search?.toString() ?? "";

    useEffect(() => {
        if (!pathname) return;

        posthog.capture("$pageview", {
            $current_url: pathname + (searchValue ? "?" + searchValue : ""),
        });
    }, [pathname, searchValue]);
}

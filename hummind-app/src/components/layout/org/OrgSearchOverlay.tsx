"use client";

import {
  Fragment,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Folder, LoaderCircle, Search, X } from "lucide-react";

import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import type { QuickSearchEntry } from "./OrgLayout";
import {
  SearchService,
  type GlobalSearchResult,
  type GlobalSearchResultType,
} from "../../../services/search.service";

interface OrgSearchOverlayProps {
  open: boolean;
  entries: QuickSearchEntry[];
  onClose?: () => void;
}

interface SearchOverlayItem {
  key: string;
  label: string;
  hint: string;
  href: string;
  badge: string;
  icon: QuickSearchEntry["icon"];
}

interface SearchSectionData {
  key: string;
  title: string;
  items: SearchOverlayItem[];
}

const MIN_BACKEND_QUERY_LENGTH = 2;
const SEARCH_DELAY_MS = 250;

function getSearchTypeLabel(type: GlobalSearchResultType) {
  switch (type) {
    case "ORGANISATION":
      return "Organisation";
    case "DEPARTEMENT":
      return "Departement";
    case "SALLE":
      return "Salle";
    case "INDEPENDANT":
      return "Salle independante";
    case "COURSE":
      return "Cours";
    default:
      return "Resultat";
  }
}

function getSearchHref(result: GlobalSearchResult) {
  switch (result.type) {
    case "ORGANISATION":
      return `/organisation/${result.id}`;
    case "DEPARTEMENT":
      return `/departement/${result.id}`;
    case "SALLE":
    case "INDEPENDANT":
      return `/salle/${result.id}`;
    case "COURSE":
      return `/course/${result.id}/live`;
    default:
      return "/dashboard";
  }
}

function getSearchIcon(type: GlobalSearchResultType) {
  return type === "COURSE" ? BookOpen : Folder;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return <>{text}</>;
  }

  const matcher = new RegExp(`(${escapeRegExp(normalizedQuery)})`, "ig");
  const parts = text.split(matcher);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === normalizedQuery.toLowerCase();

        if (!isMatch) {
          return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
        }

        return (
          <mark
            key={`${part}-${index}`}
            className="rounded-sm bg-amber-200 px-1 text-foreground"
          >
            {part}
          </mark>
        );
      })}
    </>
  );
}

function SearchSection({
  section,
  query,
  activeKey,
  onHoverItem,
  onSelect,
}: {
  section: SearchSectionData;
  query: string;
  activeKey: string | null;
  onHoverItem: (key: string) => void;
  onSelect: () => void;
}) {
  return (
    <section className="space-y-2">
      <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {section.title}
      </div>
      <div className="grid gap-2">
        {section.items.map((item) => {
          const Icon = item.icon;
          const isActive = activeKey === item.key;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={[
                "flex items-center gap-3 rounded-xl border px-3 py-3 text-sm transition",
                isActive
                  ? "border-border bg-secondary/80"
                  : "border-transparent hover:border-border hover:bg-secondary/60",
              ].join(" ")}
              onClick={onSelect}
              onMouseEnter={() => onHoverItem(item.key)}
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">
                  <HighlightText text={item.label} query={query} />
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  <HighlightText text={item.hint} query={query} />
                </span>
              </div>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                {item.badge}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function OrgSearchOverlay({
  open,
  entries,
  onClose,
}: OrgSearchOverlayProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultQuery, setResultQuery] = useState("");
  const [errorQuery, setErrorQuery] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const normalizedQuery = query.trim();
  const deferredQuery = useDeferredValue(normalizedQuery);

  const handleClose = () => {
    setQuery("");
    setSearchResults([]);
    setLoading(false);
    setError(null);
    setResultQuery("");
    setErrorQuery("");
    setActiveKey(null);
    onClose?.();
  };

  const handleNavigate = (href: string) => {
    handleClose();
    startTransition(() => {
      router.push(href);
    });
  };

  useEffect(() => {
    if (!open) return;
    if (deferredQuery.length < MIN_BACKEND_QUERY_LENGTH) return;

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      setErrorQuery("");

      const response = await SearchService.globalSearch(deferredQuery);

      if (cancelled) return;

      if (response.status === 200 && Array.isArray(response.data)) {
        setSearchResults(response.data);
        setResultQuery(deferredQuery);
        setError(null);
        setErrorQuery("");
      } else {
        setSearchResults([]);
        setResultQuery(deferredQuery);
        setError(response.error ?? "Impossible de lancer la recherche.");
        setErrorQuery(deferredQuery);
      }

      setLoading(false);
    }, SEARCH_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [deferredQuery, open]);

  const filteredEntries = useMemo(() => {
    const q = normalizedQuery.toLowerCase();
    if (!q) return entries;

    return entries.filter((entry) => {
      return (
        entry.label.toLowerCase().includes(q) ||
        entry.hint.toLowerCase().includes(q) ||
        entry.href.toLowerCase().includes(q)
      );
    });
  }, [entries, normalizedQuery]);

  const navigationItems = useMemo<SearchOverlayItem[]>(
    () =>
      filteredEntries.map((entry) => ({
        key: `nav-${entry.href}`,
        label: entry.label,
        hint: entry.hint,
        href: entry.href,
        badge: "Page",
        icon: entry.icon,
      })),
    [filteredEntries],
  );

  const contentItems = useMemo<SearchOverlayItem[]>(
    () =>
      searchResults.map((result) => ({
        key: `result-${result.type}-${result.id}`,
        label: result.name,
        hint: getSearchTypeLabel(result.type),
        href: getSearchHref(result),
        badge: "Ouvrir",
        icon: getSearchIcon(result.type),
      })),
    [searchResults],
  );

  const hasFreshContent = resultQuery === deferredQuery;
  const visibleContentItems = useMemo(
    () => (hasFreshContent ? contentItems : []),
    [contentItems, hasFreshContent],
  );
  const visibleError = errorQuery === deferredQuery ? error : null;
  const isWaitingForSearch =
    normalizedQuery.length >= MIN_BACKEND_QUERY_LENGTH &&
    !loading &&
    !visibleError &&
    !hasFreshContent;

  const contentSections = useMemo<SearchSectionData[]>(() => {
    const grouped = new Map<string, SearchOverlayItem[]>();

    for (const item of visibleContentItems) {
      const bucket = grouped.get(item.hint) ?? [];
      bucket.push(item);
      grouped.set(item.hint, bucket);
    }

    return Array.from(grouped.entries()).map(([title, items]) => ({
      key: `content-${title}`,
      title,
      items,
    }));
  }, [visibleContentItems]);

  const sections = useMemo<SearchSectionData[]>(() => {
    const nextSections: SearchSectionData[] = [];

    if (normalizedQuery.length === 0) {
      if (navigationItems.length > 0) {
        nextSections.push({
          key: "shortcuts",
          title: "Raccourcis",
          items: navigationItems,
        });
      }
      return nextSections;
    }

    if (navigationItems.length > 0) {
      nextSections.push({
        key: "navigation",
        title: "Navigation",
        items: navigationItems,
      });
    }

    for (const section of contentSections) {
      nextSections.push(section);
    }

    return nextSections;
  }, [contentSections, navigationItems, normalizedQuery.length]);

  const selectableItems = useMemo(
    () => sections.flatMap((section) => section.items),
    [sections],
  );

  const activeIndex = useMemo(() => {
    if (selectableItems.length === 0) return -1;
    if (!activeKey) return 0;

    const index = selectableItems.findIndex((item) => item.key === activeKey);
    return index >= 0 ? index : 0;
  }, [activeKey, selectableItems]);

  const activeItem = activeIndex >= 0 ? selectableItems[activeIndex] : null;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="mt-16 w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-background/95 shadow-2xl backdrop-blur"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveKey(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                handleClose();
                return;
              }

              if (e.key === "ArrowDown") {
                if (selectableItems.length === 0) return;
                e.preventDefault();
                const nextIndex =
                  activeIndex >= 0
                    ? (activeIndex + 1) % selectableItems.length
                    : 0;
                setActiveKey(selectableItems[nextIndex].key);
                return;
              }

              if (e.key === "ArrowUp") {
                if (selectableItems.length === 0) return;
                e.preventDefault();
                const nextIndex =
                  activeIndex >= 0
                    ? (activeIndex - 1 + selectableItems.length) %
                      selectableItems.length
                    : selectableItems.length - 1;
                setActiveKey(selectableItems[nextIndex].key);
                return;
              }

              if (e.key === "Enter" && activeItem) {
                e.preventDefault();
                handleNavigate(activeItem.href);
              }
            }}
            placeholder="Rechercher une entite, un cours ou une page"
            className="h-10 flex-1 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
          />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="border-b border-border px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Utilisez les fleches puis Entree pour ouvrir rapidement
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-3">
          {sections.map((section) => (
            <SearchSection
              key={section.key}
              section={section}
              query={normalizedQuery}
              activeKey={activeItem?.key ?? null}
              onHoverItem={setActiveKey}
              onSelect={handleClose}
            />
          ))}

          {normalizedQuery.length > 0 &&
            normalizedQuery.length < MIN_BACKEND_QUERY_LENGTH && (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Tapez au moins {MIN_BACKEND_QUERY_LENGTH} caracteres pour
                rechercher dans vos entites et vos cours.
              </p>
            )}

          {loading || isWaitingForSearch ? (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Recherche en cours...
            </div>
          ) : null}

          {visibleError ? (
            <p className="px-3 py-2 text-sm text-destructive">{visibleError}</p>
          ) : null}

          {normalizedQuery.length >= MIN_BACKEND_QUERY_LENGTH &&
          !loading &&
          !isWaitingForSearch &&
          !visibleError &&
          visibleContentItems.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Aucun resultat trouve pour cette recherche.
            </p>
          ) : null}

          {normalizedQuery.length === 0 && sections.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Aucun raccourci disponible pour le moment.
            </p>
          ) : null}

          {normalizedQuery.length > 0 &&
          navigationItems.length === 0 &&
          normalizedQuery.length < MIN_BACKEND_QUERY_LENGTH ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Aucun raccourci ne correspond a cette recherche.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronsLeft, ChevronsRight, Settings2, X } from "lucide-react";
import { Button } from "../../ui/button";
import { CountBadge } from "../../ui/count-badge";
import type { NavItem } from "./OrgLayout";

interface OrgSidebarProps {
  navItems: NavItem[];
  settingsHref?: string;
  sidebarOpen: boolean;
  collapsed: boolean;
  isActive?: (href: string) => boolean;
  onCloseSidebar?: () => void;
  onToggleCollapse?: () => void;
}

export function OrgSidebar({
  navItems,
  settingsHref = "/settings",
  sidebarOpen,
  collapsed,
  isActive,
  onCloseSidebar,
  onToggleCollapse,
}: OrgSidebarProps) {
  const handleClose = () => {
    onCloseSidebar?.();
  };

  const checkActive = (href: string) => {
    return isActive ? isActive(href) : false;
  };

  const settingsActive = checkActive(settingsHref);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={handleClose}
        />
      )}

      <aside
        className={[
          "fixed inset-x-0 bottom-0 z-40 flex max-h-[80vh] w-full transform flex-col overflow-y-auto rounded-t-3xl border-t border-sidebar-border bg-sidebar px-4 py-6 shadow-2xl transition-all duration-300 ease-in-out",
          "md:fixed md:inset-y-0 md:left-0 md:h-screen md:max-h-none md:translate-y-0 md:overflow-hidden md:rounded-none md:border-r md:border-t-0 md:shadow-none",
          collapsed ? "md:w-[72px] md:px-2" : "md:w-64 md:px-4",
          sidebarOpen ? "translate-y-0" : "translate-y-full md:translate-y-0",
        ].join(" ")}
      >
        {/* Header */}
        <div
          className={[
            "mb-6 flex items-center px-2",
            collapsed ? "md:justify-center md:px-0" : "justify-between",
          ].join(" ")}
        >
          {/* Logo — visible on desktop when expanded */}
          <div
            className={[
              "hidden items-center gap-2 overflow-hidden transition-all duration-300",
              collapsed ? "md:hidden" : "md:flex",
            ].join(" ")}
          >
            <span className="relative block h-7 w-[132px]">
              <Image
                src="/logo_blanc.svg"
                alt=""
                fill
                priority
                className="object-cover object-top"
              />
            </span>
          </div>

          {/* Collapse toggle — desktop only */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground md:flex"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Ouvrir le menu" : "Reduire le menu"}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </Button>

          {/* Close button — mobile only */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = checkActive(item.href);
            const badgeCount =
              typeof item.badgeCount === "number" && item.badgeCount > 0
                ? item.badgeCount
                : null;

            return (
              <Link key={item.href} href={item.href} onClick={handleClose}>
                <div
                  className={[
                    "group relative mb-2 flex items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary",
                    collapsed ? "md:justify-center md:px-0" : "",
                  ].join(" ")}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />

                  <span
                    className={[
                      "truncate leading-normal transition-all duration-300",
                      collapsed ? "md:hidden" : "",
                    ].join(" ")}
                  >
                    {item.label}
                  </span>

                  {/* Badge — repositioned when collapsed */}
                  {badgeCount !== null && !collapsed && (
                    <CountBadge count={badgeCount} className="ml-auto" />
                  )}
                  {badgeCount !== null && collapsed && (
                    <CountBadge
                      count={badgeCount}
                      className="absolute -right-1 -top-1 hidden scale-75 md:flex"
                    />
                  )}

                  {/* Tooltip on hover when collapsed */}
                  {collapsed && (
                    <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md group-hover:md:block">
                      {item.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Settings link */}
        <div className={["mt-4", collapsed ? "md:px-0" : "px-2"].join(" ")}>
          <Link href={settingsHref} onClick={handleClose}>
            <div
              className={[
                "group relative flex w-full items-center gap-3 rounded-full px-3 py-2 text-sm transition-colors",
                settingsActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary",
                collapsed ? "md:justify-center md:px-0" : "",
              ].join(" ")}
              title={collapsed ? "Parametres" : undefined}
            >
              <Settings2 className="h-4 w-4 shrink-0" />

              <span
                className={[
                  "truncate leading-none transition-all duration-300",
                  collapsed ? "md:hidden" : "",
                ].join(" ")}
              >
                Parametres
              </span>

              {/* Tooltip when collapsed */}
              {collapsed && (
                <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md group-hover:md:block">
                  Parametres
                </span>
              )}
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}

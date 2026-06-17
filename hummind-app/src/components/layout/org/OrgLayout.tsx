"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Folder,
  LayoutDashboard,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { getPathWithoutLocale, isImmersiveOrganisationPath } from "../../../lib/immersiveRoutes";
import { OrgSidebar } from "./OrgSidebar";
import { OrgTopbar } from "./OrgTopbar";
import { OrgSearchOverlay } from "./OrgSearchOverlay";
import { useAppSelector, useAppDispatch } from "../../../store/hooks";
import { toggleSidebarCollapsed } from "../../../store/slices/uiSlice";
import { EntityService } from "../../../services/entity.service";
import {
  NOTIFICATIONS_UPDATED_EVENT,
  NotificationService,
} from "../../../services/notification.service";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badgeCount?: number;
}

export interface QuickSearchEntry {
  label: string;
  href: string;
  hint: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface OrgLayoutProps {
  children: ReactNode;
}

const baseNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Organisation",
    href: "/organisation",
    icon: Folder,
  },
  {
    label: "Gestion d'acces",
    href: "/access",
    icon: ShieldCheck,
  },
];

const quickSearchEntries: QuickSearchEntry[] = [
  {
    label: "Aller au dashboard",
    href: "/dashboard",
    hint: "Vue d'ensemble de l'espace organisation",
    icon: LayoutDashboard,
  },
  {
    label: "Mes organisations",
    href: "/organisation",
    hint: "Retrouver vos organisations, departements et salles",
    icon: Folder,
  },
  {
    label: "Gestion d'acces",
    href: "/access",
    hint: "Invitations, demandes d'acces et moderation",
    icon: ShieldCheck,
  },
  {
    label: "Mes cours",
    href: "/course",
    hint: "Acceder a la liste de vos cours",
    icon: BookOpen,
  },
  {
    label: "Notifications",
    href: "/notifications",
    hint: "Voir les alertes et activites recentes",
    icon: Bell,
  },
  {
    label: "Parametres du compte",
    href: "/settings",
    hint: "Mettre a jour le profil et la securite",
    icon: Settings2,
  },
];

export function OrgLayout({ children }: OrgLayoutProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingAccessCount, setPendingAccessCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const user = useAppSelector((state) => state.user.user);
  const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const pathWithoutLocale = useMemo(() => getPathWithoutLocale(pathname), [pathname]);
  const isImmersiveCourseLive = isImmersiveOrganisationPath(pathname);

  const refreshAccessBadge = useCallback(async () => {
    const res = await EntityService.getAllInvitation();

    if (res.status !== 200 || !Array.isArray(res.data)) {
      setPendingAccessCount(0);
      return;
    }

    setPendingAccessCount(res.data.length);
  }, []);

  const refreshNotificationsBadge = useCallback(async () => {
    const res = await NotificationService.counts();

    if (res.status !== 200 || !res.data) {
      setNotificationsCount(0);
      return;
    }

    setNotificationsCount(res.data.unread ?? 0);
  }, []);

  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() !== "k") return;

      event.preventDefault();
      setSearchOpen((current) => !current);
    };

    window.addEventListener("keydown", handleSearchShortcut);
    return () => {
      window.removeEventListener("keydown", handleSearchShortcut);
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshAccessBadge();
      void refreshNotificationsBadge();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pathname, refreshAccessBadge, refreshNotificationsBadge]);

  useEffect(() => {
    const handleAccessRequestsUpdated = () => {
      void refreshAccessBadge();
    };

    window.addEventListener("access-requests-updated", handleAccessRequestsUpdated);

    return () => {
      window.removeEventListener(
        "access-requests-updated",
        handleAccessRequestsUpdated,
      );
    };
  }, [refreshAccessBadge]);

  useEffect(() => {
    const handleNotificationsUpdated = () => {
      void refreshNotificationsBadge();
    };

    window.addEventListener(
      NOTIFICATIONS_UPDATED_EVENT,
      handleNotificationsUpdated,
    );

    return () => {
      window.removeEventListener(
        NOTIFICATIONS_UPDATED_EVENT,
        handleNotificationsUpdated,
      );
    };
  }, [refreshNotificationsBadge]);

  const isActive = (href: string) => {
    return (
      pathWithoutLocale === href || pathWithoutLocale.startsWith(href + "/")
    );
  };

  const searchableEntries = useMemo(() => quickSearchEntries, []);
  const navItems = useMemo(
    () =>
      baseNavItems.map((item) =>
        item.href === "/access"
          ? {
              ...item,
              badgeCount: pendingAccessCount > 0 ? pendingAccessCount : undefined,
            }
            : item,
      ),
    [pendingAccessCount],
  );

  return (
    <div className="flex min-h-dvh w-full overflow-x-hidden bg-background text-foreground">
      <OrgSidebar
        navItems={navItems}
        settingsHref="/settings"
        sidebarOpen={sidebarOpen}
        collapsed={sidebarCollapsed}
        isActive={isActive}
        onCloseSidebar={() => setSidebarOpen(false)}
        onToggleCollapse={() => dispatch(toggleSidebarCollapsed())}
      />

      <div
        className={[
          "flex h-dvh min-w-0 flex-1 flex-col overflow-hidden transition-[margin-left] duration-300 ease-in-out",
          sidebarCollapsed ? "md:ml-[72px]" : "md:ml-64",
        ].join(" ")}
      >
        <div className="shrink-0 z-20">
          <OrgTopbar
            username={user?.firstname}
            subtitle={user?.email}
            sidebarCollapsed={sidebarCollapsed}
            onOpenSidebar={() => setSidebarOpen(true)}
            onOpenSearch={() => setSearchOpen(true)}
            onToggleSidebarCollapse={() => dispatch(toggleSidebarCollapsed())}
            notificationsCount={notificationsCount}
          />
        </div>

        <main
          className={[
            "flex-1 bg-background",
            isImmersiveCourseLive
              ? "overflow-hidden p-0"
              : "overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5 md:px-8 md:py-6",
          ].join(" ")}
        >
          {children}
        </main>

        <OrgSearchOverlay
          open={searchOpen}
          entries={searchableEntries}
          onClose={() => setSearchOpen(false)}
        />
      </div>
    </div>
  );
}

export default OrgLayout;

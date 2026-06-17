"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useAppSelector } from "../../../store/hooks";
import { getPathWithoutLocale } from "../../../lib/immersiveRoutes";
import {
  NOTIFICATIONS_UPDATED_EVENT,
  NotificationService,
} from "../../../services/notification.service";
import { LearnerSidebar } from "./LearnerSidebar";
import { LearnerTopbar } from "./LearnerTopbar";

interface LearnerLayoutProps {
  children: ReactNode;
}

const IMMERSIVE_PATTERNS = [/\/learner\/course\/[^/]+\/live\/?$/];

function isImmersivePath(pathname: string) {
  const path = getPathWithoutLocale(pathname);
  return IMMERSIVE_PATTERNS.some((p) => p.test(path));
}

export function LearnerLayout({ children }: LearnerLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const user = useAppSelector((state) => state.user.user);
  const pathWithoutLocale = useMemo(
    () => getPathWithoutLocale(pathname),
    [pathname],
  );
  const isLive = isImmersivePath(pathname);

  const refreshNotifications = useCallback(async () => {
    const res = await NotificationService.counts();
    if (res.status === 200 && res.data) {
      setNotificationsCount(res.data.unread ?? 0);
    }
  }, []);

  useEffect(() => {
    void refreshNotifications();
  }, [pathname, refreshNotifications]);

  useEffect(() => {
    const handler = () => void refreshNotifications();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handler);
    return () =>
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handler);
  }, [refreshNotifications]);

  // ─── Immersive mode (live) → no sidebar/topbar, full screen ───
  if (isLive) {
    return (
      <div className="h-dvh w-full overflow-hidden bg-background text-foreground">
        {children}
      </div>
    );
  }

  // ─── Normal layout ───
  return (
    <div className="flex min-h-dvh w-full overflow-x-hidden bg-background text-foreground">
      <LearnerSidebar
        sidebarOpen={sidebarOpen}
        currentPath={pathWithoutLocale}
        onCloseSidebar={() => setSidebarOpen(false)}
      />

      <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden md:ml-56">
        <div className="shrink-0 z-20">
          <LearnerTopbar
            username={user?.firstname}
            subtitle={user?.email}
            notificationsCount={notificationsCount}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5 md:px-8 md:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default LearnerLayout;

"use client";

import { useMemo, type ReactNode } from "react";
import type { AbstractIntlMessages } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "sonner";
import { TooltipProvider } from "../components/ui/tooltip";
import { usePageTracking } from "../hooks/usePageTracking";
import { PosthogClientProvider } from "./PosthogProvider";
import { ReduxProvider } from "./ReduxProvider";
import type { UserInfo } from "../store/slices/userSlice";

type AppUserLike =
  | {
      id?: string;
      email?: string;
      firstname?: string;
      lastname?: string;
      role?: string | null;
    }
  | null;

interface AppProvidersProps {
  children: ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
  user: AppUserLike;
}

function normalizeUser(user: AppUserLike): UserInfo | null {
  if (!user?.id || !user.email || !user.firstname || !user.lastname) {
    return null;
  }

  const role =
    user.role === "ROOT" || user.role === "ADMIN" || user.role === "USER"
      ? user.role
      : null;

  return {
    id: user.id,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    role,
  };
}

export function AppProviders({
  children,
  locale,
  messages,
  user,
}: AppProvidersProps) {
  usePageTracking();
  const normalizedUser = useMemo(
    () => normalizeUser(user),
    [user],
  );

  return (
    <PosthogClientProvider>
      <ReduxProvider preloadedUser={normalizedUser}>
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone="Africa/Porto-Novo"
        >
          <TooltipProvider>{children}</TooltipProvider>
        </NextIntlClientProvider>

        <Toaster richColors closeButton position="top-center" />
      </ReduxProvider>
    </PosthogClientProvider>
  );
}

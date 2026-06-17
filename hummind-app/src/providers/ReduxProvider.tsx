"use client";

import { useEffect, useMemo, useState } from "react";
import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { makeStore, type AppStore } from "../store";
import { setUser, type UserInfo } from "../store/slices/userSlice";

export function ReduxProvider({
  children,
  preloadedUser,
}: {
  children: ReactNode;
  preloadedUser?: UserInfo | null;
}) {
  const userId = preloadedUser?.id ?? null;
  const userEmail = preloadedUser?.email ?? null;
  const userFirstname = preloadedUser?.firstname ?? null;
  const userLastname = preloadedUser?.lastname ?? null;
  const userRole = preloadedUser?.role ?? null;

  const stableUser = useMemo(
    () =>
      userId && userEmail && userFirstname && userLastname
        ? {
            id: userId,
            email: userEmail,
            firstname: userFirstname,
            lastname: userLastname,
            role: userRole,
          }
        : null,
    [userEmail, userFirstname, userId, userLastname, userRole],
  );

  const [store] = useState<AppStore>(() =>
    makeStore({
      user: { user: preloadedUser ?? null },
    }),
  );

  useEffect(() => {
    store.dispatch(setUser(stableUser));
  }, [stableUser, store]);

  return <Provider store={store}>{children}</Provider>;
}

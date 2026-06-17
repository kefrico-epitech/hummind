"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle, Menu, Search } from "lucide-react";
import { Button } from "../../ui/button";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { CountBadge } from "../../ui/count-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { AuthService } from "../../../services/auth.service";
import { toast } from "../../../lib/notify";

interface LearnerTopbarProps {
  username?: string;
  subtitle?: string;
  notificationsCount?: number;
  onOpenSidebar: () => void;
  onOpenSearch?: () => void;
}

export function LearnerTopbar({
  username = "Utilisateur",
  subtitle = "Espace apprenant",
  notificationsCount = 0,
  onOpenSidebar,
  onOpenSearch,
}: LearnerTopbarProps) {
  const router = useRouter();
  const initial = username.charAt(0)?.toUpperCase() || "U";

  const logout = async () => {
    try {
      await AuthService.signOut();
      toast.success("Déconnexion réussie");
      router.replace("/login");
    } catch {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  return (
    <header className="grid shrink-0 grid-cols-[1fr_auto] items-center gap-3 border-b border-border bg-background/80 px-4 py-2.5 backdrop-blur-md md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] md:px-8 md:py-3">
      {/* Left */}
      <div className="flex min-w-0 items-center gap-2.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full md:hidden"
          onClick={onOpenSidebar}
        >
          <Menu className="h-4 w-4" />
        </Button>

        <h1 className="truncate font-display text-lg font-semibold md:text-xl">
          Bienvenue {username}{" "}
          <span className="inline-block" role="img" aria-label="wave">
            👋
          </span>
        </h1>
      </div>

      {/* Center: search bar (desktop) */}
      <div className="hidden md:flex md:justify-center">
        <Button
          variant="auth"
          className="h-9 w-full max-w-md items-center justify-start gap-2 rounded-full bg-white/10 px-3 text-[13px] text-muted-foreground hover:bg-secondary/80 md:inline-flex"
          onClick={onOpenSearch}
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">Recherche</span>
        </Button>
      </div>

      {/* Right */}
      <div className="flex min-w-0 items-center justify-end gap-2 md:gap-3">
        {/* Search — mobile only */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full md:hidden"
          onClick={onOpenSearch}
        >
          <Search className="h-3.5 w-3.5" />
        </Button>

        {/* Notifications */}
        <Link href="/notifications">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 shrink-0 rounded-full"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {notificationsCount > 0 && (
              <CountBadge
                count={notificationsCount}
                className="absolute -right-1 -top-1 min-w-5"
              />
            )}
          </Button>
        </Link>

        {/* Activity */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full"
          aria-label="Activité"
        >
          <CheckCircle className="h-4 w-4" />
        </Button>

        {/* Avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 cursor-pointer rounded-full border bg-sidebar p-0"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-success text-xs text-success-foreground">
                  {initial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-64 rounded-2xl bg-sidebar p-2 shadow-lg"
          >
            <DropdownMenuLabel className="flex flex-row gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-success text-xs text-success-foreground">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{username}</span>
                <span className="text-xs text-muted-foreground">
                  {subtitle}
                </span>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link
                href="/switch-org"
                className="my-4 flex cursor-pointer items-center hover:text-primary"
              >
                Devenir Organisateur
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/learner/settings"
                className="mb-4 flex cursor-pointer items-center hover:text-primary"
              >
                Paramètres du compte
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/support"
                className="mb-4 flex cursor-pointer items-center hover:text-primary"
              >
                Aide et support
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={logout}
              className="mb-2 flex items-center hover:text-primary"
            >
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

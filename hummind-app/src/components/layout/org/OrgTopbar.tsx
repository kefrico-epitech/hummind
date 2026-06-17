"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { toast } from "../../../lib/notify";

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

interface OrgTopbarProps {
  username?: string;
  subtitle?: string;
  notificationsCount?: number;
  sidebarCollapsed?: boolean;
  onOpenSidebar?: () => void;
  onOpenSearch?: () => void;
  onToggleSidebarCollapse?: () => void;
}

export function OrgTopbar({
  username = "Utilisateur",
  subtitle = "Espace organisation",
  notificationsCount = 0,
  sidebarCollapsed = false,
  onOpenSidebar,
  onOpenSearch,
  onToggleSidebarCollapse,
}: OrgTopbarProps) {
  const router = useRouter();
  const initial = username.charAt(0)?.toUpperCase() || "U";

  const logout = async () => {
    try {
      await AuthService.signOut();
      toast.success("Deconnexion reussie");
      router.replace("/login");
    } catch {
      toast.error("Erreur lors de la deconnexion");
    }
  };

  return (
    <header className="grid shrink-0 grid-cols-[1fr_auto] items-center gap-3 border-b border-border bg-background/80 px-4 py-2.5 backdrop-blur-md md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] md:px-8 md:py-3">
      {/* Left: hamburger + bienvenue */}
      <div className="flex min-w-0 items-center gap-2.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full md:hidden"
          onClick={onOpenSidebar}
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="hidden min-w-0 md:block">
          <p className="truncate font-display text-sm md:text-base">
            Bienvenue {username}
          </p>
        </div>
      </div>

      {/* Center: search bar (desktop) */}
      <div className="hidden md:flex md:justify-center">
        <Button
          variant="auth"
          className="h-9 w-full max-w-md items-center justify-start gap-2 rounded-full bg-white/10 px-3 text-[13px] text-muted-foreground hover:bg-secondary/80 md:inline-flex"
          onClick={onOpenSearch}
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">
            Rechercher une entité, un cours ou une page
          </span>
          <span className="rounded-full bg-background px-2 py-0.5 text-[10px]">
            Ctrl + K
          </span>
        </Button>
      </div>

      {/* Right: actions */}
      <div className="flex min-w-0 items-center justify-end gap-2.5 md:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full md:hidden"
          onClick={onOpenSearch}
        >
          <Search className="h-3.5 w-3.5" />
        </Button>

        <Link href="/notifications">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 shrink-0 rounded-full bg-background hover:bg-sidebar"
            aria-label="Ouvrir les notifications"
          >
            <Bell className="h-3.5 w-3.5" />
            {notificationsCount > 0 && (
              <CountBadge
                count={notificationsCount}
                className="absolute -right-1 -top-1 min-w-5"
              />
            )}
          </Button>
        </Link>

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
                href="/switch"
                className="my-4 flex items-center cursor-pointer hover:text-primary"
              >
                Devenir participant
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/settings"
                className="mb-4 flex items-center cursor-pointer hover:text-primary"
              >
                Parametre de compte
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/support"
                className="mb-4 flex items-center cursor-pointer hover:text-primary"
              >
                Aide et support
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={logout}
              className="mb-2 flex items-center hover:text-primary"
            >
              Deconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}


"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, LogOut, Settings2, Sparkles, X } from "lucide-react";
import { Button } from "../../ui/button";
import { AuthService } from "../../../services/auth.service";
import { toast } from "../../../lib/notify";

interface LearnerSidebarProps {
  sidebarOpen: boolean;
  currentPath: string;
  onCloseSidebar: () => void;
}

const navItems = [
  { label: "Modules de cours", href: "/learner", icon: BookOpen },
];

export function LearnerSidebar({
  sidebarOpen,
  currentPath,
  onCloseSidebar,
}: LearnerSidebarProps) {
  const router = useRouter();

  const isActive = (href: string) =>
    currentPath === href || (href !== "/learner" && currentPath.startsWith(href + "/"));

  const isModulesActive =
    currentPath === "/learner" || currentPath.startsWith("/learner/course");

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
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onCloseSidebar}
        />
      )}

      <aside
        className={[
          "fixed inset-x-0 bottom-0 z-40 flex max-h-[80vh] w-full transform flex-col overflow-y-auto rounded-t-3xl border-t border-sidebar-border bg-sidebar px-4 py-6 shadow-2xl transition-transform duration-300",
          "md:fixed md:inset-y-0 md:left-0 md:h-screen md:max-h-none md:w-56 md:translate-y-0 md:overflow-hidden md:rounded-none md:border-r md:border-t-0 md:shadow-none",
          sidebarOpen ? "translate-y-0" : "translate-y-full md:translate-y-0",
        ].join(" ")}
      >
        {/* Header */}
        <div className="mb-8 flex items-center justify-between px-2">
          <div className="hidden md:block">
            <span className="relative block h-7 w-[132px]">
              <Image
                src="/logo_blanc.svg"
                alt="HummindOS"
                fill
                priority
                className="object-cover object-top"
              />
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onCloseSidebar}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/learner" ? isModulesActive : isActive(item.href);

            return (
              <Link key={item.href} href={item.href} onClick={onCloseSidebar}>
                <div
                  className={[
                    "mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary/60",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="mt-4 space-y-1 border-t border-sidebar-border pt-4">
          <Link href="/learner/settings" onClick={onCloseSidebar}>
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/60">
              <Settings2 className="h-4 w-4 shrink-0" />
              <span>Paramètres</span>
            </div>
          </Link>

          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/60"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}

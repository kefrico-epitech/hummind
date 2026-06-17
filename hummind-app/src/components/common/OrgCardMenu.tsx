"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { EntityService } from "../../services/entity.service";
import { toast } from "../../lib/notify";
import type { Entity } from "../../dto/entity.dto";

type Props = {
  org: Entity;
  type?: "organisation" | "departement" | "salle";
  onArchived?: () => void | Promise<void>;
  redirectTo?: string;
};

export function OrgCardMenu({
  org,
  type = "organisation",
  onArchived,
  redirectTo,
}: Props) {
  const router = useRouter();
  const basePath = `/${type}`;

  const handleArchive = async () => {
    try {
      const res = await EntityService.archive(org.id);
      if (res.status === 200) {
        toast.success("Element archive");

        if (onArchived) {
          await onArchived();
          return;
        }

        if (redirectTo) {
          router.replace(redirectTo);
          return;
        }

        router.replace(basePath);
      } else {
        toast.error("Erreur lors de l'archivage");
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full border border-white/10 bg-white/8 text-white/75 hover:bg-white/15 hover:text-white"
          aria-label="Actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[min(220px,calc(100vw-1rem))] rounded-xl border border-white/10 bg-[#2D2D2D] p-1 text-white/90"
      >
        <DropdownMenuItem asChild className="focus:bg-white/10">
          <Link
            href={`${basePath}/${org.id}/edit`}
            className="flex items-center gap-2 py-2 text-sm"
          >
            Modifier
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleArchive}
          className="cursor-pointer py-2 text-sm focus:bg-white/10"
        >
          Archiver
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="focus:bg-red-500/10">
          <Link
            href={`${basePath}/${org.id}/delete`}
            className="flex cursor-pointer items-center gap-2 py-2 text-sm text-red-400"
          >
            Supprimer
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


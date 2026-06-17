"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import type { OrgCard } from "./ArchivesTab";

export function UnarchiveOrgDialog({
  org,
  open,
  onOpenChange,
  loading,
  onConfirm,
}: {
  org: OrgCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#111214] text-white">
        <DialogHeader>
          <DialogTitle>Désarchiver cette organisation ?</DialogTitle>
          <DialogDescription className="text-white/60">
            Elle réapparaîtra dans votre liste active et redeviendra accessible aux membres.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-semibold text-white/90">{org?.name}</p>
          <p className="mt-1 line-clamp-2 text-xs text-white/50">{org?.description}</p>
        </div>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="mr-4 border-white/10 bg-transparent text-white/80 hover:bg-white/5"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            className="bg-primary/90 text-primary-foreground hover:bg-primary"
            disabled={loading}
            loading={loading}
            loadingLabel="Desarchivage..."
            onClick={onConfirm}
          >
            Désarchiver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


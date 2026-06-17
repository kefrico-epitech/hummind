"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../../ui/dialog"; // chemin selon ton setup shadcn
import { useAppSelector } from "../../../store/hooks";

export function ExtractPreviewDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const extractFromCourse = useAppSelector((state) => state.course.extractedData);
  const extractFromSetup = useAppSelector((state) => state.courseSetup.extractedData);
  const extract = extractFromSetup || extractFromCourse;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aperçu de l’extrait</DialogTitle>
          <DialogDescription>
            Voici le contenu extrait du document importé.
          </DialogDescription>
        </DialogHeader>

        {extract ? (
          <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
            {extract}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun extrait disponible pour le moment.
          </p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Fermer
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../ui/tooltip";
import { ArrowRight, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import SalleCardList from "./SalleCardList";
import { CreateCategorieDialog } from "./form/CreateCategorieDialog";
import { EntityService } from "../../../services/entity.service";
import { toast } from "../../../lib/notify";
import { Entity } from "../../../dto/entity.dto";

type CategoryEntityLink = { entity: Entity };
type CategoryData = {
  id: string;
  name: string;
  entityLinks: CategoryEntityLink[];
};

interface CategoryDialogProps {
  category: CategoryData;
  categoryToEdit?: CategoryData;
  entityId: string;
  entities: Entity[];
  onSaved?: () => void;
  editable?: boolean;
}

export function CategoryDialog({
  category,
  categoryToEdit,
  entityId,
  entities,
  onSaved,
  editable = true,
}: CategoryDialogProps) {
  const count = category.entityLinks?.length ?? 0;
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!category?.id || category.id === "__uncategorized__") return;
    if (!confirm(`Supprimer la categorie "${category.name}" ?`)) return;

    setDeleting(true);
    try {
      const { error } = await EntityService.deleteCategory(category.id);
      if (error) {
        toast.error("Impossible de supprimer la categorie.");
        return;
      }
      toast.success("Categorie supprimee avec succes.");
      onSaved?.();
    } catch {
      toast.error("Une erreur inattendue est survenue.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-white/90">{category.name}</h3>
          <Badge variant="secondary" className="bg-white/10 text-white/80">
            {count} salle{count > 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Dialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tout explorer</p>
              </TooltipContent>
            </Tooltip>

            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{`Toutes les entites de ${category.name}`}</DialogTitle>
              </DialogHeader>
              {count > 0 ? (
                <SalleCardList
                  orgs={category.entityLinks.map((link) => link.entity)}
                  onArchived={onSaved}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune entite associee.
                </p>
              )}
            </DialogContent>
          </Dialog>

          {editable && (
            <CreateCategorieDialog
              entityId={entityId}
              entities={entities}
              categoryToEdit={categoryToEdit ?? category}
              onSaved={onSaved}
            >
              <Button
                variant="outline"
                size="sm"
                className="border-white/15 bg-white/5 hover:bg-white/10"
              >
                <Pencil className="mr-1 h-4 w-4" />
                Modifier
              </Button>
            </CreateCategorieDialog>
          )}

          {editable && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
            >
              {deleting ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-1 h-4 w-4" />
              )}
              Supprimer
            </Button>
          )}
        </div>
      </div>

      {count > 0 ? (
        <SalleCardList
          orgs={category.entityLinks.map((link) => link.entity)}
          onArchived={onSaved}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Aucune salle associee.</p>
      )}
    </div>
  );
}


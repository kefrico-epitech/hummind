"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Folder, Loader2, Pencil } from "lucide-react";
import { toast } from "../../../../lib/notify";

import { Button } from "../../../ui/button";
import { Checkbox } from "../../../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../ui/dialog";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Entity } from "../../../../dto/entity.dto";
import { EntityService } from "../../../../services/entity.service";

type CategoryEntityLink = { entity: Entity };
type CategoryData = {
  id: string;
  name: string;
  entityLinks: CategoryEntityLink[];
};

interface CreateCategorieDialogProps {
  entityId: string;
  entities: Entity[];
  categoryToEdit?: CategoryData;
  children?: React.ReactNode;
  onSaved?: () => void;
}

export function CreateCategorieDialog({
  entityId,
  entities,
  categoryToEdit,
  children,
  onSaved,
}: CreateCategorieDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const isEdit = !!categoryToEdit;
  const selectedCount = selected.length;

  useEffect(() => {
    if (!open) return;

    setName(categoryToEdit?.name || "");
    setSelected(categoryToEdit?.entityLinks?.map((l) => l.entity.id) || []);
  }, [open, categoryToEdit]);

  const sortedEntities = useMemo(
    () => [...entities].sort((a, b) => a.name.localeCompare(b.name)),
    [entities],
  );

  const toggleSelection = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Veuillez entrer un nom de categorie.");
      return;
    }

    if (selected.length === 0) {
      toast.error("Selectionnez au moins une salle.");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        const { error } = await EntityService.updateCategory(
          categoryToEdit.id,
          name.trim(),
          selected,
        );
        if (error) {
          toast.error("Impossible de modifier la categorie.");
          return;
        }
        toast.success("Categorie modifiee avec succes.");
      } else {
        const { error } = await EntityService.createCategorie(
          entityId,
          name.trim(),
          selected,
        );
        if (error) {
          toast.error("Impossible de creer la categorie.");
          return;
        }
        toast.success("Categorie creee avec succes.");
      }

      onSaved?.();
      setOpen(false);
    } catch {
      toast.error("Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button className="rounded-full bg-white/10 px-5 text-sm hover:bg-white/15">
            <Folder className="mr-2 h-4 w-4" />
            Creer une categorie
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
            {isEdit ? "Modifier la categorie" : "Creer une categorie"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la categorie</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Licence 1 de droit"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Salles associees</Label>
              <span className="text-xs text-muted-foreground">
                {selectedCount} selection{selectedCount > 1 ? "s" : ""}
              </span>
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] p-3">
              {sortedEntities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune salle disponible.</p>
              ) : (
                sortedEntities.map((room) => {
                  const checked = selected.includes(room.id);
                  return (
                    <label
                      key={room.id}
                      htmlFor={`room-${room.id}`}
                      className="flex w-full items-center justify-between rounded-lg border border-transparent px-3 py-2 text-left transition hover:border-white/15 hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`room-${room.id}`}
                          checked={checked}
                          onCheckedChange={() => toggleSelection(room.id)}
                        />
                        <span className="text-sm">{room.name}</span>
                      </div>

                      {checked && <Check className="h-4 w-4 text-primary" />}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEdit ? "Modification..." : "Creation..."}
                </span>
              ) : isEdit ? (
                "Modifier"
              ) : (
                "Creer"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


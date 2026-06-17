"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "../../../lib/notify";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import type { CreateEntityInput } from "../../../dto/entity.dto";
import { EntityService } from "../../../services/entity.service";

interface EditSalleModalProps {
  id: string;
  onClose: () => void;
}

export default function EditSalleModal({ id, onClose }: EditSalleModalProps) {
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    const fetchSalle = async () => {
      const res = await EntityService.entityById(id);
      if (!mounted) return;

      if (res.status !== 200 || !res.data) {
        toast.error(res.error || "Impossible de charger la salle");
        return;
      }

      setName(res.data.name || "");
    };

    void fetchSalle();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleEditSalle = async () => {
    setErrors({});
    if (!name.trim()) {
      setErrors({ name: ["Le nom est obligatoire"] });
      return;
    }

    setLoading(true);
    try {
      const payload: Partial<CreateEntityInput> = {
        name: name.trim(),
      };

      const res = await EntityService.update(id, payload);

      if (res.status !== 200 && res.status !== 204) {
        toast.error(res.error || "Erreur lors de la mise a jour");
        return;
      }

      toast.success("Salle mise a jour avec succes");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur reseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-4xl bg-[#151515] p-6 text-sm text-white shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex-1 text-center text-lg font-semibold">
            Modifier votre salle
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#222]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la salle</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Entrez le nom de votre salle"
            />
            {errors?.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.join(", ")}</p>
            )}
          </div>

          <Button
            type="button"
            disabled={loading}
            className="h-11 w-full rounded-2xl bg-[#7C6BF5] px-6 text-sm font-medium hover:bg-[#6955eb]"
            onClick={handleEditSalle}
          >
            {loading ? "Mise a jour..." : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
}


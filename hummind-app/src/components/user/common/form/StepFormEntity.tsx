"use client";

import { useState } from "react";
import { CreateEntityInput } from "../../../../dto/entity.dto";
import { EntityService } from "../../../../services/entity.service";
import { toast } from "../../../../lib/notify";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Textarea } from "../../../ui/textarea";
import { ButtonPro } from "../../../common/ButtonPro";

interface StepFormEntityProps {
  type: "organisation" | "departement" | "salle";
  onSuccess: (entityId: string | undefined) => void;
  parentId: string | null;
}

const ENTITY_TYPE_BY_FORM = {
  organisation: "ORGANISATION",
  departement: "DEPARTEMENT",
  salle: "SALLE",
} as const;

export default function StepFormEntity({
  type,
  parentId,
  onSuccess,
}: StepFormEntityProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const validateData = () => {
    if (!name.trim() || !description.trim()) {
      setErrors({ name: ["Le nom et la description sont requis"] });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!validateData()) return;

    setLoading(true);
    try {
      const payload: CreateEntityInput = {
        name,
        description,
        type: ENTITY_TYPE_BY_FORM[type],
        ...(parentId && { parentId }),
      };

      const res = await EntityService.create(payload);

      if (res.status !== 201) {
        throw new Error(res.error || "Une erreur s'est produite");
      }

      toast.success(`Felicitations, vous avez cree avec succes votre ${type} !`);
      onSuccess(res.data?.id);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Impossible de joindre le serveur. Reessayez plus tard.";
      setErrors({});
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nom du {type}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Entrez le nom du ${type}`}
        />
        {errors?.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name.join(", ")}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ajoutez une description..."
        />
      </div>

      <ButtonPro
        onClick={handleSubmit}
        loading={loading}
        loadingLabel="Creation en cours..."
      >
        {`Creer ${type}`}
      </ButtonPro>
    </div>
  );
}


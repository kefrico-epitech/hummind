"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "../../../lib/notify";
import { Button } from "../../ui/button";
import StepGeneral from "../common/StepGeneral";
import type { CreateEntityInput } from "../../../dto/entity.dto";
import { EntityService } from "../../../services/entity.service";

function getEntityAvatarUrl(entity: unknown): string | null {
  if (!entity || typeof entity !== "object") return null;

  const record = entity as Record<string, unknown>;
  return typeof record.avatarUrl === "string" ? record.avatarUrl : null;
}

function EditOrgModal({ id, onClose }: { id: string; onClose?: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    const loadEntity = async () => {
      const res = await EntityService.entityById(id);
      if (!mounted) return;
      if (res.status !== 200 || !res.data) {
        toast.error(res.error || "Impossible de recuperer l'organisation");
        return;
      }

      setName(res.data.name || "");
      setDescription(res.data.description || "");
      setAvatarUrl(getEntityAvatarUrl(res.data));
    };

    void loadEntity();
    return () => {
      mounted = false;
    };
  }, [id]);

  const validateData = () => {
    if (!name.trim() || !description.trim()) {
      setErrors({ name: ["Le nom et la description sont requis"] });
      return false;
    }
    setErrors({});
    return true;
  };

  const onSubmit = async () => {
    setLoading(true);
    setErrors({});

    if (!validateData()) {
      setLoading(false);
      return;
    }

    try {
      const payload: Partial<CreateEntityInput> = { name, description };
      const res = await EntityService.update(id, payload);

      if (res.status !== 200 && res.status !== 204) {
        throw new Error(res.error || "Une erreur s'est produite");
      }

      toast.success("Organisation mise a jour avec succes");
      onClose?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de joindre le serveur. Reessayez plus tard.",
      );
      setErrors({});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-4xl bg-[#151515] p-6 text-sm text-white shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex-1 text-center text-lg font-semibold">
            Modifier mon organisation
          </h2>

          <button
            type="button"
            onClick={() => onClose?.()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#222]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6">
          <StepGeneral
            type="organisation"
            name={name}
            description={description}
            avatarUrl={avatarUrl}
            errors={errors}
            onChangeName={setName}
            onChangeDescription={setDescription}
            onResetAvatar={() => setAvatarUrl(null)}
          />
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            onClick={onSubmit}
            className="relative w-full overflow-hidden rounded-2xl bg-linear-to-r from-[#7C6BF5] via-[#6A5DF0] to-[#4C46D6] py-3.5 text-base font-semibold text-white shadow-[0_14px_35px_-18px_rgba(124,107,245,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_-20px_rgba(124,107,245,0.95)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            <span className="relative z-10">
              {loading ? "Enregistrement..." : "Enregistrer les modifications"}
            </span>
            <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100">
              <span className="absolute -left-12 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-white/10 blur-xl" />
              <span className="absolute -right-10 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-white/10 blur-2xl" />
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EditOrgModal;


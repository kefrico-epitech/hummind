"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StepGeneral from "./StepGeneral";
import { CreateEntityInput } from "../../../dto/entity.dto";
import { EntityService } from "../../../services/entity.service";
import { toast } from "../../../lib/notify";
import { Button } from "../../ui/button";
import StepMembers from "./StepMembers";

export interface RecordEntityProps {
  type: "organisation" | "departement" | "salle";
  backTo: string | null;
}

const ENTITY_TYPE_BY_LABEL = {
  organisation: "ORGANISATION",
  departement: "DEPARTEMENT",
  salle: "SALLE",
} as const;

export default function RecordEntityModal({ type, backTo }: RecordEntityProps) {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const close = () => (backTo ? router.replace(backTo) : router.back());

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const validateData = () => {
    if (!name.trim() || !description.trim()) {
      setErrors({ name: ["Le nom et la description sont requis"] });
      return false;
    }
    setErrors({});
    return true;
  };

  const onSubmit = async () => {
    if (!isMounted) return;
    setLoading(true);
    setErrors({});

    if (!validateData()) {
      setLoading(false);
      return;
    }

    try {
      const payload: CreateEntityInput = {
        name,
        description,
        type: ENTITY_TYPE_BY_LABEL[type],
        ...(avatarUrl ? { picture: avatarUrl } : {}),
      };
      const res = await EntityService.create(payload);

      if (res.status !== 201) {
        throw new Error(res.error || "Une erreur s'est produite");
      }

      toast.success(`Felicitations, vous avez cree avec succes votre ${type} !`);
      close();
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

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-4xl bg-[#151515] p-6 text-sm text-white shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex-1 text-center text-lg font-semibold">
            {`Creer votre ${type}`}
          </h2>

          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#222]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-6 flex justify-center gap-4">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              currentStep === 1 ? "bg-purple-600" : "bg-gray-500"
            }`}
          >
            1
          </div>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              currentStep === 2 ? "bg-purple-600" : "bg-gray-500"
            }`}
          >
            2
          </div>
        </div>

        <div className="mt-6">
          {currentStep === 1 && (
            <StepGeneral
              type={type}
              name={name}
              description={description}
              avatarUrl={avatarUrl}
              errors={errors}
              onChangeName={setName}
              onChangeDescription={setDescription}
              onResetAvatar={() => setAvatarUrl(null)}
            />
          )}

          {currentStep === 2 && <StepMembers />}
        </div>

        <div className="mt-8 flex justify-between">
          {currentStep > 1 && (
            <Button onClick={() => setCurrentStep(currentStep - 1)}>Retour</Button>
          )}

          {currentStep < 2 ? (
            <Button onClick={() => setCurrentStep(currentStep + 1)}>Suivant</Button>
          ) : (
            <Button
              onClick={onSubmit}
              disabled={loading}
              className="relative w-full rounded-2xl bg-linear-to-r from-[#7C6BF5] via-[#6A5DF0] to-[#4C46D6] py-3.5 text-base font-semibold text-white"
            >
              {loading ? "Creation..." : `Creer ${type}`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


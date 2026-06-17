"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StepGeneral from "../common/StepGeneral";
import { CreateEntityInput } from "../../../dto/entity.dto";
import { EntityService } from "../../../services/entity.service";
import { toast } from "../../../lib/notify";
import { Button } from "../../ui/button";

export default function RecordOrganisationModal() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const close = () => router.replace("/user/organisation");

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
        type: "ORGANISATION",
        ...(avatarUrl ? { picture: avatarUrl } : {}),
      };
      const res = await EntityService.create(payload);

      if (res.status !== 201) {
        throw new Error(res.error || "Une erreur s'est produite");
      }

      toast.success(
        "Felicitations, vous avez cree avec succes votre organisation !",
      );
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

  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-4xl bg-[#151515] p-6 text-sm text-white shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex-1 text-center text-lg font-semibold">
            Creer mon organisation
          </h2>

          <button
            type="button"
            onClick={close}
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
              {loading ? "Creation..." : "Creer Organisation"}
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


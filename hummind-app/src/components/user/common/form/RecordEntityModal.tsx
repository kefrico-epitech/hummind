"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import StepFormEntity from "./StepFormEntity";
import StepFormMembers from "./StepFormMembers";

export interface RecordEntityProps {
  type: "organisation" | "departement" | "salle";
  backTo?: string | null;
  parentId?: string | null;
}

export default function RecordEntityModal({
  type,
  backTo = null,
  parentId = null,
}: RecordEntityProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [entityId, setEntityId] = useState("");

  const close = () => (backTo ? router.replace(backTo) : router.back());

  const handleSuccess = (id: string | undefined) => {
    if (!id) return;
    setEntityId(id);
    setCurrentStep(2);
  };

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

        <div className="mb-8 flex items-center justify-between px-4">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                currentStep === 1
                  ? "bg-purple-600 text-white"
                  : "border border-white/60 text-white"
              }`}
            >
              1
            </div>
            <span
              className={`mt-3 text-xs ${
                currentStep === 1 ? "text-purple-400" : "text-white/70"
              }`}
            >
              Information generale
            </span>
          </div>

          <div className="mx-6 h-px flex-1 bg-white/60" />

          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                currentStep === 2
                  ? "bg-purple-600 text-white"
                  : "border border-white/60 text-white"
              }`}
            >
              2
            </div>
            <span
              className={`mt-3 text-xs ${
                currentStep === 2 ? "text-purple-400" : "text-white/70"
              }`}
            >
              Mes responsables
            </span>
          </div>
        </div>

        <div className="mt-6">
          {currentStep === 1 && (
            <StepFormEntity
              type={type}
              onSuccess={handleSuccess}
              parentId={parentId}
            />
          )}
          {currentStep === 2 && (
            <StepFormMembers entityId={entityId} onSuccess={close} />
          )}
        </div>
      </div>
    </div>
  );
}

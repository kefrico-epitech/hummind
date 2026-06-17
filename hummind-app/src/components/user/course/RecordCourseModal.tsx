"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../ui/button";

import { Stepper } from "./stepper";
import type { WizardStep } from "./types";
import { Step1Mode } from "./steps/Step1Mode";
import { Step2General } from "./steps/Step2General";
import { useAppSelector } from "../../../store/hooks";
import { Step3Content } from "./steps/Step3Content";
import { Step4Settings } from "./steps/Step4Settings";
import { Step5Finish } from "./steps/Step5Finish";

export interface RecordCourseModalProps {
  backTo?: string | null;
  parentId?: string | null;
}

export default function RecordCourseModal({
  backTo = null,
  parentId = null,
}: RecordCourseModalProps) {
  const router = useRouter();
  const course = useAppSelector((state) => state.course);
  const close = () => (backTo ? router.replace(backTo) : router.back());

  const [step, setStep] = useState<WizardStep>(1);
  const [canNext, setCanNext] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const goPrev = () => setStep((currentStep) => (currentStep > 1 ? ((currentStep - 1) as WizardStep) : currentStep));
  const goNext = () => setStep((currentStep) => (currentStep < 5 ? ((currentStep + 1) as WizardStep) : currentStep));

  const jumpTo = (nextStep: WizardStep) => {
    if (nextStep <= step) setStep(nextStep);
  };

  const handlePrimary = async () => {
    if (step < 5) {
      goNext();
      return;
    }

    setSubmitting(true);
    try {
      console.log("SUBMIT COURSE", { parentId, ...course });
      close();
    } finally {
      setSubmitting(false);
    }
  };

  const primaryLabel = step === 4 ? "Publier" : step === 5 ? "Termine" : "Suivant";

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="absolute inset-0 flex flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={close}
              className="flex h-9 w-9 items-center justify-center"
              aria-label="Fermer"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            <div className="text-sm font-medium text-white">Creer un cours</div>
          </div>
          <div className="flex gap-4">
            <Button
              type="button"
              onClick={goPrev}
              disabled={step === 1 || submitting}
              className="h-10 cursor-pointer rounded-full bg-[#6b6b6b]/30 px-8 text-sm font-medium text-white hover:bg-primary"
            >
              Precedent
            </Button>

            <Button
              type="button"
              disabled={submitting || !canNext}
              onClick={handlePrimary}
              className={`h-10 cursor-pointer rounded-full px-8 text-sm font-medium text-white ${
                canNext ? "bg-primary hover:opacity-90" : "bg-[#6b6b6b]/30"
              }`}
            >
              {submitting ? "..." : primaryLabel}
            </Button>
          </div>
        </div>

        <Stepper current={step} onJump={jumpTo} />

        <div className="flex-1 overflow-y-auto">
          {step === 1 && <Step1Mode onValidChange={setCanNext} />}
          {step === 2 && <Step2General onValidChange={setCanNext} />}
          {step === 3 && <Step3Content onValidChange={setCanNext} />}
          {step === 4 && <Step4Settings onValidChange={setCanNext} />}
          {step === 5 && <Step5Finish onValidChange={setCanNext} />}
        </div>
      </div>
    </div>
  );
}

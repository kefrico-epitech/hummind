"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../../src/store/hooks";

export default function SwitchPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.user.user);
  const firstname = user?.firstname || "Utilisateur";

  const [phase, setPhase] = useState<"welcome" | "learner">("welcome");
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeToLearner, setFadeToLearner] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFadeIn(true), 100);
    const t2 = setTimeout(() => setFadeToLearner(true), 4000);
    const t3 = setTimeout(() => setPhase("learner"), 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0c]">
      {phase === "welcome" && (
        <h1
          className={[
            "text-center font-display text-2xl font-light tracking-wide transition-all duration-1000 sm:text-3xl md:text-4xl lg:text-5xl",
            fadeIn && !fadeToLearner
              ? "translate-y-0 opacity-100"
              : !fadeIn
                ? "translate-y-4 opacity-0"
                : "translate-y-0 opacity-0",
          ].join(" ")}
        >
          <span className="text-[#6e6e8a]">Bienvenue </span>
          <span className="bg-gradient-to-r from-[#e05c7a] to-[#c44a8a] bg-clip-text text-transparent">
            {firstname}
          </span>
          <span className="text-[#6e6e8a]"> sur </span>
          <span className="text-[#8a8acd]">HummindOS</span>
        </h1>
      )}

      {phase === "learner" && <LearnerView onDone={() => router.replace("/learner")} />}
    </div>
  );
}

function LearnerView({ onDone }: { onDone: () => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 100);
    // Redirect after the text is visible for 2 seconds
    const t2 = setTimeout(onDone, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      className={[
        "flex flex-col items-center gap-4 transition-all duration-1000",
        show ? "scale-100 opacity-100" : "scale-90 opacity-0",
      ].join(" ")}
    >
      <h1 className="text-center font-display text-5xl font-semibold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
        Apprenant
      </h1>
      <div className="h-1 w-16 rounded-full bg-gradient-to-r from-primary to-secondary" />
    </div>
  );
}

"use client";

import { useEffect } from "react";

export function Step5Finish({
  onValidChange,
}: {
  onValidChange: (ok: boolean) => void;
}) {
  // Dès que la page est affichée, on autorise la suite
  useEffect(() => {
    onValidChange(true);
  }, [onValidChange]);

  return (
    <div className="mx-auto flex min-h-auto items-center justify-center px-6">
      <div className="max-w-md w-full p-8 text-center">
        {/* Icône de succès */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-600">
          <span className="text-3xl text-white">✔</span>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-semibold text-white">
          Félicitations ! Votre cours a été créé avec succès.
        </h2>
        <p className="mt-2 text-sm text-[#9b9b9b]">
          Vous venez de créer votre cours avec succès.
        </p>
      </div>
    </div>
  );
}


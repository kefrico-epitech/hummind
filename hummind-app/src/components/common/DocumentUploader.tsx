"use client";

import * as React from "react";
import { Input } from "../ui/input";

export function DocumentUploader(props: {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  accept?: string;
  label?: string;
}) {
  const { onFileSelected, disabled, accept, label } = props;

  return (
    <div className="space-y-2">
      {label ? <div className="text-sm text-white/70">{label}</div> : null}

      <Input
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
          // permet de re-sélectionner le même fichier
          e.currentTarget.value = "";
        }}
        className="h-11 rounded-2xl border-[#3a3a3a] bg-transparent text-white focus-visible:border-[#7C6BF5]"
      />
    </div>
  );
}

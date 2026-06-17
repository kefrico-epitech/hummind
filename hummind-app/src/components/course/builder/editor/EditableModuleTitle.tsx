"use client";

import React, { useState } from "react";
import { Pencil } from "lucide-react";

type Props = {
  title: string;
  placeholder?: string;
  onRename: (next: string) => void;
};

export function EditableModuleTitle({
  title,
  placeholder = "Module",
  onRename,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  const commit = () => {
    const next = draft.trim();
    onRename(next || placeholder);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(title);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="group inline-flex min-w-0 max-w-full items-center gap-1.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-5 text-white sm:text-[15px]">
            {title?.trim() ? title : placeholder}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDraft(title);
            setEditing(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              setDraft(title);
              setEditing(true);
            }
          }}
          className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/75 transition hover:bg-white/10 hover:text-white md:opacity-0 md:group-hover:opacity-100"
          aria-label="Renommer"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") cancel();
      }}
      className="w-full min-w-0 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm font-semibold leading-5 text-white outline-none transition placeholder:text-white/35 focus:border-[#7C6BF5]/70 focus:ring-4 focus:ring-[#7C6BF5]/15 sm:text-[15px]"
      placeholder={placeholder}
    />
  );
}

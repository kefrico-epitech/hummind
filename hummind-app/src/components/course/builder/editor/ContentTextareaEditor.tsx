"use client";

import React, { useRef } from "react";

type Props = {
  value: string;
  onChange: (nextText: string) => void;
  placeholder?: string;
  selected?: boolean;
};

const MARKERS = [
  { label: "Objectif", insert: "Objectif du chapitre:\n" },
  { label: "Définition", insert: "Definition:\n" },
  { label: "Exemple", insert: "Exemple concret:\n" },
  { label: "Point-clé", insert: "Point-cle a retenir:\n" },
  { label: "$f(x)$", insert: null as unknown as string }, // special: wraps selection
];

export function ContentTextareaEditor({
  value,
  onChange,
  placeholder = "Écrivez le contenu ici...",
  selected = true,
}: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const insertLatexWrap = () => {
    const textarea = ref.current;
    if (!textarea) {
      onChange((value ? value + " " : "") + "$formule$");
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.slice(start, end);
    const before = value.slice(0, start);
    const after = value.slice(end);

    if (selectedText) {
      // Wrap selection with $...$
      const newValue = before + "$" + selectedText + "$" + after;
      onChange(newValue);
      requestAnimationFrame(() => {
        textarea.selectionStart = start;
        textarea.selectionEnd = end + 2; // include the $ delimiters
        textarea.focus();
      });
    } else {
      // Insert template
      const template = "$formule$";
      const newValue = before + template + after;
      onChange(newValue);
      requestAnimationFrame(() => {
        // Select "formule" so user can type over it
        textarea.selectionStart = start + 1;
        textarea.selectionEnd = start + 1 + "formule".length;
        textarea.focus();
      });
    }
  };

  const insertMarker = (marker: string) => {
    const textarea = ref.current;
    if (!textarea) {
      onChange((value ? value + "\n\n" : "") + marker);
      return;
    }

    const start = textarea.selectionStart;
    const before = value.slice(0, start);
    const after = value.slice(start);

    // Add double newline before marker if there's content before
    const prefix = before && !before.endsWith("\n\n")
      ? before.endsWith("\n") ? "\n" : "\n\n"
      : "";

    const newValue = before + prefix + marker + after;
    onChange(newValue);

    // Move cursor after the inserted marker
    requestAnimationFrame(() => {
      const cursorPos = start + prefix.length + marker.length;
      textarea.selectionStart = cursorPos;
      textarea.selectionEnd = cursorPos;
      textarea.focus();
    });
  };

  return (
    <div>
      {/* Marker insertion bar */}
      <div className="mb-2 flex flex-wrap gap-1.5">
        {MARKERS.map((m) => (
          <button
            key={m.label}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (m.insert === null) {
                insertLatexWrap();
              } else {
                insertMarker(m.insert);
              }
            }}
            className={[
              "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium transition",
              m.insert === null
                ? "border-[#7C6BF5]/30 bg-[#7C6BF5]/10 text-[#A9A2FF] hover:bg-[#7C6BF5]/25"
                : "border-white/10 bg-white/5 text-white/50 hover:bg-[#7C6BF5]/15 hover:text-[#7C6BF5]",
            ].join(" ")}
          >
            {m.insert === null ? m.label : `+ ${m.label}`}
          </button>
        ))}
      </div>

      <textarea
        ref={ref}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={[
          "min-h-32 w-full resize-y rounded-xl border bg-transparent px-4 py-3",
          "text-sm leading-relaxed text-white placeholder:text-white/20 placeholder:italic outline-none transition",
          selected
            ? "border-[#7C6BF5]/70 ring-4 ring-[#7C6BF5]/15 bg-black/20"
            : "border-transparent hover:border-white/10 hover:bg-black/10",
        ].join(" ")}
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}

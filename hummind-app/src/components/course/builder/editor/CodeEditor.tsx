"use client";

import React from "react";
import Editor from "@monaco-editor/react";
import { Input } from "../../../ui/input";

export function CodeEditor({
  value,
  onChange,
}: {
  value: { language?: string; code?: string } | undefined;
  onChange: (next: { language: string; code: string }) => void;
}) {
  const lang = value?.language ?? "javascript";
  const code = value?.code ?? "";

  return (
    <div className="space-y-3">
      {/* Sélecteur de langage */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/60">Langage</span>
        <Input
          value={lang}
          onChange={(e) => onChange({ language: e.target.value, code })}
          className="h-9"
          placeholder="javascript / typescript / python..."
        />
      </div>

      {/* Monaco Editor */}
      <div className="border border-white/10 rounded-xl overflow-hidden">
        <Editor
          height="300px"
          language={lang}
          value={code}
          theme="vs-dark"
          onChange={(val) => onChange({ language: lang, code: val ?? "" })}
          options={{
            fontSize: 12,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}

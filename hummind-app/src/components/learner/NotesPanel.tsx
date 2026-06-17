"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, PenLine, Plus, Trash2, X } from "lucide-react";
import type { CourseNote } from "../../hooks/useLearnerNotes";

interface NotesPanelProps {
  notes: CourseNote[];
  moduleId?: string;
  stepId?: string;
  onAdd: (content: string, moduleId?: string, stepId?: string) => Promise<unknown>;
  onUpdate: (noteId: string, content: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
  onClose: () => void;
}

export function NotesPanel({
  notes,
  moduleId,
  stepId,
  onAdd,
  onUpdate,
  onDelete,
  onClose,
}: NotesPanelProps) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-dismiss confirm after 3s
  useEffect(() => {
    if (!confirmDeleteId) return;
    const t = setTimeout(() => setConfirmDeleteId(null), 3000);
    return () => clearTimeout(t);
  }, [confirmDeleteId]);

  const handleAdd = async () => {
    const trimmed = draft.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await onAdd(trimmed, moduleId, stepId);
      setDraft("");
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (noteId: string) => {
    const trimmed = editingContent.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await onUpdate(noteId, trimmed);
      setEditingId(null);
      setEditingContent("");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    setDeletingId(noteId);
    try {
      await onDelete(noteId);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-sm flex-col border-l border-white/8 bg-[#1E1F22] shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div className="flex items-center gap-2">
          <PenLine className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-white">Mes notes</h2>
          <span className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-white/50">
            {notes.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer les notes"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/8 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* New note input */}
      <div className="border-b border-white/6 px-4 py-3">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              void handleAdd();
            }
          }}
          placeholder="Ajouter une note..."
          rows={3}
          className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-white/30">
            {savedFlash ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <Check className="h-3 w-3" /> Sauvegardé
              </span>
            ) : (
              "Ctrl+Entrée pour sauvegarder"
            )}
          </span>
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={!draft.trim() || saving}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/80 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
            Ajouter
          </button>
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {sortedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <PenLine className="mb-3 h-8 w-8 text-white/20" />
            <p className="text-sm text-white/40">Aucune note pour ce cours</p>
            <p className="mt-1 text-xs text-white/25">
              Ajoutez des notes pour retenir les points importants
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedNotes.map((note) => {
              const isEditing = editingId === note.id;
              const isDeleting = deletingId === note.id;
              const isConfirmingDelete = confirmDeleteId === note.id;
              const isCurrentContext =
                note.moduleId === moduleId || note.stepId === stepId;

              return (
                <div
                  key={note.id}
                  className={[
                    "group rounded-xl border px-3 py-2.5 transition",
                    isCurrentContext
                      ? "border-primary/25 bg-primary/5"
                      : "border-white/6 bg-white/[0.02]",
                  ].join(" ")}
                >
                  {isEditing ? (
                    <div>
                      <textarea
                        autoFocus
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            void handleUpdate(note.id);
                          }
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        rows={3}
                        className="w-full resize-none rounded-lg bg-transparent text-sm text-white outline-none"
                      />
                      <div className="mt-1.5 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-full px-2.5 py-1 text-xs text-white/50 hover:text-white"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleUpdate(note.id)}
                          disabled={saving}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/80 px-2.5 py-1 text-xs text-white hover:bg-primary disabled:opacity-50"
                        >
                          {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                          Sauvegarder
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                        {note.content}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-white/25">
                          {new Date(note.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            aria-label="Modifier la note"
                            onClick={() => {
                              setEditingId(note.id);
                              setEditingContent(note.content);
                            }}
                            className="rounded-full p-1.5 text-white/40 hover:bg-white/8 hover:text-white"
                          >
                            <PenLine className="h-3 w-3" />
                          </button>

                          {isConfirmingDelete ? (
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => void handleDelete(note.id)}
                              className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-1 text-[11px] font-medium text-red-400 hover:bg-red-500/30"
                            >
                              {isDeleting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Confirmer"
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              aria-label="Supprimer la note"
                              onClick={() => setConfirmDeleteId(note.id)}
                              className="rounded-full p-1.5 text-white/40 hover:bg-red-500/15 hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

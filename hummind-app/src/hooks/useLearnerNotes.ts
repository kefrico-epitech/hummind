"use client";

import { useCallback, useEffect, useState } from "react";
import { safeFetch } from "../services/safeFetch";

export interface CourseNote {
  id: string;
  moduleId: string | null;
  stepId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export function useLearnerNotes(courseId: string) {
  const [notes, setNotes] = useState<CourseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    const res = await safeFetch<CourseNote[]>(`/learner/notes/${courseId}`, {
      method: "GET",
    });
    if (res.data) {
      setNotes(res.data);
    } else if (res.error) {
      setError(res.error);
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const addNote = useCallback(
    async (content: string, moduleId?: string, stepId?: string) => {
      const res = await safeFetch<CourseNote>(`/learner/notes/${courseId}`, {
        method: "POST",
        body: { content, moduleId, stepId },
      });
      if (res.data) {
        setNotes((prev) => [res.data!, ...prev]);
        return res.data;
      }
      return null;
    },
    [courseId],
  );

  const updateNote = useCallback(async (noteId: string, content: string) => {
    const res = await safeFetch<CourseNote>(`/learner/notes/${noteId}`, {
      method: "PATCH",
      body: { content },
    });
    if (res.status < 400) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? { ...n, content, updatedAt: new Date().toISOString() }
            : n,
        ),
      );
    }
  }, []);

  const deleteNote = useCallback(async (noteId: string) => {
    const res = await safeFetch(`/learner/notes/${noteId}`, {
      method: "DELETE",
    });
    if (res.status < 400) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    }
  }, []);

  return { notes, loading, error, addNote, updateNote, deleteNote, reload: loadNotes };
}

"use client";

import type { Module } from "./types";
import { DocumentPreviewViewer } from "../../course/common/DocumentPreviewViewer";

export function CoursePreviewModal({
  open,
  onClose,
  modules,
  title = "Cours",
  description,
  domain,
  level,
  objectives,
}: {
  open: boolean;
  onClose: () => void;
  modules: Module[];
  title?: string;
  description?: string;
  domain?: string;
  level?: string;
  objectives?: string[];
}) {
  if (!open) return null;

  return (
    <DocumentPreviewViewer
      open={open}
      onClose={onClose}
      meta={{
        title,
        description,
        domain,
        level,
        objectives,
      }}
      modules={modules}
    />
  );
}

"use client";

import React from "react";
import type { Module } from "../types";
import { DocumentPreviewViewer } from "../common/DocumentPreviewViewer";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  domain?: string;
  level?: string;
  objectives?: string[];
  modules: Module[];
};

export function DocumentPreviewModal({
  open,
  onClose,
  title,
  description,
  domain,
  level,
  objectives,
  modules,
}: Props) {
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

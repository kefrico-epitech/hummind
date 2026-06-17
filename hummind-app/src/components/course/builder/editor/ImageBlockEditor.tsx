"use client";

import React, { useRef, useState } from "react";
import {
  uploadToCloudinary,
  replaceImageInCloudinary,
  deleteImageFromCloudinary,
} from "../../../../lib/cloudinaryHelper";
import { toast } from "../../../../lib/notify";
import { Input } from "../../../ui/input";
import { AiService } from "../../../../services/ai.service";

type ImageEditorValue = {
  url: string;
  alt?: string;
  caption: string;
  width?: number;
  height?: number;
};

type ImageEditorProps = {
  value: ImageEditorValue;
  onChange: (value: ImageEditorValue) => void;
};

type SourceMode = "upload" | "ai";

const SOURCE_OPTIONS: Array<{ id: SourceMode; label: string }> = [
  { id: "upload", label: "Import local" },
  { id: "ai", label: "Generation IA" },
];

const inputClass =
  "h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/40 focus-visible:border-[#7C6BF5]/70 focus-visible:ring-2 focus-visible:ring-[#7C6BF5]/20";

const buttonClass =
  "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/85 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50";

export function ImageBlockEditor({ value, onChange }: ImageEditorProps) {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [imageRatio, setImageRatio] = useState(16 / 9);
  const [sourceMode, setSourceMode] = useState<SourceMode>("upload");
  const [aiPrompt, setAiPrompt] = useState("");

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  const syncImageMetrics = React.useCallback(
    (img: HTMLImageElement) => {
      if (img.naturalWidth <= 0 || img.naturalHeight <= 0) return;

      const nextWidth = img.naturalWidth;
      const nextHeight = img.naturalHeight;
      setImageRatio(nextWidth / nextHeight);

      if (value.width === nextWidth && value.height === nextHeight) return;

      onChange({
        ...value,
        width: nextWidth,
        height: nextHeight,
      });
    },
    [onChange, value],
  );

  const handleImageUpload = async (file: File) => {
    setLoading(true);
    try {
      const url = await uploadToCloudinary(file);
      if (!url) {
        toast.error("L'upload de l'image a echoue.");
        return;
      }
      onChange({ ...value, url, width: undefined, height: undefined });
      toast.success("Image uploadee avec succes.");
    } catch {
      toast.error("Erreur lors de l'upload de l'image.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    await handleImageUpload(file);
    input.value = "";
  };

  const handleReplaceFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file || !value.url) return;

    setLoading(true);
    try {
      const url = await replaceImageInCloudinary(file);
      if (!url) {
        toast.error("Le remplacement de l'image a echoue.");
        return;
      }
      onChange({ ...value, url, width: undefined, height: undefined });
      toast.success("Image remplacee avec succes.");
    } catch {
      toast.error("Erreur lors du remplacement de l'image.");
    } finally {
      setLoading(false);
      input.value = "";
    }
  };

  const handleDeleteImage = async () => {
    await deleteImageFromCloudinary();
    onChange({ ...value, url: "", width: undefined, height: undefined });
    toast.success("Image retiree.");
  };

  const handleGenerateWithAi = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) {
      toast.error("Saisissez une description pour generer l'image.");
      return;
    }

    setAiLoading(true);
    try {
      const res = await AiService.imageGenerate({ prompt, size: "1024x1024" });
      if (res.error || !res.data?.url) {
        throw new Error(res.error || "Aucune image retournee");
      }

      onChange({
        ...value,
        url: res.data.url,
        caption: value.caption?.trim() ? value.caption : prompt,
        alt: value.alt?.trim() ? value.alt : prompt,
        width: undefined,
        height: undefined,
      });

      toast.success("Image IA generee.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de generer l'image IA.",
      );
    } finally {
      setAiLoading(false);
    }
  };

  const baseHeight = imageRatio >= 1 ? 280 : 360;
  const previewHeight = Math.max(
    180,
    Math.min(760, Math.round(baseHeight * (previewZoom / 100))),
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-wide text-white/45">Apercu</p>
        <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/30">
          {value.url ? (
            <div
              className="flex w-full items-center justify-center px-2 py-2"
              style={{ height: `${previewHeight}px` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value.url}
                alt={value.caption || value.alt || "Image"}
                onLoad={(e) => {
                  syncImageMetrics(e.currentTarget);
                }}
                className="h-full w-full rounded-md object-contain"
              />
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-white/45">
              Aucune image selectionnee
            </div>
          )}
        </div>

        {value.url ? (
          <div className="mt-3 space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] text-white/55">
                <span>Zoom apercu</span>
                <span>{previewZoom}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={200}
                step={5}
                value={previewZoom}
                onChange={(e) => setPreviewZoom(Number(e.target.value))}
                className="w-full accent-[#7C6BF5]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={buttonClass}
                onClick={() => replaceInputRef.current?.click()}
                disabled={loading}
              >
                Remplacer
              </button>
              <button
                type="button"
                className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleDeleteImage}
                disabled={loading}
              >
                Supprimer
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <label className="mb-2 block text-xs uppercase tracking-wide text-white/45">
          Type de source
        </label>
        <select
          value={sourceMode}
          onChange={(e) => setSourceMode(e.target.value as SourceMode)}
          className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-[#7C6BF5]/70"
        >
          {SOURCE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id} className="bg-[#0E1118] text-white">
              {option.label}
            </option>
          ))}
        </select>

        {sourceMode === "upload" ? (
          <div className="mt-3 space-y-3">
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              disabled={loading}
            />
            <input
              ref={replaceInputRef}
              type="file"
              accept="image/*"
              onChange={handleReplaceFile}
              className="hidden"
              disabled={loading}
            />

            <button
              type="button"
              className="flex h-12 w-full items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/30 text-sm text-white/75 transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => uploadInputRef.current?.click()}
              disabled={loading}
            >
              {loading ? "Upload..." : "Importer une image"}
            </button>
            <p className="text-xs text-white/45">
              Formats supportes: PNG, JPG, WEBP.
            </p>
          </div>
        ) : null}

        {sourceMode === "ai" ? (
          <div className="mt-3 space-y-3">
            <Input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ex: schema propre d'un montage RC"
              className={inputClass}
            />
            <button
              type="button"
              onClick={handleGenerateWithAi}
              disabled={aiLoading}
              className={buttonClass}
            >
              {aiLoading ? "Generation..." : "Generer image IA"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-wide text-white/45">
            Legende
          </label>
          <Input
            value={value.caption}
            onChange={(e) => onChange({ ...value, caption: e.target.value })}
            placeholder="Legende de l'image"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-wide text-white/45">
            Texte alternatif
          </label>
          <Input
            value={value.alt || ""}
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
            placeholder="Description pour accessibilite"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}


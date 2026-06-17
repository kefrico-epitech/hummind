"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "../../ui/dialog";
import {
  getManualDocumentOutline,
  getManualDocumentStats,
  renderManualDocumentHtml,
  type ManualDocumentMeta,
  type ManualRenderableModule,
} from "../../../lib/course/manualDocument";

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  meta: ManualDocumentMeta;
  modules: ManualRenderableModule[];
  onDownload?: () => void;
};

function buildFileName(title: string) {
  return (title.trim() || "cours")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

async function waitForDocumentReady(doc: Document, win: Window) {
  if (doc.readyState === "complete") return;

  await new Promise<void>((resolve) => {
    const finish = () => resolve();
    win.addEventListener("load", finish, { once: true });
    win.setTimeout(finish, 1000);
  });
}

async function waitForDocumentAssets(doc: Document) {
  const imagePromises = Array.from(doc.images).map((image) => {
    if (image.complete) return Promise.resolve();

    return new Promise<void>((resolve) => {
      const done = () => resolve();
      image.addEventListener("load", done, { once: true });
      image.addEventListener("error", done, { once: true });
    });
  });

  const fonts = "fonts" in doc ? (doc as Document & { fonts: FontFaceSet }).fonts : null;
  const fontsReady = fonts ? fonts.ready.catch(() => undefined) : Promise.resolve();

  await Promise.all([fontsReady, ...imagePromises]);
}

export function DocumentPreviewViewer({
  open,
  onClose,
  meta,
  modules,
  onDownload,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [zoom, setZoom] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    if (window.innerWidth < 640) return 0.5;
    if (window.innerWidth < 1024) return 0.75;
    return 1;
  });
  const [currentPage, setCurrentPage] = useState<number>(1);

  const outline = useMemo(() => getManualDocumentOutline(modules), [modules]);
  const stats = useMemo(() => getManualDocumentStats(modules), [modules]);
  const previewHtml = useMemo(
    () => renderManualDocumentHtml(meta, modules, { screenScale: zoom }),
    [meta, modules, zoom],
  );

  const handleBrowserPrintFallback = async () => {
    const iframe = iframeRef.current;
    const iframeDoc = iframe?.contentDocument;
    const iframeWin = iframe?.contentWindow;

    try {
      if (iframeDoc && iframeWin) {
        await waitForDocumentReady(iframeDoc, iframeWin);
        await waitForDocumentAssets(iframeDoc);
        iframeWin.focus();
        iframeWin.setTimeout(() => iframeWin.print(), 120);
        return;
      }
    } catch {
      // Continue with secondary fallback below.
    }

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) {
      throw new Error("Impossible d'ouvrir la fenetre d'impression.");
    }

    printWindow.document.open();
    printWindow.document.write(previewHtml);
    printWindow.document.close();

    await waitForDocumentReady(printWindow.document, printWindow);
    await waitForDocumentAssets(printWindow.document);

    const closeAfterPrint = () => {
      printWindow.removeEventListener("afterprint", closeAfterPrint);
      printWindow.close();
    };

    printWindow.addEventListener("afterprint", closeAfterPrint, { once: true });
    printWindow.focus();
    printWindow.setTimeout(() => printWindow.print(), 120);
  };

  const handlePrint = async (pdfTab: Window | null) => {
    const fileNameBase = buildFileName(meta.title);

    try {
      if (pdfTab && !pdfTab.closed) {
        pdfTab.document.title = "Generation du PDF...";
        pdfTab.document.body.innerHTML =
          "<div style=\"font-family:Arial,sans-serif;padding:24px;color:#111827\">Generation du PDF en cours...</div>";
      }

      const response = await fetch("/api/course/manual-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ meta, modules }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "Generation du PDF impossible.");
      }

      const blob = await response.blob();
      if (!blob.size) {
        throw new Error("Le PDF genere est vide.");
      }

      const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);

      if (pdfTab && !pdfTab.closed) {
        pdfTab.location.href = pdfUrl;
      } else {
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `${fileNameBase || "cours"}-manuel.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
      return;
    } catch {
      if (pdfTab && !pdfTab.closed) {
        pdfTab.close();
      }

      if (onDownload) {
        onDownload();
        return;
      }

      await handleBrowserPrintFallback();
    }
  };

  const totalPages = outline.length;
  const activeOutline =
    outline.find((item) => item.pageNumber === currentPage) ?? outline[0];

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let cleanup: (() => void) | undefined;

    const bindScrollTracking = () => {
      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win) return;

      const pages = Array.from(
        doc.querySelectorAll<HTMLElement>(".page[data-page-number]"),
      );

      const updateCurrentPage = () => {
        const viewportTop = win.scrollY + 32;
        let nextPage = 1;

        for (const page of pages) {
          const pageTop = page.offsetTop;
          const pageNumber = Number(page.dataset.pageNumber || "1");
          if (viewportTop >= pageTop) nextPage = pageNumber;
        }

        setCurrentPage(nextPage);
      };

      updateCurrentPage();
      win.addEventListener("scroll", updateCurrentPage, { passive: true });
      cleanup = () => win.removeEventListener("scroll", updateCurrentPage);
    };

    iframe.addEventListener("load", bindScrollTracking);
    bindScrollTracking();

    return () => {
      iframe.removeEventListener("load", bindScrollTracking);
      cleanup?.();
    };
  }, [previewHtml]);

  const jumpToPage = (id: string, pageNumber: number) => {
    const doc = iframeRef.current?.contentDocument;
    const target = doc?.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setCurrentPage(pageNumber);
  };

  const goToRelativePage = (direction: -1 | 1) => {
    const next = Math.min(totalPages, Math.max(1, currentPage + direction));
    const item = outline.find((o) => o.pageNumber === next);
    if (item) jumpToPage(item.id, item.pageNumber);
  };

  const zoomOut = () => {
    setZoom((c) => {
      const i = ZOOM_LEVELS.findIndex((v) => v === c);
      return ZOOM_LEVELS[Math.max(0, i - 1)] ?? c;
    });
  };

  const zoomIn = () => {
    setZoom((c) => {
      const i = ZOOM_LEVELS.findIndex((v) => v === c);
      return ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, i + 1)] ?? c;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        fullscreen
        className="z-[320] bg-transparent"
      >
        <DialogTitle className="sr-only">
          Aperçu du cours {meta.title?.trim() || "sans titre"}
        </DialogTitle>

        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#202124] text-white">
          {/* ─── Header ─── */}
          <header className="relative z-20 shrink-0 border-b border-white/8 bg-[#202124] px-3 py-2.5 shadow-[0_8px_30px_-18px_rgba(0,0,0,0.8)] sm:px-4 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/75 transition hover:bg-white/8"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Title */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/90">
                  {meta.title?.trim() || "Cours sans titre"}
                </p>
                <p className="text-[11px] text-white/40">
                  {activeOutline?.label} · {currentPage}/{totalPages}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                {/* Pagination */}
                <button
                  type="button"
                  onClick={() => goToRelativePage(-1)}
                  disabled={currentPage <= 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/8 disabled:opacity-30"
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="hidden min-w-[48px] text-center text-xs font-medium text-white/70 sm:inline-block">
                  {currentPage}/{totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => goToRelativePage(1)}
                  disabled={currentPage >= totalPages}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/8 disabled:opacity-30"
                  aria-label="Page suivante"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Separator */}
                <div className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />

                {/* Zoom */}
                <button
                  type="button"
                  onClick={zoomOut}
                  disabled={zoom <= ZOOM_LEVELS[0]}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/8 disabled:opacity-30"
                  aria-label="Réduire"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>

                <span className="hidden min-w-[42px] text-center text-xs font-medium text-white/70 sm:inline-block">
                  {Math.round(zoom * 100)}%
                </span>

                <button
                  type="button"
                  onClick={zoomIn}
                  disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/8 disabled:opacity-30"
                  aria-label="Agrandir"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>

                {/* Separator */}
                <div className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />

                {/* Download */}
                <button
                  type="button"
                  onClick={() => {
                    const pdfTab = window.open("", "_blank");
                    void handlePrint(pdfTab);
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#8ab4f8] px-3 text-xs font-semibold text-[#0f172a] transition hover:brightness-105 sm:px-4"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Imprimer</span>
                </button>
              </div>
            </div>
          </header>

          {/* ─── Body ─── */}
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[240px_minmax(0,1fr)]">
            {/* Sidebar — desktop only */}
            <aside className="hidden min-h-0 overflow-y-auto border-r border-white/8 bg-[#2b2c30] lg:block">
              <div className="border-b border-white/8 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                  Sommaire
                </p>
                <p className="mt-1 text-xs text-white/60">
                  {stats.chapterCount} chapitre{stats.chapterCount > 1 ? "s" : ""} · {totalPages} page{totalPages > 1 ? "s" : ""}
                </p>
              </div>

              <div className="space-y-1 p-2">
                {outline.map((item) => {
                  const isActive = item.pageNumber === currentPage;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => jumpToPage(item.id, item.pageNumber)}
                      className={[
                        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition",
                        isActive
                          ? "bg-[#8ab4f8]/15 text-[#8ab4f8]"
                          : "text-white/60 hover:bg-white/5 hover:text-white/80",
                      ].join(" ")}
                    >
                      <span className={[
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold",
                        isActive ? "bg-[#8ab4f8]/20 text-[#8ab4f8]" : "bg-white/8 text-white/50",
                      ].join(" ")}>
                        {item.pageNumber}
                      </span>
                      <span className="min-w-0 truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Main viewer */}
            <main className="min-h-0 overflow-hidden bg-[#1a1b1e]">
              <iframe
                ref={iframeRef}
                title="Aperçu du cours"
                srcDoc={previewHtml}
                className="block h-full w-full border-0"
              />
            </main>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
